// ========== FILE: pages/DataImport.jsx ==========

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DataImport() {
  // SECTION 1: STATE INITIALIZATION
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);

  // SECTION 2: MATERIAL IMPORT LOGIC
  // -------------------------------------------------------------------------
  // IMPORTER 1: MATERIALS (Your existing one)
  // -------------------------------------------------------------------------
  const importMaterials = async () => {
    setLoading(true);
    try {
      const rows = csvData.trim().split('\n').slice(1); // Skip header
      let count = 0;

      for (const row of rows) {
        const [itemName, supplier, min, max, unit, qty] = row.split(',');
        if (!itemName) continue;

        await base44.entities.MaterialLibrary.create({
          item_name: itemName,
          supplier_name: supplier,
          price_min: parseFloat(min) || 0,
          price_max: parseFloat(max) || 0,
          unit: unit,
          quantity_in_stock: parseFloat(qty) || 0
        });
        count++;
      }
      toast.success(`Successfully imported ${count} materials`);
      setCsvData('');
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // SECTION 3: RENDER MAIN VIEW
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data Importer</h1>
        <p className="text-slate-500 mt-1">Bulk upload records via CSV text</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>CSV Data Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SECTION 4: DATA INPUT AREA */}
          <div className="space-y-2">
            <Textarea
              placeholder="Paste CSV rows here..."
              className="min-h-[300px] font-mono text-sm"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Format: item_name, supplier, price_min, price_max, unit, qty
            </p>
          </div>

          {/* SECTION 5: ACTION TABS */}
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="materials">Import to Materials Library</TabsTrigger>
            </TabsList>
            <TabsContent value="materials" className="pt-4">
              <Button 
                onClick={importMaterials} 
                disabled={loading || !csvData.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? "Processing..." : "Run Material Import"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}