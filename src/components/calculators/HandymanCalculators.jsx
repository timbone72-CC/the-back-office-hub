import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

// --- 1. THE MONEY BOX (Connects Math to Money) ---
function SaveToEstimatePanel({ description, quantity, unitLabel, onSave }) {
  const [unitCost, setUnitCost] = useState('');

  const handleSave = () => {
    if (!unitCost) { alert("Please enter a unit cost"); return; }
    onSave(description, quantity, unitCost);
    setUnitCost('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-green-300">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs text-green-800">{unitLabel || 'Unit Cost ($)'}</Label>
          <Input type="number" placeholder="0.00" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="bg-white" />
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-1">
          <Save className="w-4 h-4" /> Add
        </Button>
      </div>
      <p className="text-xs text-green-600 mt-1">Qty: {quantity} | {description}</p>
    </div>
  );
}

// --- 2. FRAMING CALCULATOR (Studs & Rafters) ---
function FramingCalculator({ onSave }) {
  const [studInputs, setStudInputs] = useState({ wallLength: '', studSpacing: '16' });
  const [results, setResults] = useState(null);

  const calculateStuds = () => {
    const len = parseFloat(studInputs.wallLength);
    const spacing = parseFloat(studInputs.studSpacing);
    if (!len) return;
    const studs = Math.ceil((len * 12) / spacing) + 1; // Basic stud calc
    setResults({ 
      type: 'studs', quantity: studs, 
      description: `Wall Studs: ${len}ft wall @ ${spacing}" OC`,
      message: `Studs needed: ${studs}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Wall Len (ft)</Label><Input type="number" value={studInputs.wallLength} onChange={(e) => setStudInputs({...studInputs, wallLength: e.target.value})} /></div>
          <div><Label>Spacing (in)</Label><Input type="number" value={studInputs.studSpacing} onChange={(e) => setStudInputs({...studInputs, studSpacing: e.target.value})} /></div>
        </div>
        <Button onClick={calculateStuds} className="w-full">Calculate Studs</Button>
        {results && results.type === 'studs' && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.quantity} unitLabel="Price per Stud ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 3. STAIRS CALCULATOR ---
function StairsCalculator({ onSave }) {
  const [rise, setRise] = useState('');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const totalRise = parseFloat(rise);
    if (!totalRise) return;
    const numRisers = Math.round(totalRise / 7.5);
    const riserHeight = totalRise / numRisers;
    setResults({
      numRisers, numTreads: numRisers - 1,
      description: `Stairs: ${numRisers} risers @ ${riserHeight.toFixed(2)}"`,
      message: `Risers: ${numRisers} | Treads: ${numRisers - 1}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stairs</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Total Rise (in)</Label><Input type="number" value={rise} onChange={(e) => setRise(e.target.value)} /></div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.numTreads} unitLabel="Price per Tread ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 4. CONCRETE CALCULATOR ---
function ConcreteCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), d = parseFloat(inputs.depth);
    if (!l || !w) return;
    const cubicFeet = l * w * (d / 12);
    const bags = Math.ceil(cubicFeet / 0.6); // 80lb bags
    setResults({
      bags, description: `Concrete: ${l}'x${w}'x${d}" slab`,
      message: `Volume: ${cubicFeet.toFixed(2)} cu ft | 80lb Bags: ${bags}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Length</Label><Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} /></div>
          <div><Label>Width</Label><Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} /></div>
          <div className="col-span-2"><Label>Depth (in)</Label><Input type="number" value={inputs.depth} onChange={(e) => setInputs({...inputs, depth: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.bags} unitLabel="Price per Bag ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}