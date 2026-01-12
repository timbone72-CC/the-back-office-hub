// ========== FILE: pages/Inventory.jsx ==========

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, Filter, ShoppingCart, ScanLine, Smartphone, Mail, History, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Inventory() {
  // SECTION 1: STATE INITIALIZATION
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState('manual_adjustment'); // manual_adjustment, restock
  
  const queryClient = useQueryClient();

  // SECTION 2: DATA FETCHING (QUERIES)
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('store_name', 100),
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100),
  });

  const { data: itemHistory } = useQuery({
    queryKey: ['stock-history', selectedItem?.id],
    queryFn: () => base44.entities.StockTransaction.filter({ inventory_id: selectedItem.id }, '-date', 50),
    enabled: !!selectedItem && isHistoryOpen
  });

  // SECTION 3: FORM & MODAL HANDLERS
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 0,
    unit: 'each',
    reorder_point: 5,
    supplier_id: '',
    barcode: ''
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ item_name: '', quantity: 0, unit: 'each', reorder_point: 5, supplier_id: '', barcode: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      reorder_point: item.reorder_point,
      supplier_id: item.supplier_id || '',
      barcode: item.barcode || ''
    });
    setIsCreateOpen(true);
  };

  // SECTION 4: MUTATIONS (CRUD & STOCK ADJUSTMENT)
  const mutation = useMutation({
    mutationFn: (data) => {
      if (editingItem) {
        return base44.entities.Inventory.update(editingItem.id, data);
      }
      return base44.entities.Inventory.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setIsCreateOpen(false);
      toast.success(editingItem ? 'Item updated' : 'Item added');
    },
    onError: () => toast.error('Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      toast.success('Item deleted');
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, amount, type, reason }) => {
      const item = inventory.find(i => i.id === id);
      const delta = Number(amount);
      if (isNaN(delta)) throw new Error("Invalid quantity amount");
      
      const newQty = item.quantity + delta;
      const batchId = crypto.randomUUID();

      await base44.entities.Inventory.update(id, { quantity: newQty });
      
      await base44.entities.StockTransaction.create({
        inventory_id: id,
        quantity_change: delta,
        transaction_type: type,
        reference_note: reason || 'Manual adjustment',
        batch_id: batchId, 
        date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['stock-history']);
      setIsAdjustOpen(false);
      setAdjustAmount(0);
      setAdjustReason('');
      toast.success('Stock adjusted');
    }
  });

  // SECTION 5: UTILITY FUNCTIONS & ACTIONS
  const handleOpenHistory = (item) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
  };

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setAdjustAmount(0);
    setAdjustType('manual_adjustment');
    setAdjustReason('');
    setIsAdjustOpen(true);
  };

  const getSupplier = (id) => suppliers?.find(s => s.id === id);
  const getSupplierName = (id) => getSupplier(id)?.store_name || 'Unknown';

  const handleOrder = (item) => {
    const supplier = getSupplier(item.supplier_id);
    if (!supplier) {
      toast.error("No supplier linked to this item");
      return;
    }

    const subject = `Order: ${item.item_name}`;
    const body = `Hi ${supplier.contact_person || 'there'},\n\nI need to order more ${item.item_name}.\nMy current stock is ${item.quantity} ${item.unit}.\n\nPlease let me know availability and pricing.\n\nThanks,`;

    if (supplier.email) {
      window.location.href = `mailto:${supplier.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (supplier.phone) {
      window.location.href = `sms:${supplier.phone}?body=${encodeURIComponent(body)}`;
    } else {
      toast.error("Supplier has no email or phone number");
    }
  };

  const handleScan = () => {
    const input = document.getElementById('barcode');
    if (input) {
      input.focus();
      toast.info("Ready to scan. Use your keyboard's camera/scanner.");
    }
  };

  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low_stock') {
      return matchesSearch && item.quantity <= item.reorder_point;
    }
    return matchesSearch;
  });

  // SECTION 6: RENDER MAIN VIEW
  return (
    <div className="space-y-8">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track stock levels and reorder points</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* SECTION 7: DIALOGS (CREATE, HISTORY, ADJUST) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        {/* ... Create/Edit Content ... */}
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        {/* ... History Content ... */}
      </Dialog>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        {/* ... Adjustment Content ... */}
      </Dialog>

      {/* SECTION 8: SEARCH & FILTERS */}
      <div className="flex gap-4 items-center">
        {/* ... Search bar and All/Low Stock toggle ... */}
      </div>

      {/* SECTION 9: INVENTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ... Map filteredInventory to Cards ... */}
      </div>
    </div>
  );
}