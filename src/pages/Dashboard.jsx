// ========== SECTION 1: IMPORTS ==========
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  FileText, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import LowStockWidget from '@/components/inventory/LowStockWidget';

// ========== SECTION 2: DASHBOARD COMPONENT ==========
export default function Dashboard() {
  // ========== SECTION 3: DATA FETCHING ==========
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['clients-count'],
    queryFn: () => base44.entities.ClientProfile.list('-created_date', 1),
  });

  const { data: estimates, isLoading: loadingEstimates } = useQuery({
    queryKey: ['estimates-recent'],
    queryFn: () => base44.entities.JobEstimate.list('-created_date', 5),
  });

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ['leads-count'],
    queryFn: () => base44.entities.ClientScheduleLead.list('-created_date', 1),
  });

  // ========== SECTION 4: STATS CONFIGURATION ==========
  const stats = [
    {
      title: "Total Clients",
      value: loadingClients ? "..." : (clients?.length || 0) > 0 ? "Active" : "0", 
      icon: Users,
      color: "bg-blue-500",
      link: "ClientProfiles"
    },
    {
      title: "Active Estimates",
      value: loadingEstimates ? "..." : "View",
      icon: FileText,
      color: "bg-emerald-500",
      link: "JobEstimates"
    },
    {
      title: "Schedule & Leads",
      value: loadingLeads ? "..." : "Manage",
      icon: Calendar,
      color: "bg-violet-500",
      link: "ScheduleLeads"
    }
  ];

  // ========== SECTION 5: RENDER UI ==========
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back to The "Back-Office" Hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Link key={index} to={createPageUrl(stat.link)}>
            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-4 rounded-2xl ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Estimates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEstimates ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : estimates && estimates.length > 0 ? (
              <div className="space-y-4">
                {estimates.map((est) => (
                  <div key={est.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div>
                      <p className="font-medium text-slate-900">{est.title}</p>
                      <p className="text-sm text-slate-500">${est.amount?.toLocaleString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      est.status === 'approved' ? 'bg-green-100 text-green-700' :
                      est.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {est.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No recent estimates found.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <LowStockWidget />

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <CardContent className="p-8 flex flex-col justify-center h-full items-start">
              <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3 w-full">
                <Link to={createPageUrl('ClientProfiles')} className="w-full">
                  <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-left flex items-center justify-between transition-all">
                    <span className="font-medium">Add New Client</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link to={createPageUrl('JobEstimates')} className="w-full">
                  <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl text-left flex items-center justify-between transition-all">
                    <span className="font-medium">Create Estimate</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}