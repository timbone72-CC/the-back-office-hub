import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all estimates (limit to 1000 for now to be safe)
        const estimates = await base44.entities.JobEstimate.list('-date', 1000);
        
        // Fetch clients to map IDs to names
        // Optimization: In a real large app we might want to do this differently, 
        // but for a handyman business, fetching all clients is usually fine.
        const clients = await base44.entities.ClientProfile.list('name', 1000);
        const clientMap = new Map(clients.map(c => [c.id, c.name]));

        // CSV Header for QuickBooks Online Import
        // Common columns: Date, InvoiceNo, Customer, Description, Amount, Status
        const headers = ['Date', 'InvoiceNo', 'Customer', 'Description', 'Amount', 'Status'];
        
        const rows = estimates.map(est => {
            // Format Date (MM/DD/YYYY)
            const dateObj = est.date ? new Date(est.date) : new Date(est.created_date);
            const formattedDate = dateObj.toLocaleDateString('en-US');
            
            // Safe CSV fields (handle commas in text)
            const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
            
            return [
                escape(formattedDate),
                escape(est.id.slice(-6)), // Using last 6 chars of ID as Invoice No
                escape(clientMap.get(est.client_profile_id) || 'Unknown Client'),
                escape(est.title),
                (est.total_amount || est.amount || 0).toFixed(2),
                escape(est.status)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="financial_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});