import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { estimate_id } = await req.json();

        if (!estimate_id) {
            return Response.json({ error: 'Estimate ID is required' }, { status: 400 });
        }

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch the Estimate
        const estimates = await base44.entities.JobEstimate.filter({ id: estimate_id });
        if (!estimates || estimates.length === 0) {
            return Response.json({ error: 'Estimate not found' }, { status: 404 });
        }
        const estimate = estimates[0];
        const batchId = crypto.randomUUID();

        if (estimate.status === 'converted') {
            return Response.json({ error: 'Estimate already converted' }, { status: 400 });
        }

        // 2. Create the Job
        const jobData = {
            title: estimate.title,
            client_profile_id: estimate.client_profile_id,
            linked_estimate_id: estimate.id,
            budget: estimate.total_amount,
            status: 'in_progress',
            scoping_notes: 'Converted from estimate',
            payment_status: 'unpaid',
            // Copy materials list for reference
            material_list: estimate.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                total: item.total,
                supplier_id: item.supplier_id,
                supplier_name: item.supplier_name
            }))
        };

        const job = await base44.entities.Job.create(jobData);

        // 3. Update Estimate Status
        await base44.entities.JobEstimate.update(estimate.id, { status: 'converted' });

        // 4. Process Inventory Deductions
        const deductionReport = [];
        
        // We need to fetch inventory items to check current stock and reorder points
        // Doing this sequentially for simplicity and correctness, though parallel would be faster
        for (const item of estimate.items) {
            if (item.inventory_id && item.quantity > 0) {
                try {
                    // Fetch current inventory state
                    const invItems = await base44.entities.Inventory.filter({ id: item.inventory_id });
                    if (invItems && invItems.length > 0) {
                        const invItem = invItems[0];
                        const newQuantity = Math.max(0, invItem.quantity - item.quantity);
                        
                        // Update inventory
                        await base44.entities.Inventory.update(invItem.id, { quantity: newQuantity });
                        
                        // Log Transaction
                        await base44.entities.StockTransaction.create({
                            inventory_id: invItem.id,
                            quantity_change: -Number(item.quantity),
                            transaction_type: 'job_deduction',
                            reference_id: job.id,
                            batch_id: batchId,
                            reference_note: `Used in Job: ${job.title}`,
                            date: new Date().toISOString()
                        });

                        deductionReport.push({
                            item: invItem.item_name,
                            deducted: item.quantity,
                            remaining: newQuantity,
                            isLowStock: newQuantity <= invItem.reorder_point
                        });

                        // Logic for low stock trigger (Stage 2 requirements)
                        // In a real app, this might trigger a separate notification service
                        if (newQuantity <= invItem.reorder_point) {
                             console.log(`LOW STOCK ALERT: ${invItem.item_name} is at ${newQuantity} (Reorder Point: ${invItem.reorder_point})`);
                             // Potential Stage 3: Send alert/email here
                        }
                    }
                } catch (e) {
                    console.error(`Failed to deduct inventory for item ${item.description}:`, e);
                    deductionReport.push({
                        item: item.description,
                        error: "Failed to update inventory"
                    });
                }
            }
        }

        return Response.json({ 
            job_id: job.id, 
            message: 'Job created and inventory updated successfully',
            deductions: deductionReport
        });

    } catch (error) {
        console.error("Conversion error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});