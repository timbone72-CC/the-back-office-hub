// ========== FILE: Components/calculators/HandymanCalculators.jsx ==========

// ========== IMPORTS ==========
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2 } from 'lucide-react';
import base44 from '@/lib/base44';

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
    { label: 'Standard (per yard)', price: 135.00 },
    { label: 'High-strength (per yard)', price: 155.00 }
  ],
  drywall: [
    { label: '4x8 ½"', price: 13.00 },
    { label: '4x8 ⅝"', price: 16.00 },
    { label: '4x12 ½"', price: 18.00 }
  ],
  paint: [
    { label: 'Interior (gal)', price: 32.00 },
    { label: 'Exterior (gal)', price: 40.00 },
    { label: 'Primer (gal)', price: 25.00 }
  ],
  trim: [
    { label: 'Baseboard (LF)', price: 1.75 },
    { label: 'Crown (LF)', price: 3.50 },
    { label: 'Door Casing (LF)', price: 2.00 },
    { label: 'Window Casing (LF)', price: 2.25 }
  ],
  materials: [
    { label: 'Plywood 4x8 ½"', price: 45.00 },
    { label: 'Plywood 4x8 ¾"', price: 55.00 },
    { label: 'OSB 4x8', price: 28.00 },
    { label: 'Cement board 3x5', price: 12.00 }
  ],
  stairs: [
    { label: 'Tread (each)', price: 18.00 },
    { label: 'Riser (each)', price: 8.00 },
    { label: 'Stringer (each)', price: 35.00 }
  ]
};

// ========== HELPER: Numeric Input (Sanitized) ==========
const NumericInput = ({ value, onChange, placeholder, disabled, className }) => {
  const handleChange = (e) => {
    const val = e.target.value;
    // Allow empty string or valid decimal numbers only
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };
  return (
    <Input 
      type="text" 
      inputMode="decimal"
      value={value} 
      onChange={handleChange} 
      placeholder={placeholder} 
      disabled={disabled} 
      className={className} 
    />
  );
};

// ========== HELPER: Preset Selector Dropdown ==========
function PresetSelector({ presets, onSelect, label = "Quick-fill" }) {
  if (!presets || presets.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <select
        className="text-sm border rounded px-2 py-1 bg-white"
        defaultValue=""
        onChange={(e) => {
          const selected = presets.find(p => p.label === e.target.value);
          if (selected) onSelect(selected.price);
          e.target.value = ""; // Reset after selection
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

// ========== CALCULATOR: Framing ==========
function FramingCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', spacing: '16', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const spacing = parseFloat(inputs.spacing);
    if (!len || !spacing) return;
    // Formula: studs = (length in inches / spacing) + 1
    const studs = Math.ceil((len * 12) / spacing) + 1;
    setResults({ 
      qty: studs, 
      desc: `Wall Studs (${len}ft @ ${spacing}" OC)`,
      laborHours: (len / 10).toFixed(2) // Estimate: 1hr per 10ft
    });
  };

  // Handle preset selection — fills cost field
  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Preset selector for lumber pricing */}
        <PresetSelector 
          presets={REGIONAL_PRICING.framing} 
          onSelect={handlePreset} 
          label="Lumber preset" 
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Length (ft)</Label>
            <NumericInput 
              placeholder="Wall length" 
              value={inputs.length} 
              onChange={(v) => setInputs({ ...inputs, length: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Spacing (in)</Label>
            <NumericInput 
              placeholder="Stud spacing" 
              value={inputs.spacing} 
              onChange={(v) => setInputs({ ...inputs, spacing: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Studs Needed: {results.qty}</p>
            {/* Labor toggle */}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-framing" 
              />
              <Label htmlFor="labor-framing" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            {/* Cost input and save */}
            <div className="flex gap-2">
              <NumericInput 
                placeholder="Cost per stud" 
                value={inputs.cost} 
                onChange={(v) => setInputs({...inputs, cost: v})} 
                disabled={saving} 
              />
              <Button 
                onClick={() => onSave(
                  results.desc, 
                  results.qty, 
                  inputs.cost, 
                  includeLabor ? { hours: results.laborHours, rate: laborRate } : null
                )} 
                disabled={saving || !inputs.cost}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Concrete ==========
function ConcreteCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const d = parseFloat(inputs.depth);
    if (!l || !w || !d) return;
    // Formula: cubic yards = (L × W × D in inches) / 46656, then / 27
    const cubicFeet = l * w * (d / 12);
    const yards = cubicFeet / 27;
    const yardsRounded = Math.ceil(yards * 10) / 10; // Round up to nearest 0.1
    setResults({
      qty: yardsRounded,
      desc: `Concrete (${l}' × ${w}' × ${d}")`,
      laborHours: (yardsRounded * 1.5).toFixed(2) // Estimate: 1.5hr per yard
    });
  };

  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.concrete} 
          onSelect={handlePreset} 
          label="Concrete preset" 
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Length (ft)</Label>
            <NumericInput 
              placeholder="Length" 
              value={inputs.length} 
              onChange={(v) => setInputs({ ...inputs, length: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Width (ft)</Label>
            <NumericInput 
              placeholder="Width" 
              value={inputs.width} 
              onChange={(v) => setInputs({ ...inputs, width: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Depth (in)</Label>
            <NumericInput 
              placeholder="Depth" 
              value={inputs.depth} 
              onChange={(v) => setInputs({ ...inputs, depth: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Yards Needed: {results.qty}</p>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-concrete" 
              />
              <Label htmlFor="labor-concrete" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            <div className="flex gap-2">
              <NumericInput 
                placeholder="Cost per yard" 
                value={inputs.cost} 
                onChange={(v) => setInputs({...inputs, cost: v})} 
                disabled={saving} 
              />
              <Button 
                onClick={() => onSave(
                  results.desc, 
                  results.qty, 
                  inputs.cost, 
                  includeLabor ? { hours: results.laborHours, rate: laborRate } : null
                )} 
                disabled={saving || !inputs.cost}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Drywall ==========
function DrywallCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', height: '8', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const h = parseFloat(inputs.height);
    if (!l || !h) return;
    // Formula: sheets = (wall sqft) / 32 (4x8 sheet)
    const sqft = l * h;
    const sheets = Math.ceil(sqft / 32);
    setResults({
      qty: sheets,
      sqft: sqft,
      desc: `Drywall Sheets (${l}' × ${h}' wall)`,
      laborHours: (sheets * 0.5).toFixed(2) // Estimate: 0.5hr per sheet
    });
  };

  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Drywall Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.drywall} 
          onSelect={handlePreset} 
          label="Drywall preset" 
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Wall Length (ft)</Label>
            <NumericInput 
              placeholder="Length" 
              value={inputs.length} 
              onChange={(v) => setInputs({ ...inputs, length: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Wall Height (ft)</Label>
            <NumericInput 
              placeholder="Height" 
              value={inputs.height} 
              onChange={(v) => setInputs({ ...inputs, height: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Sheets Needed: {results.qty}</p>
            <p className="text-xs text-gray-500">Coverage: {results.sqft} sq ft</p>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-drywall" 
              />
              <Label htmlFor="labor-drywall" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            <div className="flex gap-2">
              <NumericInput 
                placeholder="Cost per sheet" 
                value={inputs.cost} 
                onChange={(v) => setInputs({...inputs, cost: v})} 
                disabled={saving} 
              />
              <Button 
                onClick={() => onSave(
                  results.desc, 
                  results.qty, 
                  inputs.cost, 
                  includeLabor ? { hours: results.laborHours, rate: laborRate } : null
                )} 
                disabled={saving || !inputs.cost}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Paint ==========
function PaintCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ sqft: '', coats: '2', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const sqft = parseFloat(inputs.sqft);
    const coats = parseFloat(inputs.coats);
    if (!sqft || !coats) return;
    // Formula: gallons = (sqft × coats) / 350 (coverage per gallon)
    const gallons = Math.ceil((sqft * coats) / 350);
    setResults({
      qty: gallons,
      desc: `Paint (${sqft} sq ft, ${coats} coats)`,
      laborHours: (sqft / 150).toFixed(2) // Estimate: 150 sqft per hour
    });
  };

  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Paint Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.paint} 
          onSelect={handlePreset} 
          label="Paint preset" 
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Area (sq ft)</Label>
            <NumericInput 
              placeholder="Square feet" 
              value={inputs.sqft} 
              onChange={(v) => setInputs({ ...inputs, sqft: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Coats</Label>
            <NumericInput 
              placeholder="Number of coats" 
              value={inputs.coats} 
              onChange={(v) => setInputs({ ...inputs, coats: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Gallons Needed: {results.qty}</p>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-paint" 
              />
              <Label htmlFor="labor-paint" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            <div className="flex gap-2">
              <NumericInput 
                placeholder="Cost per gallon" 
                value={inputs.cost} 
                onChange={(v) => setInputs({...inputs, cost: v})} 
                disabled={saving} 
              />
              <Button 
                onClick={() => onSave(
                  results.desc, 
                  results.qty, 
                  inputs.cost, 
                  includeLabor ? { hours: results.laborHours, rate: laborRate } : null
                )} 
                disabled={saving || !inputs.cost}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Trim ==========
function TrimCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', waste: '10', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const waste = parseFloat(inputs.waste);
    if (!len) return;
    // Formula: total LF = length × (1 + waste%)
    const totalLF = Math.ceil(len * (1 + (waste || 0) / 100));
    setResults({
      qty: totalLF,
      desc: `Trim (${len} LF + ${waste}% waste)`,
      laborHours: (totalLF / 20).toFixed(2) // Estimate: 20 LF per hour
    });
  };

  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Trim Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.trim} 
          onSelect={handlePreset} 
          label="Trim preset" 
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Linear Feet</Label>
            <NumericInput 
              placeholder="Length needed" 
              value={inputs.length} 
              onChange={(v) => setInputs({ ...inputs, length: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Waste %</Label>
            <NumericInput 
              placeholder="Waste factor" 
              value={inputs.waste} 
              onChange={(v) => setInputs({ ...inputs, waste: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Total Linear Feet: {results.qty}</p>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-trim" 
              />
              <Label htmlFor="labor-trim" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            <div className="flex gap-2">
              <NumericInput 
                placeholder="Cost per LF" 
                value={inputs.cost} 
                onChange={(v) => setInputs({...inputs, cost: v})} 
                disabled={saving} 
              />
              <Button 
                onClick={() => onSave(
                  results.desc, 
                  results.qty, 
                  inputs.cost, 
                  includeLabor ? { hours: results.laborHours, rate: laborRate } : null
                )} 
                disabled={saving || !inputs.cost}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Materials (General Purpose) ==========
function MaterialsCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ qty: '', desc: '', cost: '' });
  const [includeLabor, setIncludeLabor] = useState(false);
  const [laborHours, setLaborHours] = useState('');

  const handlePreset = (price) => {
    setInputs({ ...inputs, cost: price.toString() });
  };

  const handleSave = () => {
    const q = parseFloat(inputs.qty);
    const c = parseFloat(inputs.cost);
    if (!q || !c || !inputs.desc.trim()) return;
    onSave(
      inputs.desc.trim(),
      q,
      inputs.cost,
      includeLabor && laborHours ? { hours: laborHours, rate: laborRate } : null
    );
  };

  return (
    <Card>
      <CardHeader><CardTitle>Materials Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.materials} 
          onSelect={handlePreset} 
          label="Material preset" 
        />
        <div>
          <Label className="text-xs text-gray-500">Description</Label>
          <Input 
            placeholder="Material description" 
            value={inputs.desc} 
            onChange={(e) => setInputs({ ...inputs, desc: e.target.value })} 
            disabled={saving} 
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Quantity</Label>
            <NumericInput 
              placeholder="Qty" 
              value={inputs.qty} 
              onChange={(v) => setInputs({ ...inputs, qty: v })} 
              disabled={saving} 
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Unit Cost</Label>
            <NumericInput 
              placeholder="Cost each" 
              value={inputs.cost} 
              onChange={(v) => setInputs({ ...inputs, cost: v })} 
              disabled={saving} 
            />
          </div>
        </div>
        {/* Manual labor entry for general materials */}
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={includeLabor} 
            onChange={(e) => setIncludeLabor(e.target.checked)} 
            id="labor-materials" 
          />
          <Label htmlFor="labor-materials" className="text-xs">Include Labor</Label>
          {includeLabor && (
            <NumericInput 
              placeholder="Hours" 
              value={laborHours} 
              onChange={setLaborHours} 
              disabled={saving} 
              className="w-20" 
            />
          )}
        </div>
        <Button 
          onClick={handleSave} 
          className="w-full" 
          disabled={saving || !inputs.qty || !inputs.cost || !inputs.desc.trim()}
        >
          <Save className="w-4 h-4 mr-2" /> Save to Estimate
        </Button>
      </CardContent>
    </Card>
  );
}

// ========== CALCULATOR: Stairs ==========
function StairsCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ rise: '', treadCost: '', riserCost: '', stringerCost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const totalRise = parseFloat(inputs.rise);
    if (!totalRise) return;
    // Standard: 7.5" rise per step
    const steps = Math.ceil(totalRise / 7.5);
    const treads = steps;
    const risers = steps + 1;
    const stringers = 3; // Standard: 3 stringers
    setResults({
      steps,
      treads,
      risers,
      stringers,
      desc: `Staircase (${totalRise}" total rise, ${steps} steps)`,
      laborHours: (steps * 0.75).toFixed(2) // Estimate: 0.75hr per step
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stairs Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PresetSelector 
          presets={REGIONAL_PRICING.stairs} 
          onSelect={(price) => setInputs({ ...inputs, treadCost: price.toString() })} 
          label="Stair preset" 
        />
        <div>
          <Label className="text-xs text-gray-500">Total Rise (inches)</Label>
          <NumericInput 
            placeholder="Floor to floor height" 
            value={inputs.rise} 
            onChange={(v) => setInputs({ ...inputs, rise: v })} 
            disabled={saving} 
          />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <div className="text-sm space-y-1">
              <p><span className="font-bold">Steps:</span> {results.steps}</p>
              <p><span className="font-bold">Treads:</span> {results.treads}</p>
              <p><span className="font-bold">Risers:</span> {results.risers}</p>
              <p><span className="font-bold">Stringers:</span> {results.stringers}</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-stairs" 
              />
              <Label htmlFor="labor-stairs" className="text-xs">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Tread $</Label>
                <NumericInput 
                  placeholder="Each" 
                  value={inputs.treadCost} 
                  onChange={(v) => setInputs({...inputs, treadCost: v})} 
                  disabled={saving} 
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Riser $</Label>
                <NumericInput 
                  placeholder="Each" 
                  value={inputs.riserCost} 
                  onChange={(v) => setInputs({...inputs, riserCost: v})} 
                  disabled={saving} 
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Stringer $</Label>
                <NumericInput 
                  placeholder="Each" 
                  value={inputs.stringerCost} 
                  onChange={(v) => setInputs({...inputs, stringerCost: v})} 
                  disabled={saving} 
                />
              </div>
            </div>
            <Button 
              onClick={() => {
                // Save treads
                if (inputs.treadCost) {
                  onSave(`Stair Treads (${results.treads})`, results.treads, inputs.treadCost, null);
                }
                // Save risers
                if (inputs.riserCost) {
                  onSave(`Stair Risers (${results.risers})`, results.risers, inputs.riserCost, null);
                }
                // Save stringers
                if (inputs.stringerCost) {
                  onSave(`Stair Stringers (${results.stringers})`, results.stringers, inputs.stringerCost, null);
                }
                // Save labor (once, if selected)
                if (includeLabor) {
                  onSave(`Labor: ${results.desc}`, parseFloat(results.laborHours), laborRate.toString(), null);
                }
              }} 
              className="w-full"
              disabled={saving || (!inputs.treadCost && !inputs.riserCost && !inputs.stringerCost)}
            >
              <Save className="w-4 h-4 mr-2" /> Save All to Estimate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== STATIC: Layout Reference ==========
function LayoutReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Layout Reference</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-bold">3-4-5 Triangle Method</p>
            <p className="text-gray-600">For square corners: measure 3ft on one side, 4ft on the other. Diagonal should be exactly 5ft.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-bold">Stud Layout</p>
            <p className="text-gray-600">16" OC: studs at 0", 16", 32", 48"...</p>
            <p className="text-gray-600">24" OC: studs at 0", 24", 48", 72"...</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-bold">Door Rough Openings</p>
            <p className="text-gray-600">Standard: door width + 2", height + 2.5"</p>
            <p className="text-gray-600">Example: 30" door → 32" × 82.5" RO</p>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-bold">Window Rough Openings</p>
            <p className="text-gray-600">Standard: window size + ½" each side</p>
            <p className="text-gray-600">Example: 36×48 window → 37" × 49" RO</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== STATIC: Conversions Reference ==========
function ConversionsReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Conversions Reference</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3">
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <p className="font-bold">Length</p>
            <ul className="text-gray-600 space-y-1">
              <li>1 foot = 12 inches</li>
              <li>1 yard = 3 feet = 36 inches</li>
              <li>1 meter = 3.281 feet</li>
            </ul>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <p className="font-bold">Area</p>
            <ul className="text-gray-600 space-y-1">
              <li>1 sq yard = 9 sq feet</li>
              <li>1 sq meter = 10.764 sq feet</li>
              <li>1 acre = 43,560 sq feet</li>
            </ul>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <p className="font-bold">Volume</p>
            <ul className="text-gray-600 space-y-1">
              <li>1 cubic yard = 27 cubic feet</li>
              <li>1 gallon = 231 cubic inches</li>
              <li>1 cubic foot = 7.48 gallons</li>
            </ul>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <p className="font-bold">Weight</p>
            <ul className="text-gray-600 space-y-1">
              <li>Concrete: ~150 lbs/cu ft</li>
              <li>Water: 8.34 lbs/gallon</li>
              <li>Drywall ½": ~1.6 lbs/sq ft</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== STATIC: Specs Reference ==========
function SpecsReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Common Specs Reference</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3">
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-bold">Lumber Dimensions (Actual)</p>
            <ul className="text-gray-600 space-y-1">
              <li>2×4 = 1.5" × 3.5"</li>
              <li>2×6 = 1.5" × 5.5"</li>
              <li>2×8 = 1.5" × 7.25"</li>
              <li>2×10 = 1.5" × 9.25"</li>
              <li>2×12 = 1.5" × 11.25"</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-bold">Drywall Sheets</p>
            <ul className="text-gray-600 space-y-1">
              <li>4×8 = 32 sq ft</li>
              <li>4×10 = 40 sq ft</li>
              <li>4×12 = 48 sq ft</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-bold">Paint Coverage</p>
            <ul className="text-gray-600 space-y-1">
              <li>Interior: 350-400 sq ft/gal</li>
              <li>Exterior: 250-350 sq ft/gal</li>
              <li>Primer: 200-300 sq ft/gal</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-bold">Concrete</p>
            <ul className="text-gray-600 space-y-1">
              <li>4" slab: 1.23 cu yd per 100 sq ft</li>
              <li>6" slab: 1.85 cu yd per 100 sq ft</li>
              <li>80lb bag = 0.6 cu ft</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-bold">Stair Code (Residential)</p>
            <ul className="text-gray-600 space-y-1">
              <li>Max rise: 7.75"</li>
              <li>Min run: 10"</li>
              <li>Min width: 36"</li>
              <li>Min headroom: 6'8"</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== MAIN COMPONENT EXPORT ==========
export default function HandymanCalculators({ preSelectedEstimateId }) {
  // Persistent tab state via localStorage
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hc_lastTab') || 'framing';
    }
    return 'framing';
  });

  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [laborRate, setLaborRate] = useState(REGIONAL_PRICING.labor.default);

  // Save last active tab to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_lastTab', activeTab);
    }
  }, [activeTab]);

  // Fetch available estimates on mount
  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
        setEstimates(res || []);
      } catch (err) {
        console.error('Failed to fetch estimates:', err);
        setEstimates([]);
      }
    };
    fetchEstimates();
  }, []);

  // ========== SAVE HANDLER (with validation and labor support) ==========
  const handleSaveItem = async (desc, qty, cost, laborObj = null) => {
    // Guard: require estimate selection
    if (!selectedEstimateId) {
      alert('Please select an estimate first');
      return;
    }
    // Guard: prevent double-save
    if (saving) return;

    // Validate numeric inputs
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c <= 0) {
      alert('Invalid quantity or cost');
      return;
    }

    setSaving(true);
    try {
      // Fetch current estimate
      const est = await base44.entities.JobEstimate.read(selectedEstimateId);
      if (!est.items) est.items = [];

      // Add material item with validated numeric variables
      est.items.push({
        description: desc,
        quantity: q,
        unit_cost: c,
        total: q * c
      });

      // Add labor item if applicable
      if (laborObj) {
        const lh = parseFloat(laborObj.hours);
        const lr = parseFloat(laborObj.rate);
        if (Number.isFinite(lh) && Number.isFinite(lr) && lh > 0 && lr > 0) {
          est.items.push({
            description: `Labor: ${desc}`,
            quantity: lh,
            unit_cost: lr,
            total: lh * lr
          });
        }
      }

      // Recalculate totals
      est.subtotal = est.items.reduce((sum, item) => sum + item.total, 0);
      est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));

      // Save updated estimate
      await base44.entities.JobEstimate.update(est);

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ========== TAB RENDERER ==========
  const renderActiveCalculator = () => {
    const props = { onSave: handleSaveItem, saving, laborRate };
    switch (activeTab) {
      case 'framing': return <FramingCalculator {...props} />;
      case 'concrete': return <ConcreteCalculator {...props} />;
      case 'drywall': return <DrywallCalculator {...props} />;
      case 'paint': return <PaintCalculator {...props} />;
      case 'trim': return <TrimCalculator {...props} />;
      case 'materials': return <MaterialsCalculator {...props} />;
      case 'stairs': return <StairsCalculator {...props} />;
      case 'layout': return <LayoutReference />;
      case 'conversions': return <ConversionsReference />;
      case 'specs': return <SpecsReference />;
      default: return null;
    }
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-4">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>Item added to estimate!</span>
        </div>
      )}

      {/* Header Controls: Estimate Selector + Labor Rate */}
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Estimate</Label>
            <select 
              className="w-full p-2 border rounded bg-white" 
              value={selectedEstimateId} 
              onChange={(e) => setSelectedEstimateId(e.target.value)} 
              disabled={saving}
            >
              <option value="">-- Select Estimate --</option>
              {estimates.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Labor Rate ($/hr) — {REGIONAL_PRICING.region}</Label>
            <NumericInput 
              value={laborRate} 
              onChange={(v) => setLaborRate(parseFloat(v) || REGIONAL_PRICING.labor.default)} 
              disabled={saving} 
              className="bg-white" 
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {['framing', 'concrete', 'drywall', 'paint', 'trim', 'materials', 'stairs', 'layout', 'conversions', 'specs'].map(tab => (
          <Button 
            key={tab} 
            variant={activeTab === tab ? 'default' : 'outline'} 
            onClick={() => setActiveTab(tab)} 
            disabled={saving} 
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Active Calculator */}
      {renderActiveCalculator()}
    </div>
  );
}