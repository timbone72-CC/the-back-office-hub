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

// --- 5. MATERIALS CALCULATOR (Board Feet & Decking) ---
function MaterialsCalculator({ onSave }) {
  const [bf, setBf] = useState({ t: '1', w: '', l: '', q: '1' });
  const [results, setResults] = useState(null);

  const calculateBF = () => {
    const total = (parseFloat(bf.t) * parseFloat(bf.w) * parseFloat(bf.l) / 12) * parseFloat(bf.q);
    setResults({
      qty: total.toFixed(2), description: `Lumber: ${bf.q}pc ${bf.t}"x${bf.w}"x${bf.l}'`,
      message: `Total Board Feet: ${total.toFixed(2)}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Materials (Board Feet)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Thick (in)</Label><Input type="number" value={bf.t} onChange={(e) => setBf({...bf, t: e.target.value})} /></div>
          <div><Label>Width (in)</Label><Input type="number" value={bf.w} onChange={(e) => setBf({...bf, w: e.target.value})} /></div>
          <div><Label>Length (ft)</Label><Input type="number" value={bf.l} onChange={(e) => setBf({...bf, l: e.target.value})} /></div>
          <div><Label>Qty</Label><Input type="number" value={bf.q} onChange={(e) => setBf({...bf, q: e.target.value})} /></div>
        </div>
        <Button onClick={calculateBF} className="w-full">Calculate BF</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.qty} unitLabel="Price per Board Foot ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 6. DRYWALL CALCULATOR ---
function DrywallCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ l: '', w: '', h: '8' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.l), w = parseFloat(inputs.w), h = parseFloat(inputs.h);
    if (!l) return;
    const surface = (l + w) * 2 * h + (l * w); // Walls + Ceiling
    const sheets = Math.ceil(surface / 32); // 4x8 sheets
    setResults({
      sheets, description: `Drywall: ${l}'x${w}' room`,
      message: `Surface Area: ${surface} sq ft | 4x8 Sheets: ${sheets}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Drywall</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Len</Label><Input type="number" value={inputs.l} onChange={(e) => setInputs({...inputs, l: e.target.value})} /></div>
          <div><Label>Wid</Label><Input type="number" value={inputs.w} onChange={(e) => setInputs({...inputs, w: e.target.value})} /></div>
          <div><Label>Hgt</Label><Input type="number" value={inputs.h} onChange={(e) => setInputs({...inputs, h: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.sheets} unitLabel="Price per Sheet ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 7. PAINT CALCULATOR ---
function PaintCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ l: '', w: '', h: '8' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.l), w = parseFloat(inputs.w), h = parseFloat(inputs.h);
    if (!l) return;
    const surface = (l + w) * 2 * h; // Walls only
    const gallons = Math.ceil(surface / 350);
    setResults({
      gallons, description: `Paint: ${l}'x${w}' room (Walls)`,
      message: `Wall Area: ${surface} sq ft | Gallons (1 coat): ${gallons}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Paint</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Len</Label><Input type="number" value={inputs.l} onChange={(e) => setInputs({...inputs, l: e.target.value})} /></div>
          <div><Label>Wid</Label><Input type="number" value={inputs.w} onChange={(e) => setInputs({...inputs, w: e.target.value})} /></div>
          <div><Label>Hgt</Label><Input type="number" value={inputs.h} onChange={(e) => setInputs({...inputs, h: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.gallons} unitLabel="Price per Gallon ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- 8. TRIM CALCULATOR (Baseboard) ---
function TrimCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ l: '', w: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.l), w = parseFloat(inputs.w);
    if (!l) return;
    const perimeter = (l + w) * 2;
    const waste = Math.ceil(perimeter * 1.1);
    setResults({
      waste, description: `Baseboard: ${l}'x${w}' room`,
      message: `Perimeter: ${perimeter} ft | With 10% Waste: ${waste} ft`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Trim</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Length</Label><Input type="number" value={inputs.l} onChange={(e) => setInputs({...inputs, l: e.target.value})} /></div>
          <div><Label>Width</Label><Input type="number" value={inputs.w} onChange={(e) => setInputs({...inputs, w: e.target.value})} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.waste} unitLabel="Price per Linear Ft ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}