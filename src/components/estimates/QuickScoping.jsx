import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ShoppingCart, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuickScoping({ onAddItem, clientNotes }) {
  const [jobType, setJobType] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // 0. Analyze Client Preferences (AI)
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['client-preferences', clientNotes],
    queryFn: async () => {
      if (!clientNotes) return { keywords: [] };
      try {
        const res = await base44.functions.invoke('analyzeClientPreferences', { notes: clientNotes });
        return res.data;
      } catch (e) {
        console.error("AI Analysis failed", e);
        return { keywords: [] };
      }
    },
    enabled: !!clientNotes,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // 1. Fetch Suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('store_name', 50),
  });

  // 2. Fetch Materials based on Job Type (Category)
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['materials', jobType],
    queryFn: () => base44.entities.MaterialLibrary.filter({ category: jobType }),
    enabled: !!jobType,
  });

  // 3. Fetch Pricing for the selected supplier and materials
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['material-pricing', selectedSupplierId, materials],
    queryFn: async () => {
      if (!selectedSupplierId || !materials || materials.length === 0) return [];
      // Ideally we'd filter by material_ids too, but for now getting all pricing for supplier is easier given API limits
      // or we iterate. Let's fetch all pricing for this supplier and filter in memory for this prototype.
      return base44.entities.MaterialPricing.filter({ supplier_id: selectedSupplierId });
    },
    enabled: !!selectedSupplierId && !!materials && materials.length > 0,
  });

  const getPriceRange = (materialId) => {
    if (!pricingData) return null;
    const pricing = pricingData.find(p => p.material_id === materialId);
    if (!pricing) return null;
    return { min: pricing.min_price, max: pricing.max_price };
  };

  const handleAdd = (material, priceRange) => {
    // Default to average price or min price if available
    const unitCost = priceRange ? (priceRange.min + priceRange.max) / 2 : 0;
    onAddItem({
      description: material.item_name,
      quantity: 1,
      unit_cost: unitCost,
      total: unitCost, // 1 * unitCost
      supplier_id: selectedSupplierId
    });
  };

  return (
    <Card className="h-full border-indigo-100 bg-indigo-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
            <ShoppingCart className="w-5 h-5" />
            Quick Scoping Wizard
            </CardTitle>
            {clientNotes && (
                <div className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                    {prefsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {prefsLoading ? 'Analyzing...' : 'AI Context Active'}
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Job Type</label>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Drywall">Drywall</SelectItem>
              <SelectItem value="Framing">Framing</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Paint">Paint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Supplier</label>
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select supplier..." />
            </SelectTrigger>
            <SelectContent>
              {suppliers?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.store_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
           {!jobType || !selectedSupplierId ? (
             <p className="text-sm text-slate-500 italic">Select job type and supplier to view materials.</p>
           ) : materialsLoading || pricingLoading ? (
             <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
           ) : materials?.length === 0 ? (
             <p className="text-sm text-slate-500">No materials found for this category.</p>
           ) : (
             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
               {materials.map(material => {
                 const price = getPriceRange(material.id);
                 const isPreferred = preferences?.keywords?.some(k => material.item_name.toLowerCase().includes(k.toLowerCase()));
                 return (
                   <div key={material.id} className={`flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all ${isPreferred ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : 'bg-white border-indigo-100'}`}>
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                            <div className="font-medium text-sm text-slate-900">{material.item_name}</div>
                            {isPreferred && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-white/50 px-1.5 py-0.5 rounded border border-amber-200">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    Client Pref
                                </div>
                            )}
                       </div>
                       <div className="text-xs text-slate-500">{material.unit}</div>
                     </div>
                     <div className="flex items-center gap-3">
                        {price ? (
                          <div className="text-right">
                            <div className="text-xs font-medium text-slate-900">${price.min} - ${price.max}</div>
                            <div className="text-[10px] text-slate-500">est. range</div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-400">No Price</Badge>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-50 text-indigo-600" onClick={() => handleAdd(material, price)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                     </div>
                   </div>
                 )
               })}
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}