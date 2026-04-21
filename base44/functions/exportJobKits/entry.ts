import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Kits and Inventory for name resolution
        const [kits, inventory] = await Promise.all([
            base44.entities.JobKit.list('name', 1000),
            base44.entities.Inventory.list('item_name', 1000)
        ]);

        const invMap = new Map(inventory.map(i => [i.id, i.item_name]));

        // CSV Header
        let csv = 'KitName,Description,ItemName,Quantity\n';

        // Flatten data
        for (const kit of kits) {
            if (!kit.items || kit.items.length === 0) {
                // Export empty kit
                csv += `"${kit.name.replace(/"/g, '""')}","${(kit.description || '').replace(/"/g, '""')}","",0\n`;
            } else {
                for (const item of kit.items) {
                    const itemName = invMap.get(item.inventory_id) || 'Unknown Item';
                    csv += `"${kit.name.replace(/"/g, '""')}","${(kit.description || '').replace(/"/g, '""')}","${itemName.replace(/"/g, '""')}",${item.quantity}\n`;
                }
            }
        }

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=job_kits_export.csv'
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});