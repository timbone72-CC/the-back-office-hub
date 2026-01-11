import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

// --- 1. THE MONEY BOX COMPONENT ---
function SaveToEstimatePanel({ description, quantity, unitLabel, onSave }) {
  const [unitCost, setUnitCost] = useState('');

  const handleSave = () => {
    if (!unitCost) {
      alert("Please enter a unit cost");
      return;
    }
    onSave(description, quantity, unitCost);
    setUnitCost('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-green-300">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs text-green-800">{unitLabel || 'Unit Cost ($)'}</Label>
          <Input 
            type="number" 
            placeholder="0.00" 
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="bg-white"
          />
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-1">
          <Save className="w-4 h-4" /> Add to Estimate
        </Button>
      </div>
      <p className="text-xs text-green-600 mt-1">Qty: {quantity} | {description}</p>
    </div>
  );
}

// --- 2. CONCRETE CALCULATOR ---
function ConcreteCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const length = parseFloat(inputs.length);
    const width = parseFloat(inputs.width);
    const depthInches = parseFloat(inputs.depth);
    
    if (!length || !width || !depthInches) {
      setResults({ message: 'Please enter all dimensions' });
      return;
    }
    
    const depthFeet = depthInches / 12;
    const cubicFeet = length * width * depthFeet;
    const cubicYards = cubicFeet / 27;
    const cubicYardsWithWaste = cubicYards * 1.1;
    const bags80lb = Math.ceil(cubicFeet / 0.6);
    
    setResults({ 
      bags80lb,
      description: `Concrete Slab: ${length}'x${width}'x${depthInches}" (${Math.round(cubicYardsWithWaste * 100) / 100} cu yd)`,
      message: `Volume: ${Math.round(cubicYards * 100) / 100} cu yd | 80lb Bags Needed: ${bags80lb}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Length (ft)</Label><Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} /></div>
          <div><Label>Width (ft)</Label><Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} /></div>
          <div className="col-span-2"><Label>Depth (in)</Label><Input type="number" value={inputs.depth} onChange={(e) => setInputs({...inputs, depth: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        
        {results && results.bags80lb && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800">Results:</h4>
            <p className="text-sm text-green-700 mb-2">{results.message}</p>
            <SaveToEstimatePanel 
              description={results.description}
              quantity={results.bags80lb}
              unitLabel="Price per 80lb Bag ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 3. MAIN EXPORT (THE SHELL) ---
export default function HandymanCalculators({ preSelectedEstimateId }) {
  const [estimates, setEstimates] = React.useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = React.useState(preSelectedEstimateId || '');

  React.useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
        setEstimates(res || []);
        if (preSelectedEstimateId) setSelectedEstimateId(preSelectedEstimateId);
      } catch (e) { console.error(e); }
    };
    fetchEstimates();
  }, [preSelectedEstimateId]);

  const handleSaveItem = async (desc, qty, cost) => {
    if (!selectedEstimateId) { alert("⚠️ Please select an Estimate first."); return; }
    try {
      const est = await base44.entities.JobEstimate.read(selectedEstimateId);
      const total = parseFloat(qty) * parseFloat(cost);
      
      const newItem = {
        description: desc,
        quantity: parseFloat(qty),
        unit_cost: parseFloat(cost),
        total: total,
        unit: 'ea'
      };

      if (!est.items) est.items = [];
      est.items.push(newItem);
      
      let sub = 0; est.items.forEach(i => sub += i.total);
      est.subtotal = sub;
      est.total_amount = sub * (1 + ((est.tax_rate || 0) / 100));

      await base44.entities.JobEstimate.update(est);
      alert(`✅ Saved "${desc}" to estimate for $${total.toFixed(2)}!`);
    } catch (e) { console.error(e); alert("Error saving item."); }
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="bg-slate-50 p-3 border-b border-slate-200 mb-4 rounded-lg">
        <label className="text-xs font-bold text-slate-500 uppercase">Saving to Estimate:</label>
        <select 
          value={selectedEstimateId}
          onChange={(e) => setSelectedEstimateId(e.target.value)}
          className="w-full p-2 text-sm rounded border bg-white border-slate-300 mt-1"
        >
          <option value="">-- Select an Estimate --</option>
          {estimates.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {/* CONCRETE ONLY FOR NOW */}
      <ConcreteCalculator onSave={handleSaveItem} />
    </div>
  );
}