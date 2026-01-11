// Components/calculators/HandymanCalculators.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

// --- 1. THE MONEY BOX ---
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
          <Label className="text-xs text-green-800">
            {unitLabel || 'Unit Cost ($)'}
          </Label>
          <Input
            type="number"
            placeholder="0.00"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="bg-white"
          />
        </div>
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 gap-1"
        >
          <Save className="w-4 h-4" /> Add
        </Button>
      </div>
      <p className="text-xs text-green-600 mt-1">
        Qty: {quantity} | {description}
      </p>
    </div>
  );
}

// --- 2. CALCULATORS (IN SPECIFIED ORDER) ---

function FramingCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', spacing: '16' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const spacing = parseFloat(inputs.spacing);
    if (!len) return;
    const studs = Math.ceil((len * 12) / spacing) + 1;
    setResults({
      qty: studs,
      description: `Wall Studs: ${len}ft @ ${spacing}" OC`,
      message: `Studs needed: ${studs}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Wall Length (ft)</Label>
            <Input type="number" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} />
          </div>
          <div>
            <Label>Stud Spacing (in)</Label>
            <Input type="number" value={inputs.spacing} onChange={(e) => setInputs({ ...inputs, spacing: e.target.value })} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.qty} unitLabel="Price per Stud ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConcreteCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), d = parseFloat(inputs.depth);
    if (!l || !w || !d) return;
    const cubicFeet = l * w * (d / 12);
    const bags80lb = Math.ceil(cubicFeet / 0.6);
    setResults({
      bags: bags80lb,
      description: `Concrete Slab: ${l}' × ${w}' × ${d}"`,
      message: `80lb Bags: ${bags80lb}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Length (ft)</Label><Input type="number" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} /></div>
          <div><Label>Width (ft)</Label><Input type="number" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} /></div>
          <div className="col-span-2"><Label>Depth (in)</Label><Input type="number" value={inputs.depth} onChange={(e) => setInputs({ ...inputs, depth: e.target.value })} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.bags} unitLabel="Price per Bag ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DrywallCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), h = parseFloat(inputs.height);
    if (!l || !w || !h) return;
    const totalArea = (2 * (l + w) * h) + (l * w);
    const sheets4x8 = Math.ceil(totalArea / 32);
    setResults({
      sheets: sheets4x8,
      description: `Drywall: ${l}' × ${w}' room`,
      message: `4×8 Sheets: ${sheets4x8}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Drywall</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div><Label>L (ft)</Label><Input type="number" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} /></div>
          <div><Label>W (ft)</Label><Input type="number" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} /></div>
          <div><Label>H (ft)</Label><Input type="number" value={inputs.height} onChange={(e) => setInputs({ ...inputs, height: e.target.value })} /></div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.sheets} unitLabel="Price per Sheet ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaintCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', coats: '1' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), h = parseFloat(inputs.height), c = parseInt(inputs.coats);
    if (!l || !w || !h) return;
    const gallons = Math.ceil(((2 * (l + w) * h) * c) / 350);
    setResults({
      gallons,
      description: `Paint: ${l}' × ${w}' (${c} coats)`,
      message: `Gallons: ${gallons}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Paint</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} />
          <Input type="number" placeholder="H" value={inputs.height} onChange={(e) => setInputs({ ...inputs, height: e.target.value })} />
          <select className="border rounded px-2" value={inputs.coats} onChange={(e) => setInputs({ ...inputs, coats: e.target.value })}>
            <option value="1">1 Coat</option><option value="2">2 Coats</option>
          </select>
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.gallons} unitLabel="Price per Gal ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrimCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ length: '', width: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width);
    if (!l || !w) return;
    const withWaste = Math.ceil((2 * (l + w)) * 1.1);
    setResults({
      feet: withWaste,
      description: `Baseboard: ${l}' × ${w}' room`,
      message: `Linear Feet (10% waste): ${withWaste}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Trim</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} />
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.feet} unitLabel="Price per LF ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaterialsCalculator({ onSave }) {
  const [inputs, setInputs] = useState({ thickness: '1', width: '', length: '', quantity: '1' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const t = parseFloat(inputs.thickness), w = parseFloat(inputs.width), l = parseFloat(inputs.length), q = parseFloat(inputs.quantity);
    if (!t || !w || !l) return;
    const totalBF = ((t * w * l) / 12) * q;
    setResults({
      totalBF: totalBF.toFixed(2),
      description: `Lumber: ${q}pcs ${t}x${w}x${l}`,
      message: `Total Board Feet: ${totalBF.toFixed(2)}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Materials (Board Feet)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="T" value={inputs.thickness} onChange={(e) => setInputs({ ...inputs, thickness: e.target.value })} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} />
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} />
          <Input type="number" placeholder="Qty" value={inputs.quantity} onChange={(e) => setInputs({ ...inputs, quantity: e.target.value })} />
        </div>
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.totalBF} unitLabel="Price per BF ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StairsCalculator({ onSave }) {
  const [rise, setRise] = useState('');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const totalRise = parseFloat(rise);
    if (!totalRise) return;
    const numRisers = Math.ceil(totalRise / 7.75);
    const numTreads = numRisers - 1;
    setResults({
      treads: numTreads,
      description: `Stairs: ${numRisers} risers`,
      message: `Treads needed: ${numTreads}`
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stairs</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input type="number" placeholder="Total Rise (in)" value={rise} onChange={(e) => setRise(e.target.value)} />
        <Button onClick={calculate} className="w-full">Calculate</Button>
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel description={results.description} quantity={results.treads} unitLabel="Price per Tread ($)" onSave={onSave} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LayoutCalculator() {
  return <Card><CardHeader><CardTitle>Layout (Diagonal)</CardTitle></CardHeader><CardContent>Coming Soon...</CardContent></Card>;
}

function ConversionsCalculator() {
  return <Card><CardHeader><CardTitle>Conversions</CardTitle></CardHeader><CardContent>Coming Soon...</CardContent></Card>;
}

function SpecsReference() {
  return <Card><CardHeader><CardTitle>Specs Reference</CardTitle></CardHeader><CardContent>Coming Soon...</CardContent></Card>;
}

// --- 3. MAIN EXPORT (AT BOTTOM) ---
export default function HandymanCalculators({ preSelectedEstimateId }) {
  const [activeTab, setActiveTab] = useState('framing');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');

  useEffect(() => {
    const fetch = async () => {
      const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
      setEstimates(res || []);
    };
    fetch();
  }, []);

  const handleSaveItem = async (desc, qty, cost) => {
    if (!selectedEstimateId) {
      alert("Select an estimate first");
      return;
    }
    const est = await base44.entities.JobEstimate.read(selectedEstimateId);
    const total = parseFloat(qty) * parseFloat(cost);
    if (!est.items) est.items = [];
    est.items.push({ description: desc, quantity: qty, unit_cost: cost, total });
    est.subtotal = est.items.reduce((s, i) => s + i.total, 0);
    est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));
    await base44.entities.JobEstimate.update(est);
    alert("✅ Saved");
  };

  const renderActive = () => {
    switch (activeTab) {
      case 'framing': return <FramingCalculator onSave={handleSaveItem} />;
      case 'concrete': return <ConcreteCalculator onSave={handleSaveItem} />;
      case 'drywall': return <DrywallCalculator onSave={handleSaveItem} />;
      case 'paint': return <PaintCalculator onSave={handleSaveItem} />;
      case 'trim': return <TrimCalculator onSave={handleSaveItem} />;
      case 'materials': return <MaterialsCalculator onSave={handleSaveItem} />;
      case 'stairs': return <StairsCalculator onSave={handleSaveItem} />;
      case 'layout': return <LayoutCalculator />;
      case 'conversions': return <ConversionsCalculator />;
      case 'specs': return <SpecsReference />;
      default: return <FramingCalculator onSave={handleSaveItem} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-100 rounded border">
        <Label>Target Estimate</Label>
        <select 
          className="w-full p-2 border rounded" 
          value={selectedEstimateId} 
          onChange={(e) => setSelectedEstimateId(e.target.value)}
        >
          <option value="">-- Choose Estimate --</option>
          {estimates.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {['framing', 'concrete', 'drywall', 'paint', 'trim', 'materials', 'stairs', 'layout', 'conversions', 'specs'].map(t => (
          <Button key={t} variant={activeTab === t ? 'default' : 'outline'} onClick={() => setActiveTab(t)} className="capitalize">
            {t}
          </Button>
        ))}
      </div>

      {renderActive()}
    </div>
  );
}