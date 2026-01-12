// ========== FILE: pages/JobKits.jsx ==========

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, Trash2, Save, X, Pencil, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { toast } from 'sonner';

export default function JobKits() {
  // SECTION 1: STATE INITIALIZATION
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({ name: '', description: '', items: [] });
  const [editingId, setEditingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const queryClient = useQueryClient();

  // SECTION 2: DATA FETCHING (QUERIES)
  const { data: pricing } = useQuery({
    queryKey: ['material-pricing'],
    queryFn: () => base44.entities.MaterialPricing.list('material_id', 1000),
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100),
  });

  const { data: kits, isLoading } = useQuery({
    queryKey: ['job-kits'],
    queryFn: () => base44.entities.JobKit.list('name', 100),
  });

  // SECTION 3: DATA MUTATIONS (CREATE, UPDATE, DELETE)
  const createKitMutation = useMutation({
    mutationFn: (data) => base44.entities.JobKit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['job-kits']);
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', items: [] });
      toast.success('Job Kit created successfully');
    },
  });

  const updateKitMutation = useMutation({
    mutationFn: (data) => base44.entities.JobKit.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['job-kits']);
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', items: [] });
      setEditingId(null);
      toast.success('Job Kit updated successfully');
    },
  });

  const deleteKitMutation = useMutation({
    mutationFn: (id) => base44.entities.JobKit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['job-kits']);
      toast.success('Job Kit deleted');
    },
  });

  // SECTION 4: DIALOG & FORM HANDLERS
  const handleCreateOpen = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', items: [] });
    setSelectedItems([]);
    setIsDialogOpen(true);
  };

  const handleEditOpen = (kit) => {
    setEditingId(kit.id);
    setFormData({
        name: kit.name,
        description: kit.description,
        items: kit.items ? JSON.parse(JSON.stringify(kit.items)) : []
    });
    setSelectedItems([]);
    setIsDialogOpen(true);
  };

  const addKitItem = () => {
    setFormData({ ...formData, items: [...formData.items, { inventory_id: '', quantity: 1 }] });
  };

  const updateKitItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const removeKitItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
    setSelectedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  // SECTION 5: SELECTION & CALCULATION LOGIC
  const toggleSelectAll = () => {
      if (selectedItems.length === formData.items.length) {
          setSelectedItems([]);
      } else {
          setSelectedItems(formData.items.map((_, i) => i));
      }
  };

  const toggleSelect = (index) => {
      if (selectedItems.includes(index)) {
          setSelectedItems(selectedItems.filter(i => i !== index));
      } else {
          setSelectedItems([...selectedItems, index]);
      }
  };

  const deleteSelected = () => {
      const updatedItems = formData.items.filter((_, i) => !selectedItems.includes(i));
      setFormData({ ...formData, items: updatedItems });
      setSelectedItems([]);
  };

  const getItemPrice = (inventoryId) => {
      if (!inventoryId || !inventory || !pricing) return 0;
      const invItem = inventory.find(i => i.id === inventoryId);
      if (!invItem?.material_library_id) return 0;
      const priceRecord = pricing.find(p => p.material_id === invItem.material_library_id);
      return priceRecord ? (priceRecord.max_price || 0) : 0;
  };

  const getTotalCost = () => {
      return formData.items.reduce((sum, item) => {
          const price = getItemPrice(item.inventory_id);
          return sum + (price * (item.quantity || 0));
      }, 0);
  };

  // SECTION 6: IMPORT & EXPORT UTILITIES
  const handleExport = async () => {
      try {
          toast.info("Generating CSV...");
          const { data } = await base44.functions.invoke('exportJobKits');
          const blob = new Blob([data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `job_kits_export_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          toast.success("Export complete");
      } catch (e) {
          toast.error("Export failed: " + e.message);
      }
  };

  const handleImport = async () => {
      if (!importCsv.trim()) {
          toast.error("Please provide CSV data");
          return;
      }
      setIsImporting(true);
      try {
          const res = await base44.functions.invoke('importJobKits', { csvData: importCsv });
          if (res.data.success) {
              queryClient.invalidateQueries(['job-kits']);
              setIsImportOpen(false);
              setImportCsv('');
              toast.success(`Imported ${res.data.kits_created} kits successfully`);
          } else {
              throw new Error(res.data.error || "Import failed");
          }
      } catch (e) {
          toast.error("Import error: " + (e.response?.data?.error || e.message));
      } finally {
          setIsImporting(false);
      }
  };

  const getInventoryName = (id) => inventory?.find(i => i.id === id)?.item_name || 'Unknown Item';

  // SECTION 7: RENDER MAIN VIEW
  return (
    <div className="space-y-8">
      {/* SECTION 8: HEADER & PRIMARY ACTIONS */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Kits</h1>
          <p className="text-slate-500 mt-1">Manage bundled material kits for quick scoping</p>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" onClick={handleExport} className="text-slate-600 hover:bg-slate-100">
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Import Kits
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    {/* ... Import Dialog UI ... */}
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={handleCreateOpen}>
                    <Plus className="w-4 h-4 mr-2" /> Create Kit
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    {/* ... Create/Edit Dialog UI ... */}
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* SECTION 9: JOB KITS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits?.map((kit) => (
          <Card key={kit.id} className="hover:shadow-md transition-all">
            {/* ... Kit Card Content ... */}
          </Card>
        ))}
      </div>
    </div>
  );
}