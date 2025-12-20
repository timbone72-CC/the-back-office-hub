import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ScopingAlerts({ items }) {
    const alerts = [];
    
    if (!items || !Array.isArray(items)) return null;

    // Check for Drywall
    if (items.some(item => item.description?.toLowerCase().includes('drywall'))) {
        alerts.push({
            id: 'drywall',
            title: 'Drywall Alert',
            message: 'Perform "Tap Test" to check for hidden water damage behind the wall.'
        });
    }

    // Check for Plumbing
    if (items.some(item => 
        item.description?.toLowerCase().includes('plumbing') || 
        item.description?.toLowerCase().includes('pipe') || 
        item.description?.toLowerCase().includes('leak')
    )) {
        alerts.push({
            id: 'plumbing',
            title: 'Plumbing Check',
            message: 'Verify integrity of all shut-off valves before starting work.'
        });
    }

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {alerts.map(alert => (
                <Alert key={alert.id} className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-semibold flex items-center gap-2">
                        {alert.title}
                    </AlertTitle>
                    <AlertDescription className="text-amber-700/90 mt-1">
                        {alert.message}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}