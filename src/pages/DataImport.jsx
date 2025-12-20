import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function DataImport() {
  const [csvContent, setCsvContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Please paste CSV data first");
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('importMaterialCSV', { csvData: csvContent });
      
      if (response.data.success) {
        setResult({ type: 'success', data: response.data.results });
        toast.success("Import completed successfully!");
      } else {
        throw new Error(response.data.error || 'Import failed');
      }
    } catch (error) {
      console.error(error);
      setResult({ type: 'error', message: error.message });
      toast.error("Import failed: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const sampleCSV = `ItemName,SupplierName,MinPrice,MaxPrice,Unit
2x4x8 Stud,Local Lumber Co,3.50,4.25,each
Drywall 4x8,Big Box Store,12.00,14.50,sheet
Paint 1G,Paint Pros,45.00,55.00,gallon`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-600" />
          Data Import
        </h1>
        <p className="text-slate-500">
          Bulk import suppliers, materials, and pricing using CSV format.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Input</CardTitle>
              <CardDescription>
                Paste your CSV data below. First row must be headers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste CSV data here..." 
                className="font-mono text-sm min-h-[300px]"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCsvContent('')}
                  disabled={isImporting}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                >
                  Clear / Reset
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isImporting ? (
                    <>Importing...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Import Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Format Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Ensure your CSV has the following headers (case-insensitive):
              </p>
              <div className="bg-slate-900 text-slate-50 p-3 rounded-md font-mono text-xs overflow-x-auto">
                ItemName, SupplierName, MinPrice, MaxPrice, Unit
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Sample Data:</p>
                <pre className="bg-white border border-slate-200 p-3 rounded-md text-xs text-slate-600 overflow-x-auto">
                  {sampleCSV}
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCsvContent(sampleCSV)}
                  className="w-full mt-2"
                >
                  Load Sample Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <div className={`animate-in fade-in slide-in-from-bottom-2`}>
              {result.type === 'success' ? (
                <Alert className="bg-green-50 border-green-200 text-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Suppliers Created:</span>
                      <span className="font-bold">{result.data.suppliersCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materials Created:</span>
                      <span className="font-bold">{result.data.materialsCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prices Updated:</span>
                      <span className="font-bold">{result.data.pricesCreated}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}