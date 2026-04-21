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

        // PHASE 2: Side-Effect Isolation & Pre-Flight Validation
        // Collect all Inventory IDs to validate existence BEFORE starting any writes.
        // This prevents "Job Created" state with failed inventory updates due to missing items.
        const inventoryMap = new Map();
        const inventoryIds = [...new Set(estimate.items.filter(i => i.inventory_id).map(i => i.inventory_id))];

        if (inventoryIds.length > 0) {
            try {
                // Parallel fetch for snapshot consistency
                const fetchPromises = inventoryIds.map(id => base44.entities.Inventory.filter({ id }));
                const results = await Promise.all(fetchPromises);
                
                const missingIds = [];
                results.forEach((res, index) => {
                    if (res && res.length > 0) {
                        inventoryMap.set(inventoryIds[index], res[0]);
                    } else {
                        missingIds.push(inventoryIds[index]);
                    }
                });

                if (missingIds.length > 0) {
                    return Response.json({ 
                        error: 'Conversion Aborted: One or more inventory items linked to this estimate no longer exist.', 
                        details: missingIds 
                    }, { status: 400 });
                }
            } catch (e) {
                console.error("Pre-flight validation failed:", e);
                return Response.json({ error: 'Failed to validate inventory items. Please try again.' }, { status: 500 });
            }
        }

        // 2. Create the Job (Now safe to proceed)
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

        // 4. Process Inventory Deductions (Execution Phase)
        // Uses the pre-fetched map to ensure we operate on the validated snapshot.
        const deductionReport = [];

        for (const item of estimate.items) {
            if (item.inventory_id && item.quantity > 0) {
                const invItem = inventoryMap.get(item.inventory_id);
                // Note: invItem exists due to pre-flight check

                try {
                    const qtyToDeduct = Number(item.quantity);
                    // Calculate from current snapshot
                    const newQuantity = Math.max(0, invItem.quantity - qtyToDeduct);
                    
                    // Update inventory (Write)
                    await base44.entities.Inventory.update(invItem.id, { quantity: newQuantity });
                    
                    // Update local snapshot for correct calculation if item appears multiple times
                    invItem.quantity = newQuantity;
                    inventoryMap.set(invItem.id, invItem);
                    
                    // Log Transaction
                    await base44.entities.StockTransaction.create({
                        inventory_id: invItem.id,
                        quantity_change: -qtyToDeduct,
                        transaction_type: 'job_deduction',
                        reference_id: job.id,
                        batch_id: batchId,
                        reference_note: `Used in Job: ${job.title}`,
                        date: new Date().toISOString()
                    });

                    deductionReport.push({
                        item: invItem.item_name,
                        deducted: qtyToDeduct,
                        remaining: newQuantity,
                        isLowStock: newQuantity <= invItem.reorder_point
                    });

                    if (newQuantity <= invItem.reorder_point) {
                            console.log(`LOW STOCK ALERT: ${invItem.item_name} is at ${newQuantity}`);
                    }

                } catch (e) {
                    console.error(`Failed to deduct inventory for item ${item.description}:`, e);
                    // We continue best-effort here. Batch ID allows post-mortem cleanup.
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

        // Log to System Audit Log
        try {
            await base44.entities.SystemLog.create({
                severity: 'error',
                source: 'convertEstimateToJob',
                message: 'Failed to convert estimate to job',
                details: JSON.stringify({ error: error.message, stack: error.stack, estimate_id }),
                user_email: user?.email || 'unknown',
                batch_id: batchId
            });
        } catch (logError) {
            console.error("Failed to write system log:", logError);
        }

        return Response.json({ error: error.message }, { status: 500 });
    }
    });