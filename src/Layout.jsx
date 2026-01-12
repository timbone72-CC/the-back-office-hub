// ========== FILE: layout/main.jsx ==========

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
Users, 
FileText, 
Calendar, 
LayoutDashboard, 
Menu, 
X,
Briefcase,
Calculator,
ShoppingBag,
Database,
Package,
Activity,
Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children }) {
  // SECTION 1: ROUTING & UI STATE
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // SECTION 2: NAVIGATION CONFIGURATION
  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Clients', icon: Users, path: '/clients' },
    { name: 'Estimates & Jobs', icon: FileText, path: '/estimates' },
    { name: 'Schedule', icon: Calendar, path: '/schedule-leads' },
    { name: 'Our Work', icon: ImageIcon, path: '/portfolio' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Job Kits', icon: Package, path: '/job-kits' },
    { name: 'Calculators', icon: Calculator, path: '/calculators' },
    { name: 'System Logs', icon: Activity, path: '/system-logs' },
    ];

  // SECTION 3: UTILITY FUNCTIONS
  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  // SECTION 4: NOTIFICATION & BACKGROUND LOGIC
  // Notification Logic: Check for upcoming appointments occasionally
  // In a real app, this would be a backend cron job.
  // Here we use the active client to trigger the check.
  React.useEffect(() => {
    const checkAppointments = async () => {
        try {
            await base44.functions.invoke('checkUpcomingAppointments', {});
        } catch (e) {
            console.error("Notification check failed", e);
        }
    };
    
    // Check on mount and every 15 minutes
    checkAppointments();
    const interval = setInterval(checkAppointments, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // SECTION 5: RENDER MAIN VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* SECTION 6: DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800">Back-Office Hub</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.name} to={createPageUrl(
                item.path === '/' ? 'Dashboard' : 
                item.path.slice(1) === 'clients' ? 'ClientProfiles' : 
                item.path.slice(1) === 'estimates' ? 'JobEstimates' : 
                item.path.slice(1) === 'calculators' ? 'Calculators' :
                item.path.slice(1) === 'procurement' ? 'MaterialProcurement' :
                item.path.slice(1) === 'inventory' ? 'Inventory' :
                item.path.slice(1) === 'portfolio' ? 'Portfolio' :
                item.path.slice(1) === 'import' ? 'DataImport' :
                item.path.slice(1) === 'system-logs' ? 'SystemLogs' :
                'ScheduleLeads'
                )}>
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Support</p>
            <p className="text-sm text-slate-600">Need help? Contact support@hub.com</p>
          </div>
        </div>
      </aside>

      {/* SECTION 7: MOBILE HEADER & NAVIGATION */}
      <div className="md:hidden fixed w-full bg-white z-20 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">Back-Office Hub</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-white pt-20 px-4">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link 
                key={item.name} 
                to={createPageUrl(
                  item.path === '/' ? 'Dashboard' : 
                  item.path.slice(1) === 'clients' ? 'ClientProfiles' : 
                  item.path.slice(1) === 'estimates' ? 'JobEstimates' : 
                  item.path.slice(1) === 'calculators' ? 'Calculators' :
                  item.path.slice(1) === 'procurement' ? 'MaterialProcurement' :
                  item.path.slice(1) === 'import' ? 'DataImport' :
                  item.path.slice(1) === 'system-logs' ? 'SystemLogs' :
                  'ScheduleLeads'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={`flex items-center gap-3 px-4 py-4 rounded-xl mb-2 ${
                  isActive(item.path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* SECTION 8: MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}