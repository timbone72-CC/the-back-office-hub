import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Download, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { toast } from 'sonner';

export default function JobEstimates() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Need clients for the dropdown relationship
  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.ClientProfile.list('name', 100),
  });

  const { data: estimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.JobEstimate.list('-created_date', 100),
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['active-jobs'],
    queryFn: () => base44.entities.Job.list('-updated_date', 100),
  });

  const [activeTab, setActiveTab] = useState('estimates');

  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      toast.info("Generating export...");
      const { data } = await base44.functions.invoke('exportFinancials');
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financials_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Export complete");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export data");
    }
  };

  const getClientName = (id) => clients?.find(c => c.id === id)?.name || 'Unknown Client';

  const filteredEstimates = estimates?.filter(est => 
    est.title.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(est.client_profile_id).toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(job.client_profile_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Estimates & Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your pipeline and active projects</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Link to={createPageUrl('EstimateDetail')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              New Estimate
            </Button>
          </Link>
              </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 mb-6">
          <TabsTrigger value="estimates" className="px-6">Estimates</TabsTrigger>
          <TabsTrigger value="jobs" className="px-6">Active Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="estimates" className="space-y-4">
          {filteredEstimates?.map((est) => (
            <Link key={est.id} to={`${createPageUrl('EstimateDetail')}?id=${est.id}`} className="block">
              <Card className="hover:shadow-md transition-all border-slate-200 hover:border-indigo-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{est.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <Link 
                        to={`${createPageUrl('ClientDetail')}?id=${est.client_profile_id}`}
                        onClick={(e) => e.stopPropagation()} 
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline z-10 relative"
                      >
                        {getClientName(est.client_profile_id)}
                      </Link>
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
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {filteredJobs?.map((job) => (
            <Link key={job.id} to={`${createPageUrl('JobDetail')}?id=${job.id}`} className="block">
              <Card className="hover:shadow-md transition-all border-slate-200 hover:border-emerald-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <Link 
                        to={`${createPageUrl('ClientDetail')}?id=${job.client_profile_id}`}
                        onClick={(e) => e.stopPropagation()} 
                        className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline z-10 relative"
                      >
                        {getClientName(job.client_profile_id)}
                      </Link>
                      <span>•</span>
                      <span>Job #{job.id.slice(-6)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Budget</p>
                    <p className="text-xl font-bold text-slate-900">${(job.budget || 0).toLocaleString()}</p>
                  </div>
                  <Badge className={`px-3 py-1 text-sm ${
                     job.status === 'completed' ? 'bg-green-100 text-green-700' :
                     job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                     'bg-slate-100 text-slate-700'
                  }`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
          {filteredJobs?.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No active jobs found. Convert an estimate to get started.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}