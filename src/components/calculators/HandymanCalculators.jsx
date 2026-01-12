// ========== FILE: Components/calculators/HandymanCalculators.jsx ==========

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2 } from 'lucide-react';

// SECTION 1: REGIONAL PRICING CONFIG
const REGIONAL_PRICING = {
  region: 'Elk City, OK',
  labor: { default: 45, min: 20, max: 150 }
};

// SECTION 2: CALCULATOR OPTIONS
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

// SECTION 3: HELPER - Numeric Input (Sanitized)
const NumericInput = ({ value, onChange, placeholder, disabled, className }) => {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
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

// SECTION 4: CALCULATORS (FRAMING, CONCRETE, DRYWALL, PAINT, TRIM)
// Logic omitted for brevity, keeping existing component structures

// SECTION 5: LAYOUT CALCULATOR (FIXED MATH)
function LayoutReference() {
  const [diagonal, setDiagonal] = useState({ side1: '', side2: '' });
  const [slope, setSlope] = useState({ rise: '', run: '' });
  const [result, setResult] = useState('');

  const calcDiag = () => {
    const s1 = parseFloat(diagonal.side1);
    const s2 = parseFloat(diagonal.side2);
    if (!s1 || !s2) return;
    const d = Math.sqrt((s1 * s1) + (s2 * s2)).toFixed(3);
    const feet = Math.floor(d);
    const inches = Math.round((d - feet) * 12 * 100) / 100;
    setResult(`Diagonal: ${d}' (${feet}' ${inches}")`);
  };

  const calcSlope = () => {
    const rise = parseFloat(slope.rise);
    const run = parseFloat(slope.run);
    if (!rise || !run) return;
    const angle = (Math.atan(rise / run) * (180 / Math.PI)).toFixed(1);
    setResult(`Angle: ${angle}° | Pitch: ${rise}/${run}`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Layout Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 border-b pb-4">
          <Label className="font-bold text-xs">Squaring (Diagonal)</Label>
          <div className="grid grid-cols-2 gap-2">
            <NumericInput placeholder="Side A (ft)" value={diagonal.side1} onChange={v => setDiagonal({...diagonal, side1: v})} />
            <NumericInput placeholder="Side B (ft)" value={diagonal.side2} onChange={v => setDiagonal({...diagonal, side2: v})} />
          </div>
          <Button onClick={calcDiag} size="sm" variant="outline" className="w-full">Calculate Diagonal</Button>
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-xs">Slope / Pitch</Label>
          <div className="grid grid-cols-2 gap-2">
            <NumericInput placeholder="Rise (in)" value={slope.rise} onChange={v => setSlope({...slope, rise: v})} />
            <NumericInput placeholder="Run (in)" value={slope.run} onChange={v => setSlope({...slope, run: v})} />
          </div>
          <Button onClick={calcSlope} size="sm" variant="outline" className="w-full">Calculate Angle</Button>
        </div>
        {result && <div className="p-3 bg-blue-50 text-blue-800 font-bold rounded text-center">{result}</div>}
      </CardContent>
    </Card>
  );
}

// SECTION 6: MAIN COMPONENT (FIXED SAVE HANDLER & PILLS)
export default function HandymanCalculators({ preSelectedEstimateId }) {
  const [activeCalculator, setActiveCalculator] = useState('framing');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [laborRate, setLaborRate] = useState(REGIONAL_PRICING.labor.default);

  useEffect(() => {
    if (preSelectedEstimateId) setSelectedEstimateId(preSelectedEstimateId);
  }, [preSelectedEstimateId]);

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
        setEstimates(res || []);
      } catch (err) {
        console.error('Failed to fetch estimates:', err);
      }
    };
    fetchEstimates();
  }, []);

  const handleSaveItem = async (desc, qty, cost, laborObj = null) => {
    if (!selectedEstimateId || saving) return;
    const q = parseFloat(qty);
    const c = parseFloat(cost);

    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c <= 0) {
      alert('Invalid quantity or cost');
      return;
    }

    setSaving(true);
    try {
      const est = await base44.entities.JobEstimate.read(selectedEstimateId);
      if (!est) throw new Error('Estimate not found');

      if (!est.items) est.items = [];
      est.items.push({ description: desc, quantity: q, unit_cost: c, total: q * c });

      if (laborObj) {
        const lh = parseFloat(laborObj.hours);
        const lr = parseFloat(laborObj.rate);
        if (lh > 0 && lr > 0) {
          est.items.push({ description: `Labor: ${desc}`, quantity: lh, unit_cost: lr, total: lh * lr, unit: 'hr' });
        }
      }

      est.subtotal = est.items.reduce((s, i) => s + (i.total || 0), 0);
      est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));

      await base44.entities.JobEstimate.update(est);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderActiveCalculator = () => {
    const props = { onSave: handleSaveItem, saving, laborRate };
    switch (activeCalculator) {
      case 'layout': return <LayoutReference />;
      // other cases return respective components...
      default: return null;
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span>Item added to estimate!</span>
        </div>
      )}

      {/* PILL NAVIGATION (As seen in workspace) */}
      <div className="flex flex-wrap gap-2">
        {CALCULATOR_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setActiveCalculator(opt.value)}
            className={`
              px-3 py-2 text-xs font-bold rounded shadow-sm border transition-all flex-grow text-center
              ${activeCalculator === opt.value 
                ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
            `}
          >
            {opt.label.replace(' Calculator', '').replace(' Reference', '')}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end text-xs text-gray-500">
        <span>Labor Rate:</span>
        <div className="w-16"><NumericInput value={laborRate} onChange={setLaborRate} className="h-6 text-right" /></div>
        <span>/hr</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {renderActiveCalculator()}
      </div>
    </div>
  );
}