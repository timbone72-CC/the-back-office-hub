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

            // 4. Handle Inventory Upsert
            if (itemName) {
                const quantity = parseFloat(rowData['quantity']) || 0;
                const existingInventory = await base44.entities.Inventory.filter({ item_name: itemName });

                if (existingInventory.length > 0) {
                    // Upsert: Add to existing quantity
                    const item = existingInventory[0];
                    const currentQty = parseFloat(item.quantity) || 0;
                    const newQty = currentQty + quantity;
                    
                    await base44.entities.Inventory.update(item.id, { 
                        quantity: newQty,
                        // Optionally update other fields if provided in CSV
                        supplier_id: supplierId || item.supplier_id,
                        material_library_id: materialId || item.material_library_id
                    });
                    results.inventoryUpdated++;
                } else {
                    // Create new inventory record
                    await base44.entities.Inventory.create({
                        item_name: itemName,
                        quantity: quantity,
                        unit: unit || 'each',
                        supplier_id: supplierId || '',
                        reorder_point: 5, // Default
                        material_library_id: materialId
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