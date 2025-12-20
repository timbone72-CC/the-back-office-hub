import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Phone, ChevronRight, Package, Truck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MaterialProcurement() {
  // 1. Fetch Approved Estimates
  const { data: estimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ['approved-estimates'],
    queryFn: () => base44.entities.JobEstimate.filter({ status: 'approved' }),
  });

  // 2. Fetch Suppliers for phone numbers
  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  if (estimatesLoading || suppliersLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // 3. Group items by Supplier
  const groupedItems = {};
  const unassignedItems = [];

  estimates?.forEach(estimate => {
    estimate.items?.forEach(item => {
      if (item.supplier_id) {
        if (!groupedItems[item.supplier_id]) {
          groupedItems[item.supplier_id] = {
            supplierId: item.supplier_id,
            supplierName: item.supplier_name || 'Unknown Supplier',
            items: []
          };
        }
        groupedItems[item.supplier_id].items.push({
          ...item,
          estimateTitle: estimate.title,
          estimateId: estimate.id,
          clientProfileId: estimate.client_profile_id
        });
      } else {
        // Group unassigned items together just in case user wants to see them
        unassignedItems.push({
          ...item,
          estimateTitle: estimate.title,
          estimateId: estimate.id
        });
      }
    });
  });

  const getSupplierPhone = (id) => {
    return suppliers?.find(s => s.id === id)?.phone || '';
  };

  const getSupplierAddress = (id) => {
    return suppliers?.find(s => s.id === id)?.address || '';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-indigo-600" />
            Material Procurement
          </h1>
          <p className="text-slate-500 mt-1">Consolidated material lists for approved jobs by supplier</p>
        </div>
      </div>

      {Object.keys(groupedItems).length === 0 && unassignedItems.length === 0 ? (
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Materials to Order</h3>
            <p className="text-slate-500 max-w-sm">
              There are no approved estimates with materials currently. Approve an estimate to see materials here.
            </p>
            <Link to={createPageUrl('JobEstimates')}>
                <Button className="mt-4" variant="outline">View Estimates</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.values(groupedItems).map(group => {
            const phone = getSupplierPhone(group.supplierId);
            const address = getSupplierAddress(group.supplierId);
            const totalCost = group.items.reduce((sum, item) => sum + (item.total || 0), 0);

            return (
              <Card key={group.supplierId} className="border-indigo-100 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-indigo-50/30 pb-4 border-b border-indigo-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{group.supplierName}</CardTitle>
                      {address && <CardDescription className="flex items-center gap-1 mt-1"><Truck className="w-3 h-3" /> {address}</CardDescription>}
                    </div>
                    {phone && (
                        <Button asChild className="bg-green-600 hover:bg-green-700 shadow-sm gap-2" size="sm">
                            <a href={`tel:${phone}`}>
                                <Phone className="w-4 h-4" /> One-Touch Call
                            </a>
                        </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <Accordion type="single" collapsible className="w-full">
                    {/* We can group by Estimate within the Supplier card or just list all items */}
                    {/* Let's Group by Estimate for clarity */}
                    {Array.from(new Set(group.items.map(i => i.estimateId))).map(estId => {
                        const estItems = group.items.filter(i => i.estimateId === estId);
                        const estTitle = estItems[0].estimateTitle;
                        
                        return (
                            <AccordionItem value={estId} key={estId} className="border-b border-slate-100 last:border-0">
                                <AccordionTrigger className="px-6 py-3 hover:bg-slate-50 hover:no-underline">
                                    <div className="flex justify-between w-full pr-4 items-center">
                                        <div className="flex items-center gap-2 text-left">
                                            <span className="font-semibold text-sm text-slate-700">{estTitle}</span>
                                            <Badge variant="outline" className="text-[10px] font-normal text-slate-500">
                                                {estItems.length} items
                                            </Badge>
                                        </div>
                                        <div className="text-sm font-medium text-slate-900">
                                            ${estItems.reduce((s, i) => s + (i.total || 0), 0).toFixed(2)}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-slate-50/50 px-6 py-3">
                                    <ul className="space-y-2">
                                        {estItems.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-sm items-center border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-white border border-slate-200 w-6 h-6 flex items-center justify-center rounded text-xs font-medium text-slate-500">
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-slate-700">{item.description}</span>
                                                </div>
                                                <span className="text-slate-500 font-mono text-xs">
                                                    ${(item.total || 0).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                  </Accordion>
                </CardContent>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Total for this Supplier</span>
                    <span className="text-lg font-bold text-indigo-700">${totalCost.toFixed(2)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {unassignedItems.length > 0 && (
          <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" /> Other Materials (Unassigned Supplier)
              </h3>
              <Card>
                  <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                          {unassignedItems.map((item, idx) => (
                              <div key={idx} className="p-4 flex justify-between items-center">
                                  <div>
                                      <div className="font-medium text-slate-900">{item.description}</div>
                                      <div className="text-xs text-slate-500">From: {item.estimateTitle}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                      <span className="font-bold text-slate-700">${(item.total || 0).toFixed(2)}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
}