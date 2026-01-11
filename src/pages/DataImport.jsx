import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DataImport() {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // IMPORTER 1: MATERIALS (Your existing one)
  // ----------------------------------------------------
  const importMaterials = async () => {
    setLoading(true);
    try {
      const rows = csvData.trim().split('\n').slice(1); // Skip header
      let count = 0;

      for (const row of rows) {
        const [itemName, supplier, min, max, unit, qty] = row.split(',').map(s => s?.trim());
        if (!itemName) continue;

        await base44.entities.MaterialLibrary.create({
          item_name: itemName,
          supplier_name: supplier,
          price_min: parseFloat(min) || 0,
          price_max: parseFloat(max) || 0,
          unit_measure: unit,
          quantity_in_stock: parseFloat(qty) || 0
        });
        count++;
      }
      toast.success(`Imported ${count} materials!`);
      setCsvData('');
    } catch (e) {
      toast.error('Import failed. Check CSV format.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // IMPORTER 2: JOB KITS (The New Feature)
  // ----------------------------------------------------
  const importJobKits = async () => {
    setLoading(true);
    try {
      const rows = csvData.trim().split('\n').slice(1);
      
      // Group items by Kit Name
      const kits = {};
      rows.forEach(row => {
        const [kitName, itemName, category, qty, cost] = row.split(',').map(s => s?.trim());
        if (!kitName || !itemName) return;

        if (!kits[kitName]) kits[kitName] = [];
        kits[kitName].push({ itemName, category, qty, cost });
      });

      let createdCount = 0;

      // Create Kits and Items
      for (const [kitName, items] of Object.entries(kits)) {
        // 1. Create the Parent Kit
        const newKit = await base44.entities.JobKit.create({
          name: kitName,
          description: `Imported Kit with ${items.length} items`
        });

        // 2. Create the Child Items
        for (const item of items) {
          await base44.entities.JobKitItem.create({
            job_kit_id: newKit.id,
            item_name: item.itemName,
            category: item.category || 'General',
            default_qty: parseFloat(item.qty) || 1,
            default_cost: parseFloat(item.cost) || 0,
            default_unit: 'ea'
          });
        }
        createdCount++;
      }

      toast.success(`Created ${createdCount} new Job Kits!`);
      setCsvData('');

    } catch (e) {
      toast.error('Kit Import failed. Check console.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Bulk Data Import</h1>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Material Library</TabsTrigger>
          <TabsTrigger value="kits">Job Kits (Recipes)</TabsTrigger>
        </TabsList>

        {/* TAB 1: MATERIALS */}
        <TabsContent value="materials">
          <Card>
            <CardHeader><CardTitle>Import Materials CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Headers: ItemName, Supplier, MinPrice, MaxPrice, Unit, Qty</p>
              <Textarea 
                value={csvData} 
                onChange={e => setCsvData(e.target.value)} 
                placeholder="2x4 Stud, Home Depot, 3.50, 4.00, ea, 100..."
                className="h-64 font-mono"
              />
              <Button onClick={importMaterials} disabled={loading} className="w-full">
                {loading ? 'Importing...' : 'Import Materials'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: JOB KITS */}
        <TabsContent value="kits">
          <Card className="border-indigo-100">
            <CardHeader><CardTitle className="text-indigo-900">Import Job Kits CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-800">
                <strong>Format:</strong> KitName, ItemName, Category, Qty, Cost<br/>
                <em>Note: Identical KitNames will be grouped together into one Kit.</em>
              </div>
              <Textarea 
                value={csvData} 
                onChange={e => setCsvData(e.target.value)} 
                placeholder={`Deck 12x12, Concrete Mix, Concrete, 45, 6.50\nDeck 12x12, 2x8 Joist, Framing, 12, 14.00\nBasic Bathroom, Drywall, Drywall, 12, 15.00`}
                className="h-64 font-mono border-indigo-200"
              />
              <Button onClick={importJobKits} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? 'Building Kits...' : 'Build Job Kits'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}