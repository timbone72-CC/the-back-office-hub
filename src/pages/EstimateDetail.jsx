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
  User,
  Calendar,
  CheckCircle,
  FileText,
  Package,
  Link as LinkIcon
} from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';
import QuickScoping from '@/components/estimates/QuickScoping';
import ScopingAlerts from '@/components/estimates/ScopingAlerts';
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
import { Separator } from '@/components/ui/separator';

export default function EstimateDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const estimateId = urlParams.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

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

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (estimateId && estimate) {
      // Edit Mode
      const items = estimate.items || [];
      const tax_rate = estimate.tax_rate || 0;

      // Strict recalculation on load to fix any bad data
      const subtotal = items.reduce((sum, item) => {
          const qty = Number(item.quantity) || 0;
          const cost = Number(item.unit_cost) || 0;
          item.total = qty * cost; 
          return sum + item.total;
      }, 0);

      const total_amount = subtotal + (subtotal * (Number(tax_rate) / 100));

      setFormData({
        ...estimate,
        items,
        subtotal,
        tax_rate,
        total_amount,
        photos: estimate.photos || []
      });
    } else if (!estimateId) {
      // New Mode
      setFormData({
        title: '',
        client_profile_id: '',
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        items: [],
        tax_rate: 0,
        subtotal: 0,
        total_amount: 0,
        photos: []
      });
    }
  }, [estimate, estimateId]);

  const { data: client } = useQuery({
    queryKey: ['client', formData?.client_profile_id],
    queryFn: async () => {
       const res = await base44.entities.ClientProfile.filter({ id: formData.client_profile_id });
       return res && res.length > 0 ? res[0] : null;
    },
    enabled: !!formData?.client_profile_id
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: () => base44.entities.Inventory.list('item_name', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobEstimate.create(data),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries(['estimates']);
      toast.success('Estimate created successfully');
      navigate(`${createPageUrl('EstimateDetail')}?id=${newRecord.id}`, { replace: true });
    },
    onError: () => toast.error('Failed to create estimate')
  });

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

  const handleSave = () => {
    if (!formData.title || !formData.client_profile_id) {
        toast.error("Please fill in Title and Client");
        return;
    }
    
    if (estimateId) {
        updateMutation.mutate(formData);
    } else {
        createMutation.mutate(formData);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (field === 'description') item.description = value;
    if (field === 'quantity') item.quantity = value;
    if (field === 'unit_cost') item.unit_cost = value;

    // Handle inventory linking
    if (field === 'inventory_id') {
       item.inventory_id = value;
       const invItem = inventory?.find(i => i.id === value);
       if (invItem) {
          item.description = invItem.item_name;
          item.unit = invItem.unit;
       }
    }

    // Strict parsing updates
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unit_cost) || 0;
    item.total = qty * cost;

    newItems[index] = item;
    calculateTotals(newItems, formData.tax_rate);
  };

  const calculateTotals = (items, taxRate) => {
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unit_cost) || 0;
      const lineTotal = qty * cost;
      // Update line total in object if missing/stale (ensures integrity)
      item.total = lineTotal; 
      return sum + lineTotal;
    }, 0);

    const rate = Number(taxRate) || 0;
    const taxAmount = subtotal * (rate / 100);
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      tax_rate: rate,
      total_amount: total
    }));
  };

  const addItem = (itemData = null) => {
    const newItem = itemData || { description: '', quantity: 0, unit_cost: 0, total: 0 };
    const newItems = [...formData.items, newItem];
    calculateTotals(newItems, formData.tax_rate);
    toast.success("Item added to estimate");
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
      // Use backend function to handle atomic job creation and inventory deduction
      const res = await base44.functions.invoke('convertEstimateToJob', { estimate_id: estimateId });
      // The backend function returns { job_id, message, deductions }
      return { id: res.data.job_id, deductions: res.data.deductions };
    },
    onSuccess: (result) => {
      // PHASE 3: Cache Synchronization
      // Ensure all derived states are refreshed immediately
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] }); // Update list view
      queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Ensure main inventory cache is cleared
      queryClient.invalidateQueries({ queryKey: ['inventory-list'] }); // Reflect stock deductions
      queryClient.invalidateQueries({ queryKey: ['active-jobs'] }); // Show new job in lists

      // Show summary of inventory deductions
      const deductionCount = result.deductions?.length || 0;
      if (deductionCount > 0) {
        toast.success(`Job Created! ${deductionCount} inventory items updated.`);
      } else {
        toast.success('Converted to Job successfully!');
      }
      
      navigate(`${createPageUrl('JobDetail')}?id=${result.id}`);
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to convert to job: ' + (e.response?.data?.error || e.message));
    }
  });

  const handlePrint = () => {
    toast.info('Generating PDF...');
    setTimeout(() => {
        window.print(); // Simple browser print for now
    }, 500);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  
  // Show Not Found only if we have an ID but it wasn't found
  if (estimateId && !estimate && !isLoading) return (
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <style>{`
        @media print {
          @page { margin: 1cm; size: auto; }
          body * { visibility: hidden; }
          .printable, .printable * { visibility: visible; }
          .printable { position: relative; left: 0; top: 0; }
          .no-print, .no-print * { display: none !important; }
          /* Hide global layout elements */
          aside, nav, .fixed { display: none !important; }
          /* Ensure text colors print correctly */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      
      {/* Dynamic Header */}
      <div className="printable bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 w-full md:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link to={createPageUrl('JobEstimates')} className="no-print">
               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full -ml-2">
                 <ArrowLeft className="w-5 h-5 text-slate-400" />
               </Button>
            </Link>
            {estimateId ? (
                <>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                EST #{estimateId.slice(-6)}
                </Badge>
                <Badge className={
                formData.status === 'approved' ? 'bg-green-100 text-green-700' :
                formData.status === 'converted' ? 'bg-purple-100 text-purple-700' :
                'bg-blue-50 text-blue-700'
                }>
                {formData.status.toUpperCase()}
                </Badge>
                </>
            ) : (
                <Badge className="bg-indigo-100 text-indigo-700">NEW ESTIMATE</Badge>
            )}
          </div>
          
          {/* Editable Title and Client for New Estimate */}
          {!estimateId ? (
              <div className="space-y-3 pt-1">
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Estimate Title (e.g. Bathroom Remodel)"
                    className="text-2xl font-bold h-auto py-2 px-3 border-slate-200 focus:border-indigo-500"
                  />
                  <Select 
                    value={formData.client_profile_id} 
                    onValueChange={(val) => setFormData({...formData, client_profile_id: val})}
                  >
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select Client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
          ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900">{client?.name || 'Unknown Client'}</h1>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <FileText className="w-4 h-4" />
                    {formData.title}
                </div>
              </>
          )}
        </div>

        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
           <div className="text-right">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Estimate</div>
              <div className="text-4xl font-bold text-indigo-600">${formData.total_amount?.toFixed(2) || '0.00'}</div>
           </div>
           
           <div className="flex flex-wrap gap-2 justify-end w-full no-print">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                 <Printer className="w-4 h-4" /> Print PDF
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calculator className="w-4 h-4" /> Tools
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Handyman Calculators</DialogTitle>
                  </DialogHeader>
                  <HandymanCalculators />
                </DialogContent>
              </Dialog>

              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100" 
                onClick={() => {
                    if (confirm('Convert this estimate to an active Job?')) {
                        convertToJobMutation.mutate();
                    }
                }}
                disabled={convertToJobMutation.isPending || formData.status === 'converted'}
              >
                <Briefcase className="w-4 h-4" /> 
                {formData.status === 'converted' ? 'Job Created' : convertToJobMutation.isPending ? 'Converting...' : 'Convert to Job'}
              </Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6 printable">
          
          {/* Quick Scoping Wizard */}
          <div className="no-print">
            
            {/* --- JOB KIT LOADER --- */}
            <JobKitLoader onItemAdd={addItem} />
            {/* ---------------------- */}

            <QuickScoping onAddItem={addItem} clientNotes={client?.permanent_notes} />
            <ScopingAlerts items={formData.items} />
          </div>

          {/* Line Items Table & Financial Summary */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold text-slate-800">Line Items</CardTitle>
              <Button size="sm" variant="outline" onClick={() => addItem()} className="no-print bg-white hover:bg-slate-50 gap-2 border-slate-200">
                <Plus className="w-4 h-4" /> Add Manual Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[40%] pl-6">Description</TableHead>
                    <TableHead className="w-[15%]">Qty</TableHead>
                    <TableHead className="w-[20%]">Unit Cost</TableHead>
                    <TableHead className="w-[20%] text-right pr-6">Line Total</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500 italic">
                        No items yet. Use the wizard above or click "Add Manual Item".
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                             <Input 
                               value={item.description} 
                               onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                               placeholder="Description"
                               className="border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent flex-1"
                             />
                             <Dialog>
                               <DialogTrigger asChild>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-6 w-6 ${item.inventory_id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-slate-500'}`}
                                    title="Link to Inventory"
                                 >
                                   <LinkIcon className="w-3 h-3" />
                                 </Button>
                               </DialogTrigger>
                               <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Link to Inventory Item</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                     <p className="text-sm text-slate-500">
                                       Select an inventory item to link. This will allow for automatic stock deductions when the job is started.
                                     </p>
                                     <Select 
                                       value={item.inventory_id || ''} 
                                       onValueChange={(val) => handleItemChange(index, 'inventory_id', val)}
                                     >
                                        <SelectTrigger>
                                           <SelectValue placeholder="Select inventory item..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                           {inventory?.map(inv => (
                                              <SelectItem key={inv.id} value={inv.id}>
                                                {inv.item_name} (Qty: {inv.quantity})
                                              </SelectItem>
                                           ))}
                                        </SelectContent>
                                     </Select>
                                     {item.inventory_id && (
                                        <Button 
                                          variant="ghost" 
                                          className="text-red-500 h-8 text-xs"
                                          onClick={() => handleItemChange(index, 'inventory_id', null)}
                                        >
                                           Unlink Item
                                        </Button>
                                     )}
                                  </div>
                               </DialogContent>
                             </Dialog>
                          </div>
                          {item.inventory_id && (
                             <div className="text-[10px] text-indigo-600 pl-3 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                Linked to Inventory
                             </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-20 border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <Input 
                              type="number" 
                              min="0"
                              className="pl-5 border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent"
                              value={item.unit_cost} 
                              onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium pr-6 text-slate-700">
                          ${(parseFloat(item.total) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-4 no-print">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Financial Summary Footer */}
              <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                 <div className="flex flex-col items-end gap-3 max-w-xs ml-auto">
                    <div className="flex justify-between w-full text-sm">
                       <span className="text-slate-500">Subtotal</span>
                       <span className="font-medium text-slate-900">${formData.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-sm">
                       <span className="text-slate-500">Tax Rate (%)</span>
                       <Input 
                          type="number" 
                          className="w-16 h-8 text-right bg-white border-slate-200" 
                          value={formData.tax_rate}
                          onChange={(e) => handleTaxChange(e.target.value)}
                       />
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between w-full text-lg">
                       <span className="font-bold text-slate-700">Grand Total</span>
                       <span className="font-bold text-indigo-600">${formData.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="no-print">
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

            {client && (
               <Card className="bg-amber-50 border-amber-200 mt-6">
               <CardHeader className="pb-2">
                 <CardTitle className="text-amber-900 text-lg flex items-center gap-2">
                    <StickyNote className="w-5 h-5" />
                    Client Notes & Context
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex gap-4 items-start">
                    <div>
                      <div className="font-semibold text-amber-900 text-sm">{client.name}</div>
                      <div className="text-sm text-amber-800 mt-2">
                        {client.permanent_notes ? (
                          <p className="bg-white/50 p-2 rounded border border-amber-100">{client.permanent_notes}</p>
                        ) : (
                          <p className="italic text-amber-700/70">No permanent notes available.</p>
                        )}
                      </div>
                      <Link to={`${createPageUrl('ClientDetail')}?id=${client.id}`} className="text-xs text-amber-600 hover:underline mt-2 block font-medium">
                        View Full Client Profile
                      </Link>
                    </div>
                 </div>
               </CardContent>
             </Card>
          )}
        </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 no-print">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Estimate Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Title</label>
                 <Input 
                   value={formData.title} 
                   onChange={(e) => setFormData({...formData, title: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                 <Input 
                   type="date"
                   value={formData.date} 
                   onChange={(e) => setFormData({...formData, date: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
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
                     <SelectItem value="converted">Converted</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <Button 
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 gap-2"
                onClick={handleSave}
                disabled={updateMutation.isPending || createMutation.isPending}
              >
                <Save className="w-4 h-4" /> 
                {updateMutation.isPending || createMutation.isPending ? 'Saving...' : (estimateId ? 'Save Settings' : 'Create Estimate')}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// JOB KIT LOADER (DROPDOWN)
// ==========================================
function JobKitLoader({ onItemAdd }) {
  const [kits, setKits] = useState([]);
  const [selectedKitId, setSelectedKitId] = useState('');

  useEffect(() => {
    base44.entities.JobKit.list('name', 100).then(res => setKits(res || []));
  }, []);

  const loadKit = async () => {
    if (!selectedKitId) return;
    const kit = kits.find(k => k.id === selectedKitId);
    
    if (!confirm(`Load "${kit.name}"?`)) return;

    try {
      const items = await base44.entities.JobKitItem.filter({ job_kit_id: kit.id });
      if (!items || items.length === 0) {
        toast.error("Kit is empty!");
        return;
      }

      items.forEach(item => {
        onItemAdd({
          description: `${item.category}: ${item.item_name}`, 
          quantity: item.default_qty || 0,
          unit_cost: item.default_cost || 0,
          total: 0
        });
      });
      
      toast.success(`Loaded ${kit.name}`);
      setSelectedKitId(''); // Reset dropdown
      
    } catch (e) {
      toast.error("Failed to load kit");
    }
  };

  if (kits.length === 0) return null;

  return (
    <Card className="border-indigo-100 bg-indigo-50/50 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-indigo-900 text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          Quick Load Job Kits
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Select value={selectedKitId} onValueChange={setSelectedKitId}>
          <SelectTrigger className="w-[300px] bg-white border-indigo-200">
            <SelectValue placeholder="Select a Job Kit..." />
          </SelectTrigger>
          <SelectContent>
            {kits.map(kit => (
              <SelectItem key={kit.id} value={kit.id}>{kit.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={loadKit} 
          disabled={!selectedKitId}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          + Load Kit
        </Button>
      </CardContent>
    </Card>
  );
}