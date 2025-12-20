import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  User, 
  DollarSign, 
  ShoppingBag,
  FileText,
  Plus,
  Save,
  Trash2,
  Printer,
  TrendingUp,
  CreditCard,
  Star,
  MessageSquare,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import JobTasks from '@/components/jobs/JobTasks';
import JobTimeTracker from '@/components/jobs/JobTimeTracker';

export default function JobDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const jobId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_cost: 0, supplier_name: '' });
  
  // Review Request State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewContent, setReviewContent] = useState(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const res = await base44.entities.Job.filter({ id: jobId });
        return res && res.length > 0 ? res[0] : null;
      } catch (e) {
        console.error("Error fetching job:", e);
        return null;
      }
    },
    enabled: !!jobId
  });

  const { data: client } = useQuery({
    queryKey: ['client', job?.client_profile_id],
    queryFn: async () => {
      if (!job?.client_profile_id) return null;
      const res = await base44.entities.ClientProfile.filter({ id: job.client_profile_id });
      return res && res.length > 0 ? res[0] : null;
    },
    enabled: !!job?.client_profile_id
  });

  const updateJobMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', jobId]);
      // Quiet success for small updates, or toast for big ones? 
      // Let's rely on UI updates for now, maybe small toast
    }
  });

  const handleTaskUpdate = (newTasks) => {
    updateJobMutation.mutate({ tasks: newTasks });
  };

  const handleTimeUpdate = (updates) => {
    updateJobMutation.mutate(updates);
  };

  const handleAddMaterial = () => {
    if (!newItem.description) return;
    
    const quantity = parseFloat(newItem.quantity) || 0;
    const unit_cost = parseFloat(newItem.unit_cost) || 0;
    const total = quantity * unit_cost;

    const itemToAdd = {
      description: newItem.description,
      quantity,
      unit_cost,
      total,
      supplier_name: newItem.supplier_name || 'Additional Order'
    };

    const updatedList = [...(job.material_list || []), itemToAdd];
    
    // Update budget if it's a change order (adding to total)
    // Assuming budget tracks total estimated cost
    const newBudget = (job.budget || 0) + total;

    updateJobMutation.mutate({ 
      material_list: updatedList,
      budget: newBudget
    }, {
      onSuccess: () => {
        toast.success('Change Order added to job');
        setIsAddMaterialOpen(false);
        setNewItem({ description: '', quantity: 1, unit_cost: 0, supplier_name: '' });
      }
    });
  };

  const generateInvoice = async () => {
    try {
      const { data } = await base44.functions.invoke('generateInvoicePdf', { jobId });
      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${job.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Invoice generated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate invoice');
    }
  };

  const handleRequestReview = async () => {
    setIsReviewOpen(true);
    if (!reviewContent) {
      setIsGeneratingReview(true);
      try {
        const { data } = await base44.functions.invoke('generateClientMessage', { 
            type: 'review_request', 
            context: { 
              clientName: client?.name || 'Client', 
              jobTitle: job.title 
            } 
        });
        setReviewContent(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate review request");
      } finally {
        setIsGeneratingReview(false);
      }
    }
  };

  // Financial Calculations
  const laborRate = job.labor_rate || 75;
  const totalMinutes = (job.time_logs || []).reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
  const laborCost = (totalMinutes / 60) * laborRate;
  const materialCost = (job.material_list || []).reduce((acc, item) => acc + (item.total || 0), 0);
  const totalCost = laborCost + materialCost;
  const revenue = job.budget || 0;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!job) return <div className="p-8">Job not found.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            {job.title}
          </h1>
          <p className="text-slate-500">Job ID: #{job.id.slice(-6)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          
          {/* Financials & Profitability Section */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Job Financials
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateInvoice}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
              >
                <Printer className="w-4 h-4" /> Generate Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-white">${revenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-red-300">${totalCost.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mat: ${materialCost.toFixed(0)} | Lab: ${laborCost.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Net Profit</p>
                  <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Margin</p>
                  <p className={`text-2xl font-bold ${margin >= 20 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <Separator className="bg-slate-700 my-4" />
              
              <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="space-y-1 flex-1">
                      <Label className="text-slate-300 text-xs">Payment Status</Label>
                      <Select 
                        value={job.payment_status} 
                        onValueChange={(val) => updateJobMutation.mutate({ payment_status: val })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-slate-300 text-xs">Payment Date</Label>
                      <Input 
                        type="date" 
                        className="bg-slate-800 border-slate-600 text-white"
                        value={job.payment_date || ''}
                        onChange={(e) => updateJobMutation.mutate({ payment_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 w-24">
                      <Label className="text-slate-300 text-xs">Labor Rate</Label>
                      <Input 
                        type="number" 
                        className="bg-slate-800 border-slate-600 text-white"
                        value={job.labor_rate || 75}
                        onChange={(e) => updateJobMutation.mutate({ labor_rate: parseFloat(e.target.value) })}
                      />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JobTimeTracker job={job} onUpdate={handleTimeUpdate} />
            <JobTasks tasks={job.tasks} onUpdate={handleTaskUpdate} />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Job Overview</CardTitle>
              {job.status === 'completed' && (
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={handleRequestReview}
                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200 gap-2"
                    >
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Request Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Request Client Review</DialogTitle>
                    </DialogHeader>
                    {isGeneratingReview ? (
                      <div className="py-8 text-center text-slate-500 animate-pulse">
                        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                        Generating personalized message...
                      </div>
                    ) : reviewContent ? (
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label className="flex justify-between">
                            <span>Text Message (SMS)</span>
                            <Button 
                              variant="ghost" size="sm" className="h-5 text-xs text-indigo-600"
                              onClick={() => {
                                navigator.clipboard.writeText(reviewContent.sms_text);
                                toast.success("Copied to clipboard");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" /> Copy
                            </Button>
                          </Label>
                          <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-200">
                            {reviewContent.sms_text}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="flex justify-between">
                            <span>Email Draft</span>
                            <Button 
                              variant="ghost" size="sm" className="h-5 text-xs text-indigo-600"
                              onClick={() => {
                                navigator.clipboard.writeText(`Subject: ${reviewContent.email_subject}\n\n${reviewContent.email_body}`);
                                toast.success("Copied to clipboard");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" /> Copy All
                            </Button>
                          </Label>
                          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-200">
                            <div className="font-semibold mb-2 text-slate-900">Subject: {reviewContent.email_subject}</div>
                            <div className="whitespace-pre-wrap">{reviewContent.email_body}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-red-500">Failed to load content.</div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-500">Status</span>
                  <div>
                    <Badge className={
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-500">Budget</span>
                  <div className="text-xl font-bold text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    {job.budget?.toLocaleString()}
                  </div>
                </div>
              </div>

              {job.scoping_notes && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Scoping Notes
                  </h4>
                  <p className="text-sm text-amber-800">{job.scoping_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-500" />
                Material List
              </CardTitle>
              <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Change Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Order / Add Material</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input 
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="e.g. Extra 2x4 Studs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input 
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Cost ($)</Label>
                        <Input 
                          type="number"
                          value={newItem.unit_cost}
                          onChange={(e) => setNewItem({...newItem, unit_cost: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier (Optional)</Label>
                      <Input 
                        value={newItem.supplier_name}
                        onChange={(e) => setNewItem({...newItem, supplier_name: e.target.value})}
                        placeholder="Store Name"
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded text-right font-bold text-indigo-600">
                      Total Impact: ${((parseFloat(newItem.quantity)||0) * (parseFloat(newItem.unit_cost)||0)).toFixed(2)}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddMaterial} className="bg-indigo-600 hover:bg-indigo-700">
                      Add Item & Update Budget
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {job.material_list?.length > 0 ? (
                <div className="space-y-4">
                  {job.material_list.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-100">
                      <div>
                        <div className="font-medium text-slate-900">{item.description}</div>
                        <div className="text-xs text-slate-500">
                          {item.supplier_name || 'Unknown Supplier'} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="font-medium text-slate-700">
                        ${(item.total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                    <span>Total Materials</span>
                    <span>${job.material_list.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">No materials listed for this job.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">Client</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-medium">{client.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium truncate max-w-[150px]">{client.email || 'N/A'}</span>
                    </div>
                    <div className="block mt-2">
                      <span className="text-slate-500 block mb-1">Address:</span>
                      <span className="font-medium">{client.address || 'N/A'}</span>
                    </div>
                  </div>
                  <Link to={`${createPageUrl('ClientDetail')}?id=${client.id}`}>
                    <Button variant="outline" className="w-full mt-4">View Profile</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-slate-500">No client linked.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}