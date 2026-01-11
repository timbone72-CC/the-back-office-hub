// ========== FILE: Components/calculators/HandymanCalculators.jsx ==========

// ========== SECTION 1: IMPORTS ==========
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';  // ✅ Correct import
// ========== SECTION 2: REGIONAL PRICING CONFIG ==========
const REGIONAL_PRICING = {
  region: 'Elk City, OK',
  labor: { default: 45, min: 20, max: 150 }
};

// ========== SECTION 3: CALCULATOR OPTIONS ==========
const CALCULATOR_OPTIONS = [
  { value: 'framing', label: 'Framing Calculator' },
  { value: 'concrete', label: 'Concrete Calculator' },
  { value: 'drywall', label: 'Drywall Calculator' },
  { value: 'paint', label: 'Paint Calculator' },
  { value: 'trim', label: 'Trim Calculator' },
  { value: 'materials', label: 'Materials (General)' },
  { value: 'stairs', label: 'Stairs Calculator' },
  { value: 'layout', label: 'Layout Reference' },
  { value: 'conversions', label: 'Conversions Reference' },
  { value: 'specs', label: 'Specs Reference' }
];

// ========== SECTION 4: HELPER - Numeric Input (Sanitized) ==========
const NumericInput = ({ value, onChange, placeholder, disabled, className }) => {
  const handleChange = (e) => {
    const val = e.target.value;
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

// ========== SECTION 5: CALCULATOR - Framing ==========
function FramingCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', spacing: '16', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const spacing = parseFloat(inputs.spacing);
    if (!len || !spacing) return;
    const studs = Math.ceil((len * 12) / spacing) + 1;
    setResults({ 
      qty: studs, 
      desc: `Wall Studs (${len}ft @ ${spacing}" OC)`,
      laborHours: (len / 10).toFixed(2)
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
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
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={includeLabor} 
                onChange={(e) => setIncludeLabor(e.target.checked)} 
                id="labor-framing" 
              />
              <Label htmlFor="labor-framing" className="text-xs cursor-pointer">
                Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)
              </Label>
            </div>
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

// ========== SECTION 6: CALCULATOR - Concrete ==========
function ConcreteCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const d = parseFloat(inputs.depth);
    if (!l || !w || !d) return;
    const cubicFeet = l * w * (d / 12);
    const bags = Math.ceil(cubicFeet / 0.6);
    setResults({
      qty: bags,
      cubicFeet: cubicFeet.toFixed(2),
      desc: `Concrete 80lb Bags (${l}' × ${w}' × ${d}")`,
      laborHours: (bags * 0.15).toFixed(2)
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Concrete Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Length (ft)</Label>
            <NumericInput placeholder="Length" value={inputs.length} onChange={(v) => setInputs({ ...inputs, length: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Width (ft)</Label>
            <NumericInput placeholder="Width" value={inputs.width} onChange={(v) => setInputs({ ...inputs, width: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Depth (in)</Label>
            <NumericInput placeholder="Depth" value={inputs.depth} onChange={(v) => setInputs({ ...inputs, depth: v })} disabled={saving} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">80lb Bags Needed: {results.qty}</p>
            <p className="text-xs text-gray-500">Volume: {results.cubicFeet} cu ft</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-concrete" />
              <Label htmlFor="labor-concrete" className="text-xs cursor-pointer">Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)</Label>
            </div>
            <div className="flex gap-2">
              <NumericInput placeholder="Cost per bag" value={inputs.cost} onChange={(v) => setInputs({...inputs, cost: v})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost, includeLabor ? { hours: results.laborHours, rate: laborRate } : null)} disabled={saving || !inputs.cost}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== SECTION 7: CALCULATOR - Drywall ==========
function DrywallCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const h = parseFloat(inputs.height);
    if (!l || !w || !h) return;
    const wallSqft = 2 * (l + w) * h;
    const ceilingSqft = l * w;
    const totalSqft = wallSqft + ceilingSqft;
    const sheets = Math.ceil(totalSqft / 32);
    setResults({
      qty: sheets,
      sqft: totalSqft.toFixed(0),
      desc: `Drywall 4x8 Sheets (${l}' × ${w}' × ${h}' room)`,
      laborHours: (sheets * 0.5).toFixed(2)
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Drywall Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Length (ft)</Label>
            <NumericInput placeholder="Room length" value={inputs.length} onChange={(v) => setInputs({ ...inputs, length: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Width (ft)</Label>
            <NumericInput placeholder="Room width" value={inputs.width} onChange={(v) => setInputs({ ...inputs, width: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Height (ft)</Label>
            <NumericInput placeholder="Ceiling height" value={inputs.height} onChange={(v) => setInputs({ ...inputs, height: v })} disabled={saving} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Sheets Needed: {results.qty}</p>
            <p className="text-xs text-gray-500">Coverage: {results.sqft} sq ft</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-drywall" />
              <Label htmlFor="labor-drywall" className="text-xs cursor-pointer">Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)</Label>
            </div>
            <div className="flex gap-2">
              <NumericInput placeholder="Cost per sheet" value={inputs.cost} onChange={(v) => setInputs({...inputs, cost: v})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost, includeLabor ? { hours: results.laborHours, rate: laborRate } : null)} disabled={saving || !inputs.cost}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== SECTION 8: CALCULATOR - Paint ==========
function PaintCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ sqft: '', coats: '2', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const sqft = parseFloat(inputs.sqft);
    const coats = parseFloat(inputs.coats);
    if (!sqft || !coats) return;
    const gallons = Math.ceil((sqft * coats) / 350);
    setResults({
      qty: gallons,
      desc: `Paint Gallons (${sqft} sq ft, ${coats} coats)`,
      laborHours: (sqft / 150).toFixed(2)
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Paint Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Area (sq ft)</Label>
            <NumericInput placeholder="Square feet" value={inputs.sqft} onChange={(v) => setInputs({ ...inputs, sqft: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Coats</Label>
            <NumericInput placeholder="Number of coats" value={inputs.coats} onChange={(v) => setInputs({ ...inputs, coats: v })} disabled={saving} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Gallons Needed: {results.qty}</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-paint" />
              <Label htmlFor="labor-paint" className="text-xs cursor-pointer">Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)</Label>
            </div>
            <div className="flex gap-2">
              <NumericInput placeholder="Cost per gallon" value={inputs.cost} onChange={(v) => setInputs({...inputs, cost: v})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost, includeLabor ? { hours: results.laborHours, rate: laborRate } : null)} disabled={saving || !inputs.cost}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== SECTION 9: CALCULATOR - Trim ==========
function TrimCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', waste: '10', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const waste = parseFloat(inputs.waste);
    if (!len) return;
    const totalLF = Math.ceil(len * (1 + (waste || 0) / 100));
    setResults({
      qty: totalLF,
      desc: `Trim (${len} LF + ${waste}% waste)`,
      laborHours: (totalLF / 20).toFixed(2)
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Trim Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Linear Feet</Label>
            <NumericInput placeholder="Length needed" value={inputs.length} onChange={(v) => setInputs({ ...inputs, length: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Waste %</Label>
            <NumericInput placeholder="Waste factor" value={inputs.waste} onChange={(v) => setInputs({ ...inputs, waste: v })} disabled={saving} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded space-y-3">
            <p className="text-sm font-bold">Total Linear Feet: {results.qty}</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-trim" />
              <Label htmlFor="labor-trim" className="text-xs cursor-pointer">Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)</Label>
            </div>
            <div className="flex gap-2">
              <NumericInput placeholder="Cost per LF" value={inputs.cost} onChange={(v) => setInputs({...inputs, cost: v})} disabled={saving} />
              <Button onClick={() => onSave(results.desc, results.qty, inputs.cost, includeLabor ? { hours: results.laborHours, rate: laborRate } : null)} disabled={saving || !inputs.cost}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== SECTION 10: CALCULATOR - Materials (General) ==========
function MaterialsCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ qty: '', desc: '', cost: '' });
  const [includeLabor, setIncludeLabor] = useState(false);
  const [laborHours, setLaborHours] = useState('');

  const handleSave = () => {
    const q = parseFloat(inputs.qty);
    const c = parseFloat(inputs.cost);
    if (!q || !c || !inputs.desc.trim()) return;
    onSave(inputs.desc.trim(), q, inputs.cost, includeLabor && laborHours ? { hours: laborHours, rate: laborRate } : null);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Materials Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500">Description</Label>
          <Input placeholder="Material description" value={inputs.desc} onChange={(e) => setInputs({ ...inputs, desc: e.target.value })} disabled={saving} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Quantity</Label>
            <NumericInput placeholder="Qty" value={inputs.qty} onChange={(v) => setInputs({ ...inputs, qty: v })} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Unit Cost</Label>
            <NumericInput placeholder="Cost each" value={inputs.cost} onChange={(v) => setInputs({ ...inputs, cost: v })} disabled={saving} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-materials" />
          <Label htmlFor="labor-materials" className="text-xs cursor-pointer">Include Labor</Label>
          {includeLabor && (
            <NumericInput placeholder="Hours" value={laborHours} onChange={setLaborHours} disabled={saving} className="w-20" />
          )}
        </div>
        <Button onClick={handleSave} className="w-full" disabled={saving || !inputs.qty || !inputs.cost || !inputs.desc.trim()}>
          <Save className="w-4 h-4 mr-2" /> Save to Estimate
        </Button>
      </CardContent>
    </Card>
  );
}

// ========== SECTION 11: CALCULATOR - Stairs ==========
function StairsCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ rise: '', treadCost: '', riserCost: '', stringerCost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false);

  const calculate = () => {
    const totalRise = parseFloat(inputs.rise);
    if (!totalRise) return;
    const steps = Math.ceil(totalRise / 7.5);
    setResults({
      steps,
      treads: steps,
      risers: steps + 1,
      stringers: 3,
      desc: `Staircase (${totalRise}" rise, ${steps} steps)`,
      laborHours: (steps * 0.75).toFixed(2)
    });
  };

  const handleSave = () => {
    if (!results) return;
    if (inputs.treadCost) onSave(`Stair Treads (${results.treads})`, results.treads, inputs.treadCost, null);
    if (inputs.riserCost) onSave(`Stair Risers (${results.risers})`, results.risers, inputs.riserCost, null);
    if (inputs.stringerCost) onSave(`Stair Stringers (${results.stringers})`, results.stringers, inputs.stringerCost, null);
    if (includeLabor) onSave(`Labor: ${results.desc}`, parseFloat(results.laborHours), laborRate.toString(), null);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Stairs Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500">Total Rise (inches)</Label>
          <NumericInput placeholder="Floor to floor height" value={inputs.rise} onChange={(v) => setInputs({ ...inputs, rise: v })} disabled={saving} />
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
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="labor-stairs" />
              <Label htmlFor="labor-stairs" className="text-xs cursor-pointer">Include Labor (~{results.laborHours} hrs @ ${laborRate}/hr)</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-gray-500">Tread $</Label>
                <NumericInput placeholder="Each" value={inputs.treadCost} onChange={(v) => setInputs({...inputs, treadCost: v})} disabled={saving} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Riser $</Label>
                <NumericInput placeholder="Each" value={inputs.riserCost} onChange={(v) => setInputs({...inputs, riserCost: v})} disabled={saving} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Stringer $</Label>
                <NumericInput placeholder="Each" value={inputs.stringerCost} onChange={(v) => setInputs({...inputs, stringerCost: v})} disabled={saving} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving || (!inputs.treadCost && !inputs.riserCost && !inputs.stringerCost)}>
              <Save className="w-4 h-4 mr-2" /> Save All to Estimate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== SECTION 12: STATIC - Layout Reference ==========
function LayoutReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Layout Reference</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="font-bold">3-4-5 Triangle Method</p>
          <p className="text-gray-600">For square corners: 3ft on one side, 4ft on the other. Diagonal = 5ft exactly.</p>
        </div>
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="font-bold">Stud Layout</p>
          <p className="text-gray-600">16" OC: 0", 16", 32", 48"...</p>
          <p className="text-gray-600">24" OC: 0", 24", 48", 72"...</p>
        </div>
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="font-bold">Door Rough Openings</p>
          <p className="text-gray-600">Width + 2", Height + 2.5"</p>
        </div>
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="font-bold">Window Rough Openings</p>
          <p className="text-gray-600">Window size + ½" each side</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== SECTION 13: STATIC - Conversions Reference ==========
function ConversionsReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Conversions Reference</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="font-bold">Length</p>
          <p className="text-gray-600">1 foot = 12 inches | 1 yard = 3 feet | 1 meter = 3.281 feet</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="font-bold">Area</p>
          <p className="text-gray-600">1 sq yard = 9 sq feet | 1 acre = 43,560 sq feet</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="font-bold">Volume</p>
          <p className="text-gray-600">1 cubic yard = 27 cubic feet | 1 cubic foot = 7.48 gallons</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="font-bold">Weight</p>
          <p className="text-gray-600">Concrete: ~150 lbs/cu ft | Drywall ½": ~1.6 lbs/sq ft</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== SECTION 14: STATIC - Specs Reference ==========
function SpecsReference() {
  return (
    <Card>
      <CardHeader><CardTitle>Common Specs Reference</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="font-bold">Lumber (Actual)</p>
          <p className="text-gray-600">2×4 = 1.5"×3.5" | 2×6 = 1.5"×5.5" | 2×8 = 1.5"×7.25"</p>
        </div>
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="font-bold">Drywall</p>
          <p className="text-gray-600">4×8 = 32 sq ft | 4×12 = 48 sq ft</p>
        </div>
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="font-bold">Paint Coverage</p>
          <p className="text-gray-600">Interior: 350-400 sq ft/gal | Exterior: 250-350 sq ft/gal</p>
        </div>
        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="font-bold">Stair Code</p>
          <p className="text-gray-600">Max rise: 7.75" | Min run: 10" | Min width: 36"</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== SECTION 15: MAIN COMPONENT EXPORT ==========
export default function HandymanCalculators({ preSelectedEstimateId }) {
  const [activeCalculator, setActiveCalculator] = useState('framing');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [laborRate, setLaborRate] = useState(REGIONAL_PRICING.labor.default);

  // ========== Effect: Fetch estimates using global base44 ==========
  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        // Access base44 from global scope (injected by Base44 runtime)
        if (typeof base44 === 'undefined' || !base44.entities?.JobEstimate) {
          console.error('base44.entities.JobEstimate not available');
          return;
        }
        const res = await base44.entities.JobEstimate.list();
        const filtered = (res || []).filter(e => 
          e.status === 'draft' || e.status === 'sent'
        );
        setEstimates(filtered);
      } catch (err) {
        console.error('Failed to fetch estimates:', err);
        setEstimates([]);
      }
    };
    fetchEstimates();
  }, []);

// ========== Handler: Save item to selected estimate ==========
const handleSaveItem = async (desc, qty, cost, laborObj = null) => {
  if (!selectedEstimateId) {
    alert('Please select an estimate first');
    return;
  }
  if (saving) return;

  const q = parseFloat(qty);
  const c = parseFloat(cost);
  if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c <= 0) {
    alert('Invalid quantity or cost');
    return;
  }

  setSaving(true);
  try {
    // FETCH: Use .filter() to get the estimate
    const res = await base44.entities.JobEstimate.filter({ _id: selectedEstimateId });
    const est = res && res.length > 0 ? res[0] : null;
    
    if (!est) {
      alert('Estimate not found');
      setSaving(false);
      return;
    }

    // Ensure items array exists
    if (!est.items) est.items = [];

    // Add material item
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
    est.subtotal = est.items.reduce((sum, item) => sum + (item.total || 0), 0);
    est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));

    // UPDATE: Use .update(id, data) pattern
    await base44.entities.JobEstimate.update(selectedEstimateId, est);

    // Show success feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  } catch (err) {
    alert('Error saving: ' + err.message);
  } finally {
    setSaving(false);
  }
};

  // ========== Renderer: Active calculator ==========
  const renderActiveCalculator = () => {
    const props = { onSave: handleSaveItem, saving, laborRate };
    switch (activeCalculator) {
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

  // ========== Render: Main UI ==========
  return (
    <div className="space-y-4">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span>Item added to estimate!</span>
        </div>
      )}

      {/* Header: Estimate Selector + Labor Rate */}
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estimate Selector */}
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

          {/* Calculator Selector (Dropdown) */}
          <div className="space-y-2">
            <Label>Calculator</Label>
            <select 
              className="w-full p-2 border rounded bg-white" 
              value={activeCalculator} 
              onChange={(e) => setActiveCalculator(e.target.value)} 
              disabled={saving}
            >
              {CALCULATOR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Labor Rate */}
          <div className="space-y-2">
            <Label>Labor Rate — {REGIONAL_PRICING.region}</Label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">$</span>
              <NumericInput 
                value={laborRate} 
                onChange={(v) => setLaborRate(parseFloat(v) || REGIONAL_PRICING.labor.default)} 
                disabled={saving} 
                className="bg-white" 
              />
              <span className="text-gray-500">/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Calculator */}
      {renderActiveCalculator()}
    </div>
  );
}