// ========== FILE: pages/JobEstimates.jsx ==========

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
  // SECTION 1: STATE INITIALIZATION
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('estimates');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // SECTION 2: DATA FETCHING (QUERIES)
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

  // SECTION 3: EXPORT & UTILITY LOGIC
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

  // SECTION 4: FILTERING LOGIC
  const filteredEstimates = estimates?.filter(est => 
    est.title.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(est.client_profile_id).toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    getClientName(job.client_profile_id).toLowerCase().includes(search.toLowerCase())
  );

  // SECTION 5: RENDER MAIN VIEW
  return (
    <div className="space-y-8">
      {/* SECTION 6: HEADER & PRIMARY ACTIONS */}
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

      {/* SECTION 7: SEARCH BAR */}
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

      {/* SECTION 8: PIPELINE TABS (ESTIMATES vs JOBS) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 mb-6">
          <TabsTrigger value="estimates" className="px-6">Estimates</TabsTrigger>
          <TabsTrigger value="jobs" className="px-6">Active Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="estimates" className="space-y-4">
          {/* ... Estimates Grid/List ... */}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {/* ... Active Jobs Grid/List ... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}