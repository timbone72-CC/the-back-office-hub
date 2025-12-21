import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function JobKits() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKit, setNewKit] = useState({ name: '', description: '', items: [] });
  const queryClient = useQueryClient();

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
      setNewKit({ name: '', description: '', items: [] });
      toast.success('Job Kit created successfully');
    },
  });

  const deleteKitMutation = useMutation({
    mutationFn: (id) => base44.entities.JobKit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['job-kits']);
      toast.success('Job Kit deleted');
    },
  });

  const addKitItem = () => {
    setNewKit({ ...newKit, items: [...newKit.items, { inventory_id: '', quantity: 1 }] });
  };

  const updateKitItem = (index, field, value) => {
    const updatedItems = [...newKit.items];
    updatedItems[index][field] = value;
    setNewKit({ ...newKit, items: updatedItems });
  };

  const removeKitItem = (index) => {
    const updatedItems = newKit.items.filter((_, i) => i !== index);
    setNewKit({ ...newKit, items: updatedItems });
  };

  const getInventoryName = (id) => inventory?.find(i => i.id === id)?.item_name || 'Unknown Item';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Kits</h1>
          <p className="text-slate-500 mt-1">Manage bundled material kits for quick scoping</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Create Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job Kit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kit Name</Label>
                <Input 
                  value={newKit.name}
                  onChange={(e) => setNewKit({...newKit, name: e.target.value})}
                  placeholder="e.g., Bathroom Rough-in"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={newKit.description}
                  onChange={(e) => setNewKit({...newKit, description: e.target.value})}
                  placeholder="Brief description of the kit contents"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Materials in Kit</Label>
                  <Button variant="outline" size="sm" onClick={addKitItem}>
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="border rounded-lg p-2 space-y-2 max-h-60 overflow-y-auto bg-slate-50">
                  {newKit.items.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No items added yet.</p>
                  ) : (
                    newKit.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Item</Label>
                          <Select 
                            value={item.inventory_id} 
                            onValueChange={(val) => updateKitItem(idx, 'inventory_id', val)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory?.map(inv => (
                                <SelectItem key={inv.id} value={inv.id}>{inv.item_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Qty</Label>
                          <Input 
                            type="number" 
                            className="h-8"
                            value={item.quantity}
                            onChange={(e) => updateKitItem(idx, 'quantity', parseFloat(e.target.value))}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeKitItem(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createKitMutation.mutate(newKit)} disabled={!newKit.name || createKitMutation.isPending}>
                {createKitMutation.isPending ? 'Saving...' : 'Create Kit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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