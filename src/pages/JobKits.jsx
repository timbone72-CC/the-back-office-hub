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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({ name: '', description: '', items: [] });
  const [editingId, setEditingId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const queryClient = useQueryClient();

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

  const handleCreateOpen = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', items: [] });
    setSelectedItems([]);
    setIsDialogOpen(true);
  };

  const handleEditOpen = (kit) => {
    setEditingId(kit.id);
    // Deep copy items to avoid reference issues
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
      // Using max_price as a conservative estimate
      const priceRecord = pricing.find(p => p.material_id === invItem.material_library_id);
      return priceRecord ? (priceRecord.max_price || 0) : 0;
  };

  const getTotalCost = () => {
      return formData.items.reduce((sum, item) => {
          const price = getItemPrice(item.inventory_id);
          return sum + (price * (item.quantity || 0));
      }, 0);
  };

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
          console.error(e);
          toast.error("Export failed: " + e.message);
      }
  };

  const downloadTemplate = () => {
      const headers = "KitName,Description,ItemName,Quantity\nBasic Bath,Rough-in kit,2x4 Stud,10";
      const blob = new Blob([headers], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'job_kit_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
  };

  const processFile = (file) => {
      if (!file) return;
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
          toast.error("Please upload a CSV file");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          setImportCsv(event.target.result);
          toast.success("File loaded successfully");
      };
      reader.onerror = () => {
          toast.error("Failed to read file");
      };
      reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
      processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  };

  const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
          processFile(files[0]);
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
          console.error(e);
          toast.error("Import error: " + (e.response?.data?.error || e.message));
      } finally {
          setIsImporting(false);
      }
  };

  const getInventoryName = (id) => inventory?.find(i => i.id === id)?.item_name || 'Unknown Item';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Kits</h1>
          <p className="text-slate-500 mt-1">Manage bundled material kits for quick scoping</p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="ghost" 
                onClick={handleExport}
                className="text-slate-600 hover:bg-slate-100"
            >
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Import Kits
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Job Kits</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm text-slate-700">Upload CSV File</Label>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={downloadTemplate} 
                                    className="h-auto p-0 text-indigo-600 font-medium"
                                >
                                    <Download className="w-3 h-3 mr-1" /> Download Template
                                </Button>
                            </div>
                            
                            <Input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileUpload}
                                className="cursor-pointer bg-slate-50 border-dashed border-2 border-slate-300 hover:bg-slate-100"
                            />

                            <div className="relative">
                                <Label className="text-sm text-slate-700 mb-2 block">Or Paste / Drop CSV Data</Label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative transition-all duration-200 rounded-md ${isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
                                >
                                    {isDragging && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/90 rounded-md border-2 border-dashed border-indigo-400 z-10 pointer-events-none">
                                            <p className="text-indigo-600 font-medium">Drop CSV file here</p>
                                        </div>
                                    )}
                                    <textarea 
                                        className={`w-full h-48 p-3 text-xs font-mono border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-white ${isDragging ? 'border-indigo-400' : ''}`}
                                        placeholder="KitName,Description,ItemName,Quantity&#10;Basic Bath,Rough-in kit,2x4 Stud,10"
                                        value={importCsv}
                                        onChange={(e) => setImportCsv(e.target.value)}
                                    />
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 text-right">
                                    Headers: KitName, Description, ItemName, Quantity
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                        <Button onClick={handleImport} disabled={isImporting || !importCsv} className="bg-indigo-600 hover:bg-indigo-700">
                            {isImporting ? 'Importing...' : 'Run Import'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={handleCreateOpen}>
                <Plus className="w-4 h-4 mr-2" /> Create Kit
                </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Job Kit' : 'Create New Job Kit'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kit Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Bathroom Rough-in"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the kit contents"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <Label>Materials in Kit</Label>
                      {selectedItems.length > 0 && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={deleteSelected}
                            className="h-6 text-xs px-2"
                          >
                            Delete Selected ({selectedItems.length})
                          </Button>
                      )}
                  </div>
                  <Button variant="outline" size="sm" onClick={addKitItem}>
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <input 
                                        type="checkbox"
                                        className="rounded border-slate-300"
                                        checked={formData.items.length > 0 && selectedItems.length === formData.items.length}
                                        onChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="w-[100px] text-right">Stock Level</TableHead>
                                <TableHead className="w-[100px] text-right">Quantity</TableHead>
                                <TableHead className="w-[100px] text-right">Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No materials added. Click "Add Item" to start building your kit.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                formData.items.map((item, idx) => {
                                    const invItem = inventory?.find(i => i.id === item.inventory_id);
                                    const price = getItemPrice(item.inventory_id);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <input 
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedItems.includes(idx)}
                                                    onChange={() => toggleSelect(idx)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={item.inventory_id} 
                                                    onValueChange={(val) => updateKitItem(idx, 'inventory_id', val)}
                                                >
                                                    <SelectTrigger className="h-8 border-none shadow-none focus:ring-0">
                                                        <SelectValue placeholder="Select item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {inventory?.map(inv => (
                                                            <SelectItem key={inv.id} value={inv.id}>{inv.item_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600">
                                                {invItem?.quantity || 0} {invItem?.unit || 'units'}
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    className="h-8 text-right"
                                                    value={item.quantity}
                                                    onChange={(e) => updateKitItem(idx, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600">
                                                ${(price * (item.quantity || 0)).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        <TableFooter className="bg-slate-50 font-medium">
                            <TableRow>
                                <TableCell colSpan={4} className="text-right">Total Kit Cost:</TableCell>
                                <TableCell className="text-right">${getTotalCost().toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => editingId ? updateKitMutation.mutate(formData) : createKitMutation.mutate(formData)} 
                disabled={!formData.name || createKitMutation.isPending || updateKitMutation.isPending}
              >
                {createKitMutation.isPending || updateKitMutation.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Kit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits?.map((kit) => (
          <Card key={kit.id} className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{kit.name}</CardTitle>
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-indigo-600"
                    onClick={() => handleEditOpen(kit)}
                >
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => {
                    if(confirm('Are you sure you want to delete this kit?')) {
                        deleteKitMutation.mutate(kit.id);
                    }
                    }}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">{kit.description || 'No description'}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Contents:</p>
                {kit.items?.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {kit.items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex justify-between text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        <span>{getInventoryName(item.inventory_id)}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </li>
                    ))}
                    {kit.items.length > 3 && (
                      <li className="text-xs text-indigo-600 pt-1">+{kit.items.length - 3} more items</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">Empty kit</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {kits?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Job Kits</h3>
            <p className="text-slate-500">Create a kit to bundle materials for faster estimating.</p>
          </div>
        )}
      </div>
    </div>
  );
}