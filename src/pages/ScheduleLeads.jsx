import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar as CalIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ScheduleLeads() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['schedule-leads'],
    queryFn: () => base44.entities.ClientScheduleLead.list('date', 100), // Closest dates first
  });

  const [newItem, setNewItem] = useState({
    client_profile_id: '',
    type: 'lead',
    title: '',
    date: '',
    status: 'new',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientScheduleLead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule-leads']);
      setIsCreateOpen(false);
      setNewItem({
        client_profile_id: '',
        type: 'lead',
        title: '',
        date: '',
        status: 'new',
        notes: ''
      });
    }
  });

  const getClientName = (id) => clients?.find(c => c.id === id)?.name || 'Unknown Client';

  const filteredRecords = records?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                         getClientName(item.client_profile_id).toLowerCase().includes(search.toLowerCase());
    const matchesType = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule & Leads</h1>
          <p className="text-slate-500 mt-1">Manage appointments and potential opportunities</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Schedule or Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                <Label>Record Type</Label>
                <Select 
                  value={newItem.type} 
                  onValueChange={(val) => setNewItem({...newItem, type: val})}
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
                <Label>Client (Relationship)</Label>
                <Select 
                  value={newItem.client_profile_id} 
                  onValueChange={(val) => setNewItem({...newItem, client_profile_id: val})}
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
              <div className="space-y-2">
                <Label htmlFor="title">Title / Description</Label>
                <Input 
                  id="title" 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="e.g. Initial Consultation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input 
                  id="date" 
                  type="datetime-local"
                  value={newItem.date} 
                  onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newItem.status} 
                  onValueChange={(val) => setNewItem({...newItem, status: val})}
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
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  value={newItem.notes} 
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(newItem)}
                disabled={!newItem.client_profile_id || !newItem.title || createMutation.isPending}
                className="bg-indigo-600 text-white w-full sm:w-auto"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="lead">Leads</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-9 h-10 bg-white border-slate-200"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords?.map((item) => (
          <Link key={item.id} to={createPageUrl(`ScheduleLeadDetail?id=${item.id}`)} className="block">
            <Card className="border-slate-200 hover:shadow-md transition-all cursor-pointer hover:border-indigo-300">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className={`
                    ${item.type === 'lead' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-purple-50 text-purple-700 border-purple-200'}
                  `}>
                    {item.type.toUpperCase()}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                    {item.status}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
                <p className="text-indigo-600 font-medium text-sm mb-4">{getClientName(item.client_profile_id)}</p>
                
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                  <CalIcon className="w-4 h-4" />
                  {item.date ? format(new Date(item.date), 'PPP p') : 'No date set'}
                </div>

                {item.notes && (
                  <div className="text-sm text-slate-600 border-t border-slate-100 pt-3">
                    <p className="line-clamp-2">{item.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredRecords?.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No records found.
          </div>
        )}
      </div>
    </div>
  );
}