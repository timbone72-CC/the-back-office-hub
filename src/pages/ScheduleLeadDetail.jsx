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
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    queryFn: () => base44.entities.ClientScheduleLead.list({ id: recordId }).then(res => res[0]),
    enabled: !!recordId
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientScheduleLead.update(recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-lead', recordId]);
      toast.success('Record saved successfully');
    },
    onError: () => {
      toast.error('Failed to save record');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ClientScheduleLead.delete(recordId),
    onSuccess: () => {
      toast.success('Record deleted');
      navigate(createPageUrl('ScheduleLeads'));
    }
  });

  if (isLoading || !formData) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <label className="text-sm font-medium text-slate-700">Title / Description</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
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