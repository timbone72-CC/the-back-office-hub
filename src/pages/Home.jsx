// ========== FILE: pages/Home.jsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Calendar, AlertTriangle, ArrowRight, Package, TrendingUp, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clientCount: 0, activeEstimates: 0, lowStockCount: 0 });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const estimates = await base44.entities.JobEstimate.list() || [];
        const clients = await base44.entities.ClientProfile.list() || [];
        const inventory = await base44.entities.Inventory.list() || [];
        
        setRecentEstimates([...estimates].reverse().slice(0, 5));
        const lowStock = inventory.filter(i => i.quantity <= (i.reorderPoint || 5));
        setLowStockItems(lowStock.slice(0, 3));
        
        setStats({
          clientCount: clients.length,
          activeEstimates: estimates.filter(e => e.status === 'draft' || e.status === 'sent').length,
          lowStockCount: lowStock.length
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-slate-900">Back-Office Hub</h1>
        <p className="text-slate-500">Welcome back.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => navigate('/clients')} className="cursor-pointer hover:shadow-md"><CardContent className="p-6"><div><p className="text-sm text-slate-500">Total Clients</p><h3 className="text-3xl font-bold">{stats.clientCount}</h3></div></CardContent></Card>
        <Card onClick={() => navigate('/estimates')} className="cursor-pointer hover:shadow-md"><CardContent className="p-6"><div><p className="text-sm text-slate-500">Active Estimates</p><h3 className="text-3xl font-bold">{stats.activeEstimates}</h3></div></CardContent></Card>
        <Card onClick={() => navigate('/inventory')} className="cursor-pointer hover:shadow-md"><CardContent className="p-6"><div><p className="text-sm text-slate-500">Low Stock Alerts</p><h3 className="text-3xl font-bold">{stats.lowStockCount}</h3></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Estimates</CardTitle></CardHeader>
        <CardContent>
          {recentEstimates.map((est, i) => (
            <div key={i} onClick={() => navigate(`/estimate/${est._id || est.id}`)} className="flex justify-between p-3 hover:bg-slate-50 cursor-pointer border-b">
              <div><p className="font-semibold">{est.title || 'Untitled'}</p><p className="text-xs text-slate-500">${(est.total_amount || 0).toFixed(2)}</p></div>
              <Badge>{est.status || 'draft'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center gap-8 z-10">
        <Button onClick={() => navigate('/tools')} className="flex flex-col h-auto py-2"><DollarSign className="w-5 h-5"/><span className="text-xs">New Est</span></Button>
        <Button variant="ghost" onClick={() => navigate('/clients')} className="flex flex-col h-auto py-2"><Users className="w-5 h-5"/><span className="text-xs">Clients</span></Button>
      </div>
    </div>
  );
}