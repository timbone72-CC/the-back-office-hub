import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { job_id, reconciliation_data } = await req.json();

        if (!job_id) {
            return Response.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // 1. Fetch Job
        const jobs = await base44.entities.Job.filter({ id: job_id });
        if (!jobs || jobs.length === 0) {
            return Response.json({ error: 'Job not found' }, { status: 404 });
        }
        const job = jobs[0];

        if (job.status === 'completed') {
            return Response.json({ error: 'Job is already completed' }, { status: 400 });
        }

        const batchId = crypto.randomUUID();
        const stockTransactions = [];
        const inventoryUpdates = [];
        let itemsRestored = 0;

        // 2. Process Reconciliation
        if (reconciliation_data && Array.isArray(reconciliation_data)) {
            for (const item of reconciliation_data) {
                const originalQty = Number(item.original_quantity) || 0;
                const usedQty = Number(item.used_quantity) || 0;
                const inventoryId = item.inventory_id;
                
                // Calculate Unused Amount (Return to Stock)
                const returnQty = originalQty - usedQty;

                if (returnQty > 0 && inventoryId) {
                    // Fetch current inventory to get current quantity (for safety, though we are doing increment)
                    // base44 sdk doesn't support atomic increment directly via a special method usually, 
                    // but we can read-modify-write. For "Phase 4 atomic update", strict atomicity might require a transaction 
                    // or a specific backend feature. Assuming standard read-modify-write here is the best we can do with standard entity API,
                    // unless there is a specific 'increment' method. I'll stick to read-modify-write.
                    
                    const invItems = await base44.entities.Inventory.filter({ id: inventoryId });
                    if (invItems && invItems.length > 0) {
                        const invItem = invItems[0];
                        const newQuantity = (Number(invItem.quantity) || 0) + returnQty;

                        // Update Inventory
                        await base44.entities.Inventory.update(inventoryId, { quantity: newQuantity });
                        
                        // Create Transaction Log
                        stockTransactions.push({
                            inventory_id: inventoryId,
                            quantity_change: returnQty,
                            transaction_type: 'job_return',
                            reference_id: job_id,
                            batch_id: batchId,
                            reference_note: `Unused material from Job ${job.title}`,
                            date: new Date().toISOString()
                        });

                        itemsRestored++;
                    }
                }
            }
        }

        // 3. Batch Insert Stock Transactions
        if (stockTransactions.length > 0) {
            await base44.entities.StockTransaction.bulkCreate(stockTransactions);
        }

        // 4. Update Job Status
        await base44.entities.Job.update(job_id, { 
            status: 'completed',
            // potentially update material_list with "used" info? 
            // The requirement doesn't explicitly say to update the job's material list to reflect actual usage, 
            // but usually that's desired. I'll leave it as is to minimize changes unless implied.
            // "Reconciliation Form ... show a form ... Inventory Restoration ... Audit Logging"
            // It doesn't say "Update Job Material List". I'll stick to just status update.
        });

        // 5. System Log
        await base44.entities.SystemLog.create({
            severity: 'info',
            source: 'Job Reconciliation',
            message: `Job ${job.title} completed. ${itemsRestored} items returned to stock.`,
            details: JSON.stringify({ job_id, restored_count: itemsRestored, batch_id: batchId }),
            user_email: user.email,
            batch_id: batchId
        });

        return Response.json({ 
            success: true, 
            message: `Job completed. ${itemsRestored} items returned to inventory.`,
            items_restored: itemsRestored
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});