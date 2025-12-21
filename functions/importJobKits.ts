import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { csvData } = await req.json();
        if (!csvData) {
            return Response.json({ error: 'No CSV data provided' }, { status: 400 });
        }

        // Fetch Inventory for name -> id mapping
        const inventory = await base44.entities.Inventory.list('item_name', 1000);
        // Map normalized name to ID
        const invMap = new Map(inventory.map(i => [i.item_name.toLowerCase().trim(), i.id]));

        const lines = csvData.trim().split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Expected headers roughly: kitname, description, itemname, quantity
        const nameIdx = headers.findIndex(h => h.includes('kitname') || h.includes('kit name'));
        const descIdx = headers.findIndex(h => h.includes('description'));
        const itemIdx = headers.findIndex(h => h.includes('itemname') || h.includes('item name'));
        const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));

        if (nameIdx === -1) {
            return Response.json({ error: 'CSV must contain a "KitName" column' }, { status: 400 });
        }

        const kitsMap = new Map(); // Name -> { description, items: [] }

        // Phase 4: Batch ID for tracking
        const batchId = crypto.randomUUID();
        let skippedItems = 0;

        // Parse Lines
        for (let i = 1; i < lines.length; i++) {
            // Simple CSV parsing (handling quoted strings roughly or splitting by comma)
            // For robustness, we assume standard CSV. splitting by comma is fragile if descriptions have commas.
            // Using a simple regex split for this demo scale, or just simple split if quotes aren't heavy.
            // Let's assume standard split for now as per simple requirements, or basic quote handling.
            // A simple quote-aware split:
            const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim());
            
            // Fallback if match fails (empty lines etc)
            if (!row || row.length < 2) continue;

            // Since regex might miss empty fields between commas, let's stick to standard split and warn user about commas in text.
            // Or better, use a simpler approach: split by comma, clean quotes.
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

            const kitName = cols[nameIdx];
            if (!kitName) continue;

            const description = descIdx !== -1 ? cols[descIdx] : '';
            const itemName = itemIdx !== -1 ? cols[itemIdx] : '';
            const rawQty = qtyIdx !== -1 ? cols[qtyIdx] : '0';
            const quantity = Number(rawQty) || 0;

            if (!kitsMap.has(kitName)) {
                kitsMap.set(kitName, { name: kitName, description, items: [] });
            }

            if (itemName && quantity > 0) {
                const normalizedItemName = itemName.toLowerCase();
                const invId = invMap.get(normalizedItemName);
                if (invId) {
                    kitsMap.get(kitName).items.push({ inventory_id: invId, quantity });
                } else {
                    skippedItems++;
                }
            }
        }

        // Create Kits
        const createdKits = [];
        for (const kitData of kitsMap.values()) {
            const newKit = await base44.entities.JobKit.create(kitData);
            createdKits.push(newKit);
        }

        // Log Import
        await base44.entities.SystemLog.create({
            severity: 'info',
            source: 'Kit Import',
            message: `Imported ${createdKits.length} kits via CSV.`,
            details: JSON.stringify({ batch_id: batchId, kits_created: createdKits.length, items_skipped_unknown: skippedItems }),
            user_email: user.email,
            batch_id: batchId
        });

        return Response.json({ 
            success: true, 
            kits_created: createdKits.length, 
            batch_id: batchId 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});