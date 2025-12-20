import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function LowStockWidget() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100),
  });

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  const lowStockItems = inventory?.filter(item => item.quantity <= item.reorder_point) || [];

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <AlertTriangle className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
          Low Stock Alerts
        </CardTitle>
        <Link to={createPageUrl('Inventory')}>
          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {lowStockItems.length > 0 ? (
          <div className="space-y-3">
            {lowStockItems.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-sm font-semibold text-slate-900 truncate">{item.item_name}</div>
                  <div className="text-xs text-orange-700">
                    {item.quantity} {item.unit} (Reorder at {item.reorder_point})
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-slate-700 border-orange-200 hover:bg-orange-100">
                  Order
                </Button>
              </div>
            ))}
            {lowStockItems.length > 3 && (
              <p className="text-xs text-center text-slate-500 pt-1">
                + {lowStockItems.length - 3} more items need attention
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-100 mb-2" />
            <p className="text-sm font-medium text-slate-900">All Stocked Up!</p>
            <p className="text-xs text-slate-500">No items are below reorder points.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}