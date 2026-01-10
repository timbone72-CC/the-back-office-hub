import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, Hammer, Box } from 'lucide-react';

export default function HandymanCalculators() {
  // Global State
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [activeClientName, setActiveClientName] = useState('');

  // 1. INITIALIZATION: Load Draft Estimates
  useEffect(() => {
    const loadDraftEstimates = async () => {
      try {
        // Fetch only 'draft' or 'sent' estimates
        const results = await app.datasources.JobEstimate.search({ 
          status: ['draft', 'sent'] 
        });
        setEstimates(results);
      } catch (error) {
        console.error("Error loading estimates:", error);
      }
    };
    loadDraftEstimates();
  }, []);

  // Update helper to show client name/details when selection changes
  const handleEstimateChange = (e) => {
    const id = e.target.value;
    setSelectedEstimateId(id);
    const selected = estimates.find(est => est._id === id);
    if (selected) setActiveClientName(`Total: $${parseFloat(selected.total_amount).toFixed(2)}`);
    else setActiveClientName('');
  };

  // 2. THE SAVER: Add Calculator Result to Estimate
  const addItemToEstimate = async (description, quantity, unitCost) => {
    // Validation
    if (!selectedEstimateId) {
      alert("⚠️ Please select an Active Estimate from the top dropdown first.");
      return;
    }
    if (quantity <= 0) {
      alert("⚠️ Quantity must be greater than 0.");
      return;
    }

    try {
      // A. FETCH the current Estimate record
      const estimate = await app.datasources.JobEstimate.read(selectedEstimateId);

      // B. PREPARE the new item object (Matching your schema exactly)
      const lineTotal = (parseFloat(quantity) * parseFloat(unitCost));
      
      const newItem = {
        description: description,
        quantity: parseFloat(quantity),
        unit_cost: parseFloat(unitCost),
        total: lineTotal,
        supplier_id: "", 
        supplier_name: "", 
        inventory_id: "" 
      };

      // C. UPDATE the Items Array
      if (!estimate.items) estimate.items = [];
      estimate.items.push(newItem);

      // D. RECALCULATE Financials
      let newSubtotal = 0;
      estimate.items.forEach(item => {
        newSubtotal += item.total;
      });

      estimate.subtotal = newSubtotal;
      
      // Handle Tax (Default to 0 if null)
      const taxRate = estimate.tax_rate || 0;
      estimate.total_amount = newSubtotal * (1 + (taxRate / 100));

      // E. SAVE back to database
      await app.datasources.JobEstimate.update(estimate);

      // F. UPDATE UI
      alert(`✅ Saved "${description}" to estimate "${estimate.title}"!\nNew Total: $${estimate.total_amount.toFixed(2)}`);
      
      // Refresh local list to show new total
      const updatedEstimates = estimates.map(e => e._id === estimate._id ? estimate : e);
      setEstimates(updatedEstimates);
      setActiveClientName(`Total: $${estimate.total_amount.toFixed(2)}`);

    } catch (error) {
      console.error("Save failed:", error);
      alert("❌ Error saving to estimate. See console for details.");
    }
  };
  return (
    <div className="w-full space-y-4">
      {/* CONTEXT BAR: Select the Estimate to work on */}
      <div className="bg-blue-50 p-4 border-b-2 border-blue-500 rounded-t-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label className="font-bold whitespace-nowrap">Select Active Estimate:</Label>
          <select 
            className="p-2 border rounded-md min-w-[250px] bg-white"
            value={selectedEstimateId}
            onChange={handleEstimateChange}
          >
            <option value="">-- Select an Estimate --</option>
            {estimates.map(est => (
              <option key={est._id} value={est._id}>
                {est.title} (Total: ${est.total_amount ? est.total_amount.toFixed(2) : '0.00'})
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 font-semibold">
          {activeClientName}
        </div>
      </div>

      <Tabs defaultValue="concrete" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger value="concrete" className="flex gap-1"><Box className="w-4 h-4" /> Concrete</TabsTrigger>
          <TabsTrigger value="framing" className="flex gap-1"><Hammer className="w-4 h-4" /> Framing</TabsTrigger>
          {/* Add other tabs here */}
        </TabsList>
        
        {/* PASS THE SAVE FUNCTION DOWN TO TABS */}
        <TabsContent value="concrete">
          <ConcreteCalculator onSave={addItemToEstimate} />
        </TabsContent>
        <TabsContent value="framing">
          <FramingCalculator onSave={addItemToEstimate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConcreteCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4' });
  const [results, setResults] = useState(null);
  const [pricePerBag, setPricePerBag] = useState(''); // New State for Cost

  const calculate = () => {
    const length = parseFloat(inputs.length);
    const width = parseFloat(inputs.width);
    const depthInches = parseFloat(inputs.depth);
    
    if (!length || !width || !depthInches) return;
    
    const cubicFeet = length * width * (depthInches / 12);
    const bags80lb = Math.ceil(cubicFeet / 0.6);
    
    setResults({ 
      bags80lb,
      description: `Concrete Slab: ${length}' x ${width}' x ${depthInches}"`, // Auto-generated description
      message: `${bags80lb} Bags (80lb) needed`
    });
  };

  const handleSave = () => {
    if (!results) return;
    if (!pricePerBag) {
      alert("Please enter a price per bag");
      return;
    }
    // Call the parent function
    onSave(results.description, results.bags80lb, pricePerBag);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Length (ft)</Label><Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} /></div>
          <div><Label>Width (ft)</Label><Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} /></div>
          <div><Label>Depth (in)</Label><Input type="number" value={inputs.depth} onChange={(e) => setInputs({...inputs, depth: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <h4 className="font-semibold text-green-800">Results: {results.message}</h4>
            <Separator className="bg-green-200"/>
            
            {/* SAVE INTERFACE */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-green-800">Price per Bag ($)</Label>
                <Input 
                  type="number" 
                  placeholder="6.50" 
                  value={pricePerBag}
                  onChange={(e) => setPricePerBag(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                💾 Add to Estimate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FramingCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ wallLength: '', studSpacing: '16' });
  const [results, setResults] = useState(null);
  const [unitPrice, setUnitPrice] = useState('');

  const calculateStuds = () => {
    const len = parseFloat(inputs.wallLength);
    const spacing = parseFloat(inputs.studSpacing);
    if (!len || !spacing) return;
    
    const studs = Math.ceil((len * 12) / spacing) + 1;
    
    setResults({ 
      quantity: studs,
      description: `Wall Studs: ${len}ft wall @ ${spacing}" OC`,
      message: `Studs needed: ${studs}`
    });
  };

  const handleSave = () => {
    if (!results || !unitPrice) {
      alert("Please calculate and enter a price per stud");
      return;
    }
    onSave(results.description, results.quantity, unitPrice);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stud Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Wall Length (ft)</Label><Input type="number" value={inputs.wallLength} onChange={(e) => setInputs({...inputs, wallLength: e.target.value})} /></div>
          <div><Label>Spacing (in)</Label><Input type="number" value={inputs.studSpacing} onChange={(e) => setInputs({...inputs, studSpacing: e.target.value})} /></div>
        </div>
        <Button onClick={calculateStuds} className="w-full">Calculate</Button>

        {results && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <h4 className="font-semibold text-blue-800">{results.message}</h4>
            <Separator className="bg-blue-200"/>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-blue-800">Price per Stud ($)</Label>
                <Input type="number" placeholder="4.25" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="bg-white"/>
              </div>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">💾 Add to Estimate</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}