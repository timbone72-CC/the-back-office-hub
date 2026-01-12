import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, 
  FileText, Clock, Plus, Pencil, ExternalLink 
} from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

const STATUS_THEMES = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  scheduled: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  lead: 'border-orange-200 text-orange-700 bg-orange-50'
};

export default function ClientDetail() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // --- DATA FETCHING ---
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const res = await base44.entities.ClientProfile.filter({ id: clientId });
      return res?.[0] || null;
    },
    enabled: !!clientId
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['client-history', clientId],
    queryFn: async () => {
      const [estimates, schedule] = await Promise.all([
        base44.entities.JobEstimate.filter({ client_profile_id: clientId }, '-created_date'),
        base44.entities.ClientScheduleLead.filter({ client_profile_id: clientId }, '-date')
      ]);
      return { estimates, schedule };
    },
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientProfile.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      setIsEditOpen(false);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Update failed")
  });

  if (clientLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /></div>;
  if (!client) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-slate-500">Client profile not found.</p>
      <Button asChild><Link to={createPageUrl('ClientProfiles')}>Return to List</Link></Button>
    </div>
  );

  const initials = client.name?.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to={createPageUrl('ClientProfiles')}><ArrowLeft className="w-4 h-4" /> Clients</Link>
        </Button>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" asChild>
              <Link to={`${createPageUrl('JobEstimates')}?client_id=${clientId}`}><Plus className="w-4 h-4 mr-2" /> Estimate</Link>
           </Button>
           <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
              <Link to={`${createPageUrl('ScheduleLeads')}?client_id=${clientId}`}><Plus className="w-4 h-4 mr-2" /> Lead</Link>
           </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-24 bg-gradient-to-r from-slate-800 to-indigo-900" />
        <CardContent className="relative pt-0 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-8 gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-sm rounded-xl text-xl">
                <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <p className="text-sm text-slate-500">ID: {client.id?.slice(-6)}</p>
              </div>
            </div>
            
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
              </DialogTrigger>
              <EditProfileDialog client={client} onSave={updateMutation.mutate} isSaving={updateMutation.isPending} />
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <ContactInfo icon={<Phone />} label="Phone" value={client.phone} />
            <ContactInfo icon={<Mail />} label="Email" value={client.email} />
            <ContactInfo icon={<MapPin />} label="Job Site" value={client.address} />
          </div>
        </CardContent>
      </Card>

      {/* Service History Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="bg-slate-100/50 border">
          <TabsTrigger value="all">Overview</TabsTrigger>
          <TabsTrigger value="estimates">Estimates ({history?.estimates?.length || 0})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule ({history?.schedule?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HistorySection 
            title="Recent Estimates" 
            icon={<FileText />} 
            items={history?.estimates?.slice(0, 5)} 
            type="estimate" 
            loading={historyLoading} 
          />
          <HistorySection 
            title="Schedule & Leads" 
            icon={<Calendar />} 
            items={history?.schedule?.slice(0, 5)} 
            type="schedule" 
            loading={historyLoading} 
          />
        </TabsContent>
        {/* Full tab views can be expanded here similarly */}
      </Tabs>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function ContactInfo({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-indigo-600 w-4 h-4">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function HistorySection({ title, icon, items, type, loading }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-slate-700 px-1">
        <span className="text-slate-400">{icon}</span> {title}
      </h3>
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <div className="space-y-2">
          {items?.length ? items.map(item => (
            <Card key={item.id} className="hover:border-indigo-200 transition-colors shadow-none border-slate-200">
              <CardContent className="p-3 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {item.date || item.created_date ? format(new Date(item.date || item.created_date), 'MMM d, yyyy') : 'No date'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  {item.amount && <p className="text-sm font-bold">${item.amount.toLocaleString()}</p>}
                  <Badge className={STATUS_THEMES[item.status] || STATUS_THEMES[item.type] || ''} variant="secondary">
                    {item.status || item.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )) : <p className="text-sm text-slate-400 italic p-4 text-center border rounded-xl border-dashed">No history found.</p>}
        </div>
      )}
    </div>
  );
}

function EditProfileDialog({ client, onSave, isSaving }) {
  const [form, setForm] = useState({ ...client });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2"><Label>Full Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
        </div>
        <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        <div className="space-y-2"><Label>Notes</Label><Input value={form.permanent_notes} onChange={e => setForm({...form, permanent_notes: e.target.value})} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(form)} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}