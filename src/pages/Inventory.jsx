import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, Filter, ShoppingCart, ScanLine, Smartphone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Inventory() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock
  const queryClient = useQueryClient();

  // Fetch Suppliers for dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('store_name', 100),
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100),
  });

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
    // In a real app with a library like html5-qrcode, this would open the camera.
    // For now, we'll focus the barcode input which often triggers the mobile keyboard's scanner.
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

  return (
    <div className="space-y-8">
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input 
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                placeholder="e.g. 3-inch Drywall Screws"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity On Hand</Label>
                <Input 
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="e.g. box"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reorder Point (Low Stock Alert)</Label>
              <Input 
                type="number"
                value={formData.reorder_point}
                onChange={(e) => setFormData({...formData, reorder_point: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Barcode / SKU</Label>
              <div className="flex gap-2">
                <Input 
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  placeholder="Scan or enter barcode"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleScan} title="Scan Barcode">
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Supplier</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(val) => setFormData({...formData, supplier_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.store_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate(formData)} className="bg-indigo-600">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-9 bg-white"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilter('low_stock')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filter === 'low_stock' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle className="w-3 h-3" /> Low Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory?.map(item => {
          const isLowStock = item.quantity <= item.reorder_point;
          return (
            <Card key={item.id} className={`hover:shadow-md transition-all ${isLowStock ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Package className="w-5 h-5" />
                  </div>
                  {isLowStock && (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 gap-1">
                      <AlertTriangle className="w-3 h-3" /> Reorder
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 mb-1">{item.item_name}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Supplier: {item.supplier_id ? getSupplierName(item.supplier_id) : 'None'}
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
                      <p className={`text-2xl font-bold ${isLowStock ? 'text-orange-600' : 'text-slate-900'}`}>
                        {item.quantity} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Reorder At</p>
                      <p className="text-lg font-semibold text-slate-700">{item.reorder_point}</p>
                    </div>
                  </div>
                  
                  {/* Visual Stock Indicator */}
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(100, (item.quantity / (item.reorder_point * 2)) * 100)} 
                      className={`h-2 ${isLowStock ? 'bg-orange-100' : 'bg-slate-100'}`}
                      indicatorClassName={isLowStock ? 'bg-orange-500' : item.quantity < item.reorder_point * 1.5 ? 'bg-yellow-500' : 'bg-green-500'}
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-2 border-t border-slate-100/50 pt-3">
                  {isLowStock ? (
                     <Button 
                       size="sm" 
                       className="bg-orange-600 hover:bg-orange-700 text-white flex-1 mr-2"
                       onClick={() => handleOrder(item)}
                     >
                       <ShoppingCart className="w-4 h-4 mr-2" /> Order Now
                     </Button>
                  ) : (
                    <div className="flex-1"></div>
                  )}
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                      <Edit className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if(confirm('Delete this item?')) deleteMutation.mutate(item.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                    <Edit className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if(confirm('Delete this item?')) deleteMutation.mutate(item.id);
                  }}>
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}