import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Briefcase, 
  Calculator,
  Image as ImageIcon,
  StickyNote,
  User
} from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';
import QuickScoping from '@/components/estimates/QuickScoping';
import ScopingAlerts from '@/components/estimates/ScopingAlerts';
import KitSelector from '@/components/estimates/KitSelector';
import HandymanCalculators from '@/components/calculators/HandymanCalculators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

export default function EstimateDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const estimateId = urlParams.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  console.log("EstimateDetail: ID from URL:", estimateId);

  const { data: estimate, isLoading } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      if (!estimateId) return null;
      try {
        const res = await base44.entities.JobEstimate.filter({ id: estimateId });
        return res && res.length > 0 ? res[0] : null;
      } catch (e) {
        console.error("Error fetching estimate:", e);
        return null;
      }
    },
    enabled: !!estimateId,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const { data: client } = useQuery({
    queryKey: ['client', estimate?.client_profile_id],
    queryFn: async () => {
       const res = await base44.entities.ClientProfile.filter({ id: estimate.client_profile_id });
       return res && res.length > 0 ? res[0] : null;
    },
    enabled: !!estimate?.client_profile_id
  });

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (estimate) {
      setFormData({
        ...estimate,
        items: estimate.items || [],
        tax_rate: estimate.tax_rate || 0,
        photos: estimate.photos || []
      });
    }
  }, [estimate]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.JobEstimate.update(estimateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimate', estimateId]);
      toast.success('Estimate saved successfully');
    },
    onError: () => {
      toast.error('Failed to save estimate');
    }
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    
    if (field === 'description') item.description = value;
    // Store raw value to allow typing decimals
    if (field === 'quantity') item.quantity = value;
    if (field === 'unit_cost') item.unit_cost = value;
    
    // Calculate line total for display and storage
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    item.total = qty * cost;
    
    newItems[index] = item;
    calculateTotals(newItems, formData.tax_rate);
  };

  const calculateTotals = (items, taxRate) => {
    // Calculate subtotal using parsed values
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
      return sum + lineTotal;
    }, 0);
    
    const rate = parseFloat(taxRate) || 0;
    const taxAmount = subtotal * (rate / 100);
    const total = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      tax_rate: taxRate,
      total_amount: total
    }));
  };

  const addItem = (itemData = null) => {
    const newItem = itemData || { description: '', quantity: 1, unit_cost: 0, total: 0 };
    const newItems = [...formData.items, newItem];
    calculateTotals(newItems, formData.tax_rate);
  };

  const addKitItems = (kitItems) => {
    const newItems = [...formData.items, ...kitItems];
    calculateTotals(newItems, formData.tax_rate);
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    calculateTotals(newItems, formData.tax_rate);
  };

  const handleTaxChange = (value) => {
    const rate = parseFloat(value) || 0;
    calculateTotals(formData.items, rate);
  };

  const convertToJobMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Job Record
      const jobData = {
        title: formData.title,
        client_profile_id: formData.client_profile_id,
        budget: formData.total_amount,
        material_list: formData.items,
        scoping_notes: client?.permanent_notes || '',
        status: 'in_progress'
      };
      const newJob = await base44.entities.Job.create(jobData);

      // 2. Update Estimate Status
      await base44.entities.JobEstimate.update(estimateId, { status: 'converted' });
      
      return newJob;
    },
    onSuccess: (newJob) => {
      queryClient.invalidateQueries(['estimate', estimateId]);
      toast.success('Converted to Job successfully!');
      navigate(`${createPageUrl('JobDetail')}?id=${newJob.id}`);
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to convert to job');
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!estimate && !isLoading) return (
    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Estimate Not Found</h2>
      <p className="text-slate-500 mb-4">The estimate you are looking for does not exist or has been deleted.</p>
      <Link to={createPageUrl('JobEstimates')}>
        <Button>Return to Estimates</Button>
      </Link>
    </div>
  );
  if (!formData) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('JobEstimates')}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Estimate Details</h1>
            <p className="text-slate-500">#{estimateId.slice(-6)} • {client?.name || 'Unknown Client'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info('PDF export coming soon!')}>
            <Printer className="w-4 h-4" /> Print/PDF
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" /> Calculators
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Handyman Tools</DialogTitle>
              </DialogHeader>
              <HandymanCalculators />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" /> Calculators
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Handyman Tools</DialogTitle>
              </DialogHeader>
              <HandymanCalculators />
            </DialogContent>
          </Dialog>
          <Button 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700" 
            onClick={() => {
                if (confirm('Are you sure you want to convert this estimate to an active Job?')) {
                    convertToJobMutation.mutate();
                }
            }}
            disabled={convertToJobMutation.isPending}
          >
            <Briefcase className="w-4 h-4" /> 
            {convertToJobMutation.isPending ? 'Converting...' : 'Convert to Job'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Customer Context Section */}
          {client && (
             <Card className="bg-amber-50 border-amber-200">
               <CardHeader className="pb-2">
                 <CardTitle className="text-amber-900 text-lg flex items-center gap-2">
                    <StickyNote className="w-5 h-5" />
                    Customer Context
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex gap-4 items-start">
                    <User className="w-10 h-10 text-amber-600 bg-amber-100 rounded-full p-2 shrink-0" />
                    <div>
                      <div className="font-semibold text-amber-900">{client.name}</div>
                      <div className="text-sm text-amber-800 mt-1">
                        {client.permanent_notes ? (
                          <p>{client.permanent_notes}</p>
                        ) : (
                          <p className="italic text-amber-700/70">No permanent notes available for this client.</p>
                        )}
                      </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Estimate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <Input 
                    type="date"
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <ScopingAlerts items={formData.items} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <div className="flex gap-2">
                <KitSelector onKitSelect={addKitItems} />
                <Button size="sm" variant="outline" onClick={() => addItem()} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[15%]">Quantity</TableHead>
                    <TableHead className="w-[15%]">Unit Cost</TableHead>
                    <TableHead className="w-[20%] text-right">Line Total</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No items added yet. Click "Add Item" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <Input 
                              type="number" 
                              min="0"
                              className="pl-7"
                              value={item.unit_cost} 
                              onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(parseFloat(item.total) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-500" />
                Job Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload 
                photos={formData.photos} 
                onChange={(photos) => setFormData({...formData, photos})} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickScoping onAddItem={addItem} clientNotes={client?.permanent_notes} />

          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">${formData.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Tax Rate (%)</span>
                <Input 
                  type="number" 
                  className="w-20 h-8 text-right" 
                  value={formData.tax_rate}
                  onChange={(e) => handleTaxChange(e.target.value)}
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Estimate</span>
                <span className="font-bold text-2xl text-indigo-600">${formData.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700 gap-2"
                onClick={() => updateMutation.mutate(formData)}
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4" /> 
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}