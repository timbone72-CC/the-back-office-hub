import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText,
  Clock,
  Plus,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ClientDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const clientId = urlParams.get('id');

  console.log("ClientDetail: ID from URL:", clientId);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      // Demo Fallback if no ID is provided
      if (!clientId) {
        return {
          id: 'demo-client-123',
          name: 'Demo Client',
          phone: '(555) 123-4567',
          email: 'demo@example.com',
          address: '123 Demo Lane, Builder City, BC',
          permanent_notes: 'This is a demo client profile shown for preview purposes.',
          created_date: new Date().toISOString()
        };
      }
      try {
        const res = await base44.entities.ClientProfile.filter({ id: clientId });
        return res && res.length > 0 ? res[0] : null;
      } catch (e) {
        console.error("Error fetching client:", e);
        return null;
      }
    },
    // Always enabled to allow demo fallback
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Reverse Lookup / Related Records View
  const { data: estimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ['client-estimates', clientId],
    queryFn: () => base44.entities.JobEstimate.filter({ client_profile_id: clientId }, '-created_date', 100),
    enabled: !!clientId
  });

  const { data: scheduleLeads, isLoading: scheduleLoading } = useQuery({
    queryKey: ['client-schedule', clientId],
    queryFn: () => base44.entities.ClientScheduleLead.filter({ client_profile_id: clientId }, '-date', 100),
    enabled: !!clientId
  });

  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const handleEditOpen = () => {
      setEditForm({
          name: client.name,
          phone: client.phone || '',
          email: client.email || '',
          address: client.address || '',
          permanent_notes: client.permanent_notes || ''
      });
      setIsEditOpen(true);
  };

  const updateClientMutation = useMutation({
      mutationFn: (data) => base44.entities.ClientProfile.update(clientId, data),
      onSuccess: () => {
          queryClient.invalidateQueries(['client', clientId]);
          setIsEditOpen(false);
          toast.success("Client profile updated");
      },
      onError: () => toast.error("Failed to update profile")
  });

  if (clientLoading) return <div className="p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!client && !clientLoading) return (
    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Client Not Found</h2>
      <p className="text-slate-500 mb-4">The client profile you are looking for does not exist or has been deleted.</p>
      <Link to={createPageUrl('ClientProfiles')}>
        <Button>Return to Client List</Button>
      </Link>
    </div>
  );

  const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      sent: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      scheduled: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-slate-100 text-slate-500'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('ClientProfiles')}>
          <Button variant="ghost" size="icon" className="hover:bg-white rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-slate-500">Back to Clients</h1>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md rounded-2xl">
                <AvatarFallback className="text-2xl font-bold bg-indigo-50 text-indigo-600 rounded-2xl">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
                <p className="text-slate-500">Client ID: #{client.id.slice(-4)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" onClick={handleEditOpen}>
                    <Pencil className="w-4 h-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Client Profile</DialogTitle>
                  </DialogHeader>
                  {editForm && (
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Client Name</Label>
                        <Input 
                          id="edit-name" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-phone">Phone</Label>
                          <Input 
                            id="edit-phone" 
                            value={editForm.phone} 
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input 
                            id="edit-email" 
                            value={editForm.email} 
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-address">Job Site Address</Label>
                        <Input 
                          id="edit-address" 
                          value={editForm.address} 
                          onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-notes">Permanent Notes (Preferences)</Label>
                        <Input 
                          id="edit-notes" 
                          value={editForm.permanent_notes} 
                          onChange={(e) => setEditForm({...editForm, permanent_notes: e.target.value})}
                          placeholder="e.g. Prefers Cedar, Gate Code: 1234"
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => updateClientMutation.mutate(editForm)}
                      disabled={!editForm?.name || updateClientMutation.isPending}
                      className="bg-indigo-600 text-white"
                    >
                      {updateClientMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <Phone className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{client.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{client.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Job Site</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{client.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service History Section - The Reverse Lookup */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Service History</h2>
          <div className="flex gap-2">
            <Link to={createPageUrl('JobEstimates')}>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> New Estimate
              </Button>
            </Link>
            <Link to={createPageUrl('ScheduleLeads')}>
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Schedule/Lead
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:inline-flex">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">All History</TabsTrigger>
            <TabsTrigger value="estimates" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Estimates</TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Schedule & Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estimates Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Job Estimates
                </h3>
                {estimatesLoading ? <Skeleton className="h-32" /> : 
                 estimates?.length === 0 ? <p className="text-slate-500 text-sm italic">No estimates found.</p> :
                 estimates?.map(est => (
                   <Card key={est.id} className="hover:border-indigo-200 transition-colors">
                     <CardContent className="p-4">
                       <div className="flex justify-between items-start mb-2">
                         <div className="font-medium">{est.title}</div>
                         <Badge className={getStatusColor(est.status)} variant="secondary">{est.status}</Badge>
                       </div>
                       <div className="flex justify-between items-end text-sm">
                         <div className="text-slate-500">
                           {est.date && format(new Date(est.date), 'MMM d, yyyy')}
                         </div>
                         <div className="font-bold text-slate-900">${est.amount?.toLocaleString()}</div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
              </div>

              {/* Schedule Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Schedule & Leads
                </h3>
                {scheduleLoading ? <Skeleton className="h-32" /> :
                 scheduleLeads?.length === 0 ? <p className="text-slate-500 text-sm italic">No records found.</p> :
                 scheduleLeads?.map(item => (
                   <Card key={item.id} className="hover:border-indigo-200 transition-colors">
                     <CardContent className="p-4">
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className={item.type === 'lead' ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-purple-200 text-purple-700 bg-purple-50'}>
                              {item.type}
                            </Badge>
                            <span className="font-medium">{item.title}</span>
                         </div>
                         <Badge className={getStatusColor(item.status)} variant="secondary">{item.status}</Badge>
                       </div>
                       <div className="text-sm text-slate-500 mb-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {item.date ? format(new Date(item.date), 'PP p') : 'No date set'}
                       </div>
                       {item.notes && (
                         <div className="text-sm bg-slate-50 p-2 rounded text-slate-600">
                           {item.notes}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Detailed tabs just filter the view essentially, keeping it simple for now with the All view which is most useful */}
          <TabsContent value="estimates" className="mt-6">
            <div className="space-y-4">
                 {estimates?.map(est => (
                   <Card key={est.id}>
                     <CardContent className="p-4 flex justify-between items-center">
                       <div>
                         <div className="font-medium">{est.title}</div>
                         <div className="text-sm text-slate-500">{est.date && format(new Date(est.date), 'MMM d, yyyy')}</div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold mb-1">${est.amount?.toLocaleString()}</div>
                         <Badge className={getStatusColor(est.status)}>{est.status}</Badge>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-6">
             <div className="space-y-4">
                 {scheduleLeads?.map(item => (
                   <Card key={item.id}>
                     <CardContent className="p-4">
                       <div className="flex justify-between items-start">
                         <div>
                            <div className="flex gap-2 items-center mb-1">
                                <Badge variant="outline">{item.type}</Badge>
                                <span className="font-medium">{item.title}</span>
                            </div>
                            <div className="text-sm text-slate-500">
                                {item.date && format(new Date(item.date), 'PPP p')}
                            </div>
                         </div>
                         <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                       </div>
                       {item.notes && <p className="mt-2 text-sm text-slate-600">{item.notes}</p>}
                     </CardContent>
                   </Card>
                 ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}