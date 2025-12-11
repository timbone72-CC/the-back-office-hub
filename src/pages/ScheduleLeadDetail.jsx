import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save, 
  Trash2,
  Calendar,
  Clock,
  User,
  FileText,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PhotoUpload from '@/components/PhotoUpload';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ScheduleLeadDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['schedule-lead', recordId],
    queryFn: async () => {
      const res = await base44.entities.ClientScheduleLead.list({ id: recordId });
      return res && res.length > 0 ? res[0] : null;
    },
    enabled: !!recordId
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (record) {
      setFormData({ 
        ...record, 
        photos: record.photos || [],
        service_description: record.service_description || '',
        ai_summary: record.ai_summary || ''
      });
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Auto-generate summary if description exists but summary is empty
      let dataToSave = { ...data };
      if (data.service_description && !data.ai_summary) {
        try {
          toast.info('Generating AI summary...');
          const aiRes = await base44.integrations.Core.InvokeLLM({
            prompt: `Summarize this service request into one concise sentence: "${data.service_description}"`,
            response_json_schema: { type: "object", properties: { summary: { type: "string" } } }
          });
          if (aiRes.summary) {
            dataToSave.ai_summary = aiRes.summary;
            setFormData(prev => ({ ...prev, ai_summary: aiRes.summary }));
          }
        } catch (e) {
          console.error("AI Summary failed", e);
        }
      }
      return base44.entities.ClientScheduleLead.update(recordId, dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-lead', recordId]);
      toast.success('Record saved successfully');
    },
    onError: () => {
      toast.error('Failed to save record');
    }
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!formData.service_description) throw new Error("Service description is required");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this service request into one concise sentence: "${formData.service_description}"`,
        response_json_schema: { type: "object", properties: { summary: { type: "string" } } }
      });
      return res.summary;
    },
    onSuccess: (summary) => {
      setFormData(prev => ({ ...prev, ai_summary: summary }));
      toast.success('AI Summary generated');
    },
    onError: (err) => {
      toast.error('Failed to generate summary: ' + err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ClientScheduleLead.delete(recordId),
    onSuccess: () => {
      toast.success('Record deleted');
      navigate(createPageUrl('ScheduleLeads'));
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!record && !isLoading) return (
    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Record Not Found</h2>
      <p className="text-slate-500 mb-4">The record you are looking for does not exist or has been deleted.</p>
      <Link to={createPageUrl('ScheduleLeads')}>
        <Button>Return to Schedule & Leads</Button>
      </Link>
    </div>
  );
  if (!formData) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('ScheduleLeads')}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {formData.type === 'lead' ? 'Lead Details' : 'Schedule Details'}
            </h1>
            <p className="text-slate-500">#{recordId.slice(-6)}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
          onClick={() => {
            if (confirm('Are you sure you want to delete this record?')) {
              deleteMutation.mutate();
            }
          }}
        >
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData({...formData, type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="schedule">Schedule / Appointment</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="needs_callback">Needs Callback</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Client</label>
              <Select 
                value={formData.client_profile_id} 
                onValueChange={(val) => setFormData({...formData, client_profile_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Short title for this record"
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Requested Service Description</label>
              <Textarea 
                className="min-h-[80px]"
                value={formData.service_description} 
                onChange={(e) => setFormData({...formData, service_description: e.target.value})}
                placeholder="Detailed description of the service requested..."
              />
            </div>

            <div className="col-span-full space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  AI Summary
                </label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => generateSummaryMutation.mutate()}
                  disabled={generateSummaryMutation.isPending || !formData.service_description}
                  className="h-8 text-xs gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {generateSummaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
                </Button>
              </div>
              <Input 
                value={formData.ai_summary} 
                onChange={(e) => setFormData({...formData, ai_summary: e.target.value})}
                placeholder="One sentence summary (AI generated)"
                className="bg-indigo-50/50"
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Date & Time</label>
              <Input 
                type="datetime-local"
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <Textarea 
                className="min-h-[100px]"
                value={formData.notes || ''} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="col-span-full space-y-2 pt-4 border-t border-slate-100">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Job/Lead Photos
              </label>
              <PhotoUpload 
                photos={formData.photos} 
                onChange={(photos) => setFormData({...formData, photos})} 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending}
            >
              <Save className="w-4 h-4" /> 
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}