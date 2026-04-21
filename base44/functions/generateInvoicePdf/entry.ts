import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await req.json();

        if (!jobId) {
            return Response.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // Fetch Job and Client Data
        const jobs = await base44.entities.Job.filter({ id: jobId });
        if (!jobs || jobs.length === 0) {
            return Response.json({ error: 'Job not found' }, { status: 404 });
        }
        const job = jobs[0];

        const clients = await base44.entities.ClientProfile.filter({ id: job.client_profile_id });
        const client = clients && clients.length > 0 ? clients[0] : { name: 'Valued Client' };

        // Calculations
        const laborRate = job.labor_rate || 75;
        const totalMinutes = (job.time_logs || []).reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
        const totalHours = totalMinutes / 60;
        const laborCost = totalHours * laborRate;
        const materialCost = (job.material_list || []).reduce((acc, item) => acc + (item.total || 0), 0);
        
        // Note: Invoice amount might be the agreed budget (Fixed Price) or T&M. 
        // For this invoice, we'll show the breakdown but bill the 'Budget' amount if it's fixed, 
        // or we could bill Actuals. 
        // Let's assume we are invoicing for the Total Budget/Price agreed upon, 
        // but showing the breakdown is helpful context or we just show the line items that make up the budget.
        // Given the prompt implies "Budget" is the price, let's invoice the Budget amount.
        // Actually, usually you invoice for the work done. 
        // Let's stick to a simple standard invoice: Job Title & Agreed Price (Budget)
        // OR Invoice for Time & Materials. 
        // Let's list the agreed price as the line item for simplicity in a "One-Click" scenario for a Fixed Bid job.
        
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.text('INVOICE', 105, 20, null, null, 'center');
        
        doc.setFontSize(12);
        doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 150, 40);
        doc.text(`Job Ref: ${job.title}`, 150, 48);

        // Bill To
        doc.text('Bill To:', 20, 40);
        doc.setFontSize(14);
        doc.text(client.name, 20, 48);
        doc.setFontSize(12);
        if (client.address) doc.text(client.address, 20, 56);
        if (client.email) doc.text(client.email, 20, 64);
        if (client.phone) doc.text(client.phone, 20, 72);

        // Line Items Header
        let y = 90;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 170, 10, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Description', 25, y + 7);
        doc.text('Amount', 160, y + 7);
        doc.setFont(undefined, 'normal');

        y += 20;

        // Line Item 1: The Job (Fixed Price approach usually preferred by clients)
        // But if we want to show transparency based on the app's features:
        
        // Option A: Single Line Item for "Job: Title"
        doc.text(`${job.title} - Project Completion`, 25, y);
        doc.text(`$${job.budget.toFixed(2)}`, 160, y);
        
        // Option B: Detailed T&M (Commented out but logic is here if needed)
        /*
        job.material_list.forEach(item => {
            doc.text(item.description, 25, y);
            doc.text(`$${item.total.toFixed(2)}`, 160, y);
            y += 10;
        });
        doc.text(`Labor (${totalHours.toFixed(1)} hrs @ $${laborRate}/hr)`, 25, y);
        doc.text(`$${laborCost.toFixed(2)}`, 160, y);
        */

        // Totals
        y += 20;
        doc.setLineWidth(0.5);
        doc.line(100, y, 190, y);
        y += 10;
        
        doc.setFont(undefined, 'bold');
        doc.text('Total Due:', 110, y);
        doc.setFontSize(16);
        doc.text(`$${job.budget.toFixed(2)}`, 160, y);

        // Footer
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Thank you for your business!', 105, 250, null, null, 'center');
        doc.text('Payment is due upon receipt.', 105, 255, null, null, 'center');

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=Invoice_${job.id.slice(-4)}.pdf`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});