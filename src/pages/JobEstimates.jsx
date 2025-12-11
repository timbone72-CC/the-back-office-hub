import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
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
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function JobEstimates() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Need clients for the dropdown relationship
  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.JobEstimate.list('-created_date', 100),
  });

  const [newEstimate, setNewEstimate] = useState({
    client_profile_id: '',
    title: '',
    amount: '',
    status: 'draft',
    date: new Date().toISOString().split('T')[0]
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JobEstimate.create({
      ...data,
      amount: parseFloat(data.amount) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimates']);
      setIsCreateOpen(false);
      setNewEstimate({
        client_profile_id: '',
        title: '',
        amount: '',
        status: 'draft',
        date: new Date().toISOString().split('T')[0]
      });
    }
  });

  const getClientName = (id) => clients?.find(c => c.id === id)?.name || 'Unknown Client';

  const filteredEstimates = estimates?.filter(est => 
    est.title.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(est.client_profile_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Estimates</h1>
          <p className="text-slate-500 mt-1">Create and track estimates for your clients</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              New Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Client (Relationship)</Label>
                <Select 
                  value={newEstimate.client_profile_id} 
                  onValueChange={(val) => setNewEstimate({...newEstimate, client_profile_id: val})}
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
                <Label htmlFor="title">Estimate Title</Label>
                <Input 
                  id="title" 
                  value={newEstimate.title} 
                  onChange={(e) => setNewEstimate({...newEstimate, title: e.target.value})}
                  placeholder="e.g. Kitchen Renovation"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input 
                    id="amount" 
                    type="number"
                    value={newEstimate.amount} 
                    onChange={(e) => setNewEstimate({...newEstimate, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newEstimate.date} 
                    onChange={(e) => setNewEstimate({...newEstimate, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newEstimate.status} 
                  onValueChange={(val) => setNewEstimate({...newEstimate, status: val})}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(newEstimate)}
                disabled={!newEstimate.client_profile_id || !newEstimate.title || createMutation.isPending}
                className="bg-indigo-600 text-white w-full sm:w-auto"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Estimate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input 
            className="pl-10 h-12 bg-white border-slate-200"
            placeholder="Search estimates by title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="h-12 px-6 bg-slate-800 hover:bg-slate-900">
          Search
        </Button>
      </div>

      <div className="space-y-4">
        {filteredEstimates?.map((est) => (
          <Link key={est.id} to={createPageUrl(`EstimateDetail?id=${est.id}`)} className="block">
            <Card className="hover:shadow-md transition-all border-slate-200 hover:border-indigo-300 cursor-pointer">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{est.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{getClientName(est.client_profile_id)}</span>
                    <span>•</span>
                    <span>{est.date && format(new Date(est.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Total</p>
                  <p className="text-xl font-bold text-slate-900">${(est.total_amount || est.amount || 0).toLocaleString()}</p>
                </div>
                <Badge className={`px-3 py-1 text-sm ${
                   est.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                   est.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                   'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                  {est.status.charAt(0).toUpperCase() + est.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
        {filteredEstimates?.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No estimates found.
          </div>
        )}
      </div>
    </div>
  );
}