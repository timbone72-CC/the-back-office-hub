import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MapPin,
  ChevronRight,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientProfiles() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    permanent_notes: ''
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.ClientProfile.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      setIsCreateOpen(false);
      setNewClient({ name: '', phone: '', email: '', address: '', permanent_notes: '' });
      }
      });

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Client Profiles</h1>
          <p className="text-slate-500 mt-1">Manage your client database and relationships</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Client Profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input 
                  id="name" 
                  value={newClient.name} 
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={newClient.phone} 
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newClient.email} 
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Job Site Address</Label>
                <Input 
                  id="address" 
                  value={newClient.address} 
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Permanent Notes (Preferences)</Label>
                <Input 
                  id="notes" 
                  value={newClient.permanent_notes} 
                  onChange={(e) => setNewClient({...newClient, permanent_notes: e.target.value})}
                  placeholder="e.g. Prefers Cedar, Gate Code: 1234"
                />
              </div>
              </div>
              <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(newClient)}
                disabled={!newClient.name || createMutation.isPending}
                className="bg-indigo-600 text-white"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          className="pl-10 h-12 bg-white border-slate-200"
          placeholder="Search clients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredClients?.length > 0 ? (
          filteredClients.map((client) => (
            <Link key={client.id} to={`${createPageUrl('ClientDetail')}?id=${client.id}`}>
              <Card className="hover:shadow-lg transition-all duration-200 group border-slate-200 hover:border-indigo-100 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-indigo-50">
                        <AvatarFallback className="text-indigo-600 font-bold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-sm text-slate-500">Client ID: #{client.id.slice(-4)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {client.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-indigo-600">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No clients found</h3>
            <p className="text-slate-500 mt-1">Get started by creating your first client profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}