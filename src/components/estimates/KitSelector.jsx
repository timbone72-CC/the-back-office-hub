import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Package, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function KitSelector({ onKitSelect }) {
  const { data: kits, isLoading: kitsLoading } = useQuery({
    queryKey: ['material-kits'],
    queryFn: () => base44.entities.MaterialKits.list('kit_name', 100),
  });

  const handleSelect = async (kitId) => {
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;

    toast.info(`Loading ${kit.kit_name}...`);

    try {
      // 1. Fetch details for materials in the kit
      // We need names and base prices.
      // Optimally we would have a backend function for this, but we'll do client-side join for now.
      
      const materialIds = kit.items.map(i => i.material_id);
      
      // Fetch all needed materials
      // Since we can't do "WHERE id IN (...)", we might have to fetch list or iterate.
      // For efficiency in this MVP, let's fetch all material library items (assuming < 1000)
      // or we can fetch them one by one in parallel if the kit is small (usually < 10 items).
      
      const materialPromises = materialIds.map(id => base44.entities.MaterialLibrary.filter({ id }));
      const pricingPromises = materialIds.map(id => base44.entities.MaterialPricing.filter({ material_id: id }));
      
      const [materialsResponses, pricingResponses] = await Promise.all([
        Promise.all(materialPromises),
        Promise.all(pricingPromises)
      ]);

      const newItems = kit.items.map((kitItem, index) => {
        const material = materialsResponses[index][0]; // filter returns array
        const pricing = pricingResponses[index].find(p => p.supplier_id); // Just take first supplier found for now
        
        // Base cost is max_price from pricing or 0
        const baseCost = pricing ? pricing.max_price : 0;
        
        // Apply Waste Factor
        const costWithWaste = baseCost * (1 + (kitItem.waste_factor_percentage || 0) / 100);
        
        // Apply Markup
        const finalUnitCost = costWithWaste * (1 + (kitItem.default_markup_percentage || 0) / 100);
        
        return {
          description: material ? material.item_name : 'Unknown Material',
          quantity: kitItem.quantity || 1,
          unit_cost: parseFloat(finalUnitCost.toFixed(2)),
          total: (kitItem.quantity || 1) * parseFloat(finalUnitCost.toFixed(2))
        };
      });

      onKitSelect(newItems);
      toast.success(`${kit.kit_name} added to estimate`);

    } catch (e) {
      console.error(e);
      toast.error("Failed to load kit details");
    }
  };

  return (
    <div className="flex items-center gap-2">
       {kitsLoading ? (
         <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
       ) : (
         <Package className="w-4 h-4 text-indigo-600" />
       )}
       <Select onValueChange={handleSelect}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
            <SelectValue placeholder="Select a Material Kit..." />
          </SelectTrigger>
          <SelectContent>
            {kits?.length === 0 ? (
                <div className="p-2 text-xs text-slate-500 text-center">No kits found</div>
            ) : (
                kits?.map(kit => (
                    <SelectItem key={kit.id} value={kit.id}>{kit.kit_name}</SelectItem>
                ))
            )}
          </SelectContent>
       </Select>
    </div>
  );
}