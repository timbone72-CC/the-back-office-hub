// Components/calculators/HandymanCalculators.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

// ========== REGIONAL PRICING (Elk City, OK) ==========
const REGIONAL_PRICING = {
  region: 'Elk City, OK',
  labor: { default: 45, min: 20, max: 150 },
  framing: [
    { label: '2x4x8', price: 5.00 },
    { label: '2x6x8', price: 7.50 },
    { label: '2x4x12', price: 8.00 },
    { label: '2x6x12', price: 12.00 }
  ],
  concrete: [
    { label: 'Standard (per yard)', price: 135.00 }
  ],
  drywall: [
    { label: '4x8 ½"', price: 13.00 },
    { label: '4x8 ⅝"', price: 16.00 }
  ],
  paint: [
    { label: 'Interior (gal)', price: 32.00 },
    { label: 'Exterior (gal)', price: 40.00 },
    { label: 'Primer (gal)', price: 25.00 }
  ],
  trim: [
    { label: 'Baseboard (LF)', price: 1.75 },
    { label: 'Crown (LF)', price: 3.50 },
    { label: 'Door Casing (LF)', price: 2.00 }
  ],
  materials: [
    { label: 'Plywood 4x8 ½"', price: 45.00 },
    { label: 'Plywood 4x8 ¾"', price: 55.00 },
    { label: 'OSB 4x8', price: 28.00 }
  ]
};

// ========== PRESET SELECTOR COMPONENT ==========
function PresetSelector({ presets, onSelect, label = "Quick-fill" }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <select
        className="text-sm border rounded px-2 py-1"
        defaultValue=""
        onChange={(e) => {
          const selected = presets.find(p => p.label === e.target.value);
          if (selected) onSelect(selected.price);
          e.target.value = "";
        }}
      >
        <option value="" disabled>Select preset...</option>
        {presets.map(p => (
          <option key={p.label} value={p.label}>
            {p.label} — ${p.price.toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- CALCULATORS (IN SPECIFIED ORDER) ---

function FramingCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ length: '', spacing: '16', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const spacing = parseFloat(inputs.spacing);
    if (!len) return;
    const studs = Math.ceil((len * 12) / spacing) + 1;
    setResults({ qty: studs, desc: `Wall Studs: ${len}ft @ ${spacing}" OC` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" placeholder="Length (ft)" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="Spacing (in)" value={inputs.spacing} onChange={(e) => setInputs({ ...inputs, spacing: e.target.value })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold">Studs: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost per stud" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>
                {saving ? 'Saving...' : <Save className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConcreteCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), d = parseFloat(inputs.depth);
    if (!l || !w || !d) return;
    const bags = Math.ceil((l * w * (d / 12)) / 0.6);
    setResults({ qty: bags, desc: `Concrete: ${l}x${w}x${d}"` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="D" value={inputs.depth} onChange={(e) => setInputs({ ...inputs, depth: e.target.value })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Bags: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/bag" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DrywallCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), h = parseFloat(inputs.height);
    if (!l || !w || !h) return;
    const sheets = Math.ceil(((2 * (l + w) * h) + (l * w)) / 32);
    setResults({ qty: sheets, desc: `Drywall: ${l}x${w} room` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Drywall</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="H" value={inputs.height} onChange={(e) => setInputs({ ...inputs, height: e.target.value })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Sheets: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/sheet" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaintCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', coats: '1', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length), w = parseFloat(inputs.width), h = parseFloat(inputs.height), c = parseInt(inputs.coats);
    const gallons = Math.ceil(((2 * (l + w) * h) * c) / 350);
    setResults({ qty: gallons, desc: `Paint: ${l}x${w} (${c} coats)` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Paint</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} disabled={saving} />
          <select className="border rounded px-2" value={inputs.coats} onChange={(e) => setInputs({ ...inputs, coats: e.target.value })} disabled={saving}>
            <option value="1">1 Coat</option><option value="2">2 Coats</option>
          </select>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Gallons: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/gal" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrimCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ length: '', width: '', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const feet = Math.ceil((2 * (parseFloat(inputs.length) + parseFloat(inputs.width))) * 1.1);
    setResults({ qty: feet, desc: `Trim: ${inputs.length}x${inputs.width}` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Trim</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Lin Ft: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/ft" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaterialsCalculator({ onSave, saving }) {
  const [inputs, setInputs] = useState({ thickness: '1', width: '', length: '', quantity: '1', cost: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const bf = ((parseFloat(inputs.thickness) * parseFloat(inputs.width) * parseFloat(inputs.length)) / 12) * parseFloat(inputs.quantity);
    setResults({ qty: bf.toFixed(2), desc: `Lumber: ${inputs.quantity}pcs` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Materials</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="W" value={inputs.width} onChange={(e) => setInputs({ ...inputs, width: e.target.value })} disabled={saving} />
          <Input type="number" placeholder="L" value={inputs.length} onChange={(e) => setInputs({ ...inputs, length: e.target.value })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Board Ft: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/BF" value={inputs.cost} onChange={(e) => setInputs({...inputs, cost: e.target.value})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost)} disabled={saving || !inputs.cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StairsCalculator({ onSave, saving }) {
  const [rise, setRise] = useState('');
  const [cost, setCost] = useState('');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const treads = Math.ceil(parseFloat(rise) / 7.75) - 1;
    setResults({ qty: treads, desc: `Stairs: ${rise}" rise` });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stairs</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input type="number" placeholder="Total Rise" value={rise} onChange={(e) => setRise(e.target.value)} disabled={saving} />
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 border rounded">
            <p className="text-sm">Treads: {results.qty}</p>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Cost/tread" value={cost} onChange={(e) => setCost(e.target.value)} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, cost)} disabled={saving || !cost}>Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LayoutCalculator() { return <Card><CardContent>Layout Coming Soon</CardContent></Card>; }
function ConversionsCalculator() { return <Card><CardContent>Conversions Coming Soon</CardContent></Card>; }
function SpecsReference() { return <Card><CardContent>Specs Coming Soon</CardContent></Card>; }

// --- MAIN EXPORT ---
export default function HandymanCalculators({ preSelectedEstimateId }) {
  const [activeTab, setActiveTab] = useState('framing');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
      setEstimates(res || []);
    };
    fetch();
  }, []);

  const handleSaveItem = async (desc, qty, cost) => {
    if (!selectedEstimateId || saving) return;

    // Added Validation Guard
    const q = parseFloat(qty);
    const c = parseFloat(cost);

    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c <= 0) {
      alert("Invalid quantity or cost");
      return;
    }

    setSaving(true);
    try {
      const est = await base44.entities.JobEstimate.read(selectedEstimateId);
      const total = q * c; // Updated usage to use validated numeric variables
      if (!est.items) est.items = [];
      
      // Updated items.push to use validated numeric variables
      est.items.push({ 
        description: desc, 
        quantity: q, 
        unit_cost: c, 
        total 
      });

      est.subtotal = est.items.reduce((s, i) => s + i.total, 0);
      est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));
      await base44.entities.JobEstimate.update(est);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderActive = () => {
    const props = { onSave: handleSaveItem, saving };
    switch (activeTab) {
      case 'framing': return <FramingCalculator {...props} />;
      case 'concrete': return <ConcreteCalculator {...props} />;
      case 'drywall': return <DrywallCalculator {...props} />;
      case 'paint': return <PaintCalculator {...props} />;
      case 'trim': return <TrimCalculator {...props} />;
      case 'materials': return <MaterialsCalculator {...props} />;
      case 'stairs': return <StairsCalculator {...props} />;
      case 'layout': return <LayoutCalculator />;
      case 'conversions': return <ConversionsCalculator />;
      case 'specs': return <SpecsReference />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <select className="w-full p-2 border rounded" value={selectedEstimateId} onChange={(e) => setSelectedEstimateId(e.target.value)} disabled={saving}>
        <option value="">-- Select Estimate --</option>
        {estimates.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        {['framing', 'concrete', 'drywall', 'paint', 'trim', 'materials', 'stairs', 'layout', 'conversions', 'specs'].map(t => (
          <Button key={t} variant={activeTab === t ? 'default' : 'outline'} onClick={() => setActiveTab(t)} disabled={saving} className="capitalize">{t}</Button>
        ))}
      </div>
      {renderActive()}
    </div>
  );
}