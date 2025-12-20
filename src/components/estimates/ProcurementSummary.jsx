import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, ShoppingBag, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProcurementSummary({ items }) {
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const grouped = items.reduce((acc, item) => {
    const supId = item.supplier_id || 'unassigned';
    if (!acc[supId]) acc[supId] = { items: [], totalCost: 0 };
    acc[supId].items.push(item);
    acc[supId].totalCost += (parseFloat(item.total) || 0);
    return acc;
  }, {});

  const getSupplier = (id) => suppliers?.find(s => s.id === id);

  return (
    <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Procurement Summary
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {Object.keys(grouped).map(supId => {
                const supplier = getSupplier(supId);
                const group = grouped[supId];
                const isUnassigned = supId === 'unassigned';
                
                return (
                    <div key={supId} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    {isUnassigned ? 'Unassigned Items' : supplier?.store_name || 'Unknown Supplier'}
                                    {!isUnassigned && <Badge variant="outline" className="text-xs font-normal text-slate-500">{group.items.length} items</Badge>}
                                </h3>
                                {!isUnassigned && supplier?.address && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {supplier.address}
                                    </div>
                                )}
                            </div>
                            {!isUnassigned && supplier?.phone && (
                                <a href={`tel:${supplier.phone}`}>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1 h-8">
                                        <Phone className="w-3 h-3" />
                                        Call
                                    </Button>
                                </a>
                            )}
                        </div>
                        
                        <div className="space-y-1">
                            {group.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-slate-600 pl-2 border-l-2 border-slate-100">
                                    <span>{item.description}</span>
                                    <span className="font-mono text-xs bg-slate-50 px-1 rounded">x{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-500 uppercase">Est. Cost</span>
                            <span className="font-bold text-slate-900">${group.totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}
            {Object.keys(grouped).length === 0 && (
                <p className="text-center text-slate-500 italic py-4">No items to procure yet.</p>
            )}
        </CardContent>
    </Card>
  );
}