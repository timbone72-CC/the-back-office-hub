import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { csvData } = await req.json();

        if (!csvData) {
            return Response.json({ error: 'No CSV data provided' }, { status: 400 });
        }

        const rows = csvData.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        const headers = rows[0].map(h => h.toLowerCase());
        const dataRows = rows.slice(1).filter(r => r.length === headers.length);

        const results = {
            suppliersCreated: 0,
            materialsCreated: 0,
            pricesCreated: 0,
            inventoryCreated: 0,
            inventoryUpdated: 0
        };

        const batchId = crypto.randomUUID();

        // PHASE 4: Rollback Strategy Documentation
        // This process uses a unique 'batch_id' for all StockTransactions created in this session.
        // ROLLBACK FEASIBILITY:
        // To rollback an accidental import:
        // 1. Query StockTransaction where batch_id == [batchId]
        // 2. Iterate transactions: 
        //    - If type 'restock': Deduct the quantity_change from Inventory
        //    - If type 'manual_adjustment': Reverse the change
        // 3. Delete the StockTransaction records
        // 4. (Optional) Delete Inventory items created in this batch if their resulting quantity is 0
        
        // Note: We use list(null, 1000) to fetch inventory for matching to avoid duplicate creation on larger datasets
        const allInventory = await base44.entities.Inventory.list(null, 1000);

        for (const row of dataRows) {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });

            // 1. Handle Supplier
            let supplierId;
            const supplierName = rowData['suppliername'];
            if (supplierName) {
                const existingSuppliers = await base44.entities.Supplier.filter({ store_name: supplierName });
                if (existingSuppliers.length > 0) {
                    supplierId = existingSuppliers[0].id;
                } else {
                    const newSupplier = await base44.entities.Supplier.create({ store_name: supplierName });
                    supplierId = newSupplier.id;
                    results.suppliersCreated++;
                }
            }

            // 2. Handle Material
            let materialId;
            const itemName = rowData['itemname'];
            const unit = rowData['unit'];
            const category = rowData['category'] || 'General'; // Default category if missing

            if (itemName) {
                const existingMaterials = await base44.entities.MaterialLibrary.filter({ item_name: itemName });
                if (existingMaterials.length > 0) {
                    materialId = existingMaterials[0].id;
                    // Optional: Update unit if missing?
                } else {
                    const newMaterial = await base44.entities.MaterialLibrary.create({ 
                        item_name: itemName,
                        unit: unit || 'each',
                        category: category
                    });
                    materialId = newMaterial.id;
                    results.materialsCreated++;
                }
            }

            // 3. Handle Pricing
            if (supplierId && materialId) {
                const minPrice = parseFloat(rowData['minprice']) || 0;
                const maxPrice = parseFloat(rowData['maxprice']) || 0;

                const existingPricing = await base44.entities.MaterialPricing.filter({
                    material_id: materialId,
                    supplier_id: supplierId
                });

                if (existingPricing.length === 0) {
                    await base44.entities.MaterialPricing.create({
                        material_id: materialId,
                        supplier_id: supplierId,
                        min_price: minPrice,
                        max_price: maxPrice
                    });
                    results.pricesCreated++;
                } else {
                    // Update existing pricing
                    await base44.entities.MaterialPricing.update(existingPricing[0].id, {
                        min_price: minPrice,
                        max_price: maxPrice
                    });
                }
            }

            // 4. Handle Inventory Upsert with Fuzzy Match & Audit Trail
            if (itemName) {
                // Strict Number Parsing
                const rawQty = rowData['quantity'] || rowData['qty'];
                const deltaQty = Number(rawQty);
                
                if (isNaN(deltaQty)) {
                    throw new Error(`Invalid quantity for item '${itemName}': ${rawQty}`);
                }

                // Fuzzy Match Normalization
                const normalizedName = itemName.toLowerCase().trim();
                
                // Fetch all inventory to do fuzzy match in memory (most reliable without unique index support)
                // In production with huge datasets, we'd rely on the normalized_name field filter
                const allInventory = await base44.entities.Inventory.list();
                const existingItem = allInventory.find(i => 
                    (i.normalized_name === normalizedName) || 
                    (i.item_name.toLowerCase().trim() === normalizedName)
                );

                if (existingItem) {
                    // UPDATE existing
                    const currentQty = Number(existingItem.quantity) || 0;
                    const newQty = currentQty + deltaQty;
                    
                    if (isNaN(newQty)) throw new Error(`Math error calculating new quantity for '${itemName}'`);

                    await base44.entities.Inventory.update(existingItem.id, { 
                        quantity: newQty,
                        normalized_name: normalizedName, // Ensure this is set
                        supplier_id: supplierId || existingItem.supplier_id,
                        material_library_id: materialId || existingItem.material_library_id
                    });

                    // Audit Trail
                    await base44.entities.StockTransaction.create({
                        inventory_id: existingItem.id,
                        quantity_change: deltaQty,
                        transaction_type: 'restock',
                        reference_id: 'csv_import',
                        batch_id: batchId,
                        date: new Date().toISOString(),
                        reference_note: 'Source: csv_import - Bulk Import Upsert'
                    });

                    results.inventoryUpdated++;
                } else {
                    // CREATE new
                    const newRecord = await base44.entities.Inventory.create({
                        item_name: itemName.trim(), // Keep original casing for display
                        normalized_name: normalizedName,
                        quantity: deltaQty,
                        unit: unit || 'each',
                        supplier_id: supplierId || '',
                        reorder_point: 5,
                        material_library_id: materialId
                    });

                    // Audit Trail
                    await base44.entities.StockTransaction.create({
                        inventory_id: newRecord.id,
                        quantity_change: deltaQty,
                        transaction_type: 'restock',
                        reference_id: 'csv_import',
                        batch_id: batchId,
                        date: new Date().toISOString(),
                        reference_note: 'Source: csv_import - Bulk Import Creation'
                    });

                    results.inventoryCreated++;
                }
            }
        }

        return Response.json({ success: true, results });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});