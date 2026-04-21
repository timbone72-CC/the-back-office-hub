import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DEFAULT_FORM = {
  item_name: '',
  quantity: 0,
  unit: 'each',
  reorder_point: 5,
  supplier_id: '',
  barcode: '',
  material_library_id: ''
};

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export default function Inventory() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const {
    data: suppliers = [],
    isLoading: suppliersLoading
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('store_name', 100)
  });

  const {
    data: inventory = [],
    isLoading: inventoryLoading
  } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100)
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const cleanItemName = String(payload.item_name || '').trim();
      const normalized_name = normalizeName(cleanItemName);

      if (!cleanItemName) {
        throw new Error('Item name is required');
      }

      const quantity = toNumber(payload.quantity, 0);
      const reorder_point = toNumber(payload.reorder_point, 5);

      const duplicate = inventory.find((item) => {
        if (editingItem && item.id === editingItem.id) {
          return false;
        }
        return normalizeName(item.item_name) === normalized_name;
      });

      if (duplicate) {
        throw new Error('An inventory item with that name already exists');
      }

      const cleanPayload = {
        item_name: cleanItemName,
        normalized_name,
        quantity,
        unit: String(payload.unit || 'each').trim() || 'each',
        reorder_point,
        supplier_id: payload.supplier_id || undefined,
        barcode: String(payload.barcode || '').trim(),
        material_library_id: payload.material_library_id || undefined
      };

      if (!cleanPayload.barcode) {
        delete cleanPayload.barcode;
      }

      if (!cleanPayload.supplier_id) {
        delete cleanPayload.supplier_id;
      }

      if (!cleanPayload.material_library_id) {
        delete cleanPayload.material_library_id;
      }

      if (editingItem) {
        return base44.entities.Inventory.update(editingItem.id, cleanPayload);
      }

      return base44.entities.Inventory.create(cleanPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreateOpen(false);
      setEditingItem(null);
      setFormData(DEFAULT_FORM);
      toast.success(editingItem ? 'Item updated' : 'Item added');
    },
    onError: (error) => {
      toast.error(error?.message || 'Save failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted');
    },
    onError: (error) => {
      toast.error(error?.message || 'Delete failed');
    }
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name || '',
      quantity: toNumber(item.quantity, 0),
      unit: item.unit || 'each',
      reorder_point: toNumber(item.reorder_point, 5),
      supplier_id: item.supplier_id || '',
      barcode: item.barcode || '',
      material_library_id: item.material_library_id || ''
    });
    setIsCreateOpen(true);
  };

  const handleCloseDialog = (open) => {
    setIsCreateOpen(open);
    if (!open) {
      setEditingItem(null);
      setFormData(DEFAULT_FORM);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const itemName = String(item.item_name || '').toLowerCase();
      const barcode = String(item.barcode || '').toLowerCase();
      const supplierName = String(
        suppliers.find((s) => s.id === item.supplier_id)?.store_name || ''
      ).toLowerCase();

      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        itemName.includes(term) ||
        barcode.includes(term) ||
        supplierName.includes(term);

      if (filter === 'low_stock') {
        return matchesSearch && toNumber(item.quantity, 0) <= toNumber(item.reorder_point, 0);
      }

      return matchesSearch;
    });
  }, [inventory, suppliers, search, filter]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(
      (item) => toNumber(item.quantity, 0) <= toNumber(item.reorder_point, 0)
    ).length;
  }, [inventory]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="mt-1 text-slate-500">Track stock levels and reorder points</p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-500">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-slate-500" />
              <span className="text-2xl font-bold text-slate-900">{inventory.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-500">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-slate-900">{lowStockCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-500">Suppliers Loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900">
              {suppliersLoading ? '...' : suppliers.length}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item, barcode, or supplier..."
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            type="button"
            variant={filter === 'low_stock' ? 'default' : 'outline'}
            onClick={() => setFilter('low_stock')}
          >
            Low Stock
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, item_name: event.target.value }))
                }
                placeholder="Example: 2x4 Stud"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: event.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, unit: event.target.value }))
                  }
                  placeholder="each"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reorder_point">Reorder Point</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.reorder_point}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      reorder_point: event.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={formData.supplier_id || 'none'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplier_id: value === 'none' ? '' : value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode / SKU</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, barcode: event.target.value }))
                }
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_library_id">Material Library ID</Label>
              <Input
                id="material_library_id"
                value={formData.material_library_id}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    material_library_id: event.target.value
                  }))
                }
                placeholder="Optional"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCloseDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Saving...'
                  : editingItem
                    ? 'Save Changes'
                    : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {inventoryLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading inventory...
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No inventory items found</h3>
          <p className="mt-2 text-slate-500">
            Add your first item or change the search/filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredInventory.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplier_id);
            const isLowStock =
              toNumber(item.quantity, 0) <= toNumber(item.reorder_point, 0);

            return (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg text-slate-900">
                      {item.item_name}
                    </CardTitle>
                    {isLowStock ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        In Stock
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Quantity</p>
                      <p className="font-semibold text-slate-900">
                        {toNumber(item.quantity, 0)} {item.unit || 'each'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Reorder Point</p>
                      <p className="font-semibold text-slate-900">
                        {toNumber(item.reorder_point, 0)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Supplier</p>
                      <p className="font-semibold text-slate-900">
                        {supplier?.store_name || 'Not linked'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Barcode / SKU</p>
                      <p className="font-semibold text-slate-900">
                        {item.barcode || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}