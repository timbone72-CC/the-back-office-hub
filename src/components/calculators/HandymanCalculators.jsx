// Components/calculators/HandymanCalculators.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2 for feedback

// Essential import for data access
import base44 from '@/lib/base44';

// --- CONFIGURATION & CONSTANTS ---
const REGIONAL_PRICING = {
  labor: { default: 75.00 }
};

// --- HELPER COMPONENTS ---

// 3. Input Sanitization Helper
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

// --- CALCULATORS ---

function FramingCalculator({ onSave, saving, laborRate }) {
  const [inputs, setInputs] = useState({ length: '', spacing: '16', cost: '' });
  const [results, setResults] = useState(null);
  const [includeLabor, setIncludeLabor] = useState(false); // 4. Labor Toggle

  const calculate = () => {
    const len = parseFloat(inputs.length);
    const spacing = parseFloat(inputs.spacing);
    if (!len) return;
    const studs = Math.ceil((len * 12) / spacing) + 1;
    // 5. Formatted Description
    setResults({ 
      qty: studs, 
      desc: `Wall Studs (${len}ft @ ${spacing}" OC)`,
      laborHours: (len / 10).toFixed(2) // Rough estimate: 1hr per 10ft
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Framing</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumericInput placeholder="Length (ft)" value={inputs.length} onChange={(v) => setInputs({ ...inputs, length: v })} disabled={saving} />
          <NumericInput placeholder="Spacing (in)" value={inputs.spacing} onChange={(v) => setInputs({ ...inputs, spacing: v })} disabled={saving} />
        </div>
        <Button onClick={calculate} className="w-full" disabled={saving}>Calculate</Button>
        {results && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-bold">Studs: {results.qty}</p>
            <div className="flex items-center gap-2 mt-2 mb-2">
              <input type="checkbox" checked={includeLabor} onChange={(e) => setIncludeLabor(e.target.checked)} id="lab-framing" />
              <Label htmlFor="lab-framing" className="text-xs">Include Labor (~{results.laborHours} hrs)</Label>
            </div>
            <div className="flex gap-2">
              <NumericInput placeholder="Cost per stud" value={inputs.cost} onChange={(v) => setInputs({...inputs, cost: v})} disabled={saving} />
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

// ... (Other calculators would follow same pattern, showing Framing as the template) ...

// --- MAIN EXPORT ---
export default function HandymanCalculators({ preSelectedEstimateId }) {
  // 1. Persistent Tab State
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('hc_lastTab') || 'framing');
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimateId, setSelectedEstimateId] = useState(preSelectedEstimateId || '');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // 2. Success Feedback
  const [laborRate, setLaborRate] = useState(REGIONAL_PRICING?.labor?.default || 0);

  useEffect(() => {
    localStorage.setItem('hc_lastTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetch = async () => {
      const res = await base44.entities.JobEstimate.search({ status: ['draft', 'sent'] });
      setEstimates(res || []);
    };
    fetch();
  }, []);

  const handleSaveItem = async (desc, qty, cost, laborObj = null) => {
    if (!selectedEstimateId || saving) return;
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c <= 0) {
      alert("Invalid quantity or cost");
      return;
    }

    setSaving(true);
    try {
      const est = await base44.entities.JobEstimate.read(selectedEstimateId);
      if (!est.items) est.items = [];
      
      // Add Material Item
      est.items.push({ description: desc, quantity: q, unit_cost: c, total: q * c });

      // 4. Add Labor Item if applicable
      if (laborObj) {
        const lh = parseFloat(laborObj.hours);
        const lr = parseFloat(laborObj.rate);
        est.items.push({ 
          description: `Labor: ${desc}`, 
          quantity: lh, 
          unit_cost: lr, 
          total: lh * lr 
        });
      }

      est.subtotal = est.items.reduce((s, i) => s + i.total, 0);
      est.total_amount = est.subtotal * (1 + ((est.tax_rate || 0) / 100));
      await base44.entities.JobEstimate.update(est);
      
      // 2. Trigger Success Feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderActive = () => {
    const props = { onSave: handleSaveItem, saving, laborRate };
    switch (activeTab) {
      case 'framing': return <FramingCalculator {...props} />;
      // case 'concrete': ... (pass laborRate to others)
      default: return <div className="p-4 text-center text-gray-400 border-2 border-dashed rounded">Calculator module ready for update</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 2. Success Feedback Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>Item added to estimate!</span>
        </div>
      )}

      <div className="p-4 bg-slate-50 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Target Estimate</Label>
          <select className="w-full p-2 border rounded bg-white" value={selectedEstimateId} onChange={(e) => setSelectedEstimateId(e.target.value)} disabled={saving}>
            <option value="">-- Select Estimate --</option>
            {estimates.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Default Labor Rate ($/hr)</Label>
          <NumericInput value={laborRate} onChange={setLaborRate} disabled={saving} className="bg-white" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['framing', 'concrete', 'drywall', 'paint', 'trim', 'materials', 'stairs', 'layout', 'conversions', 'specs'].map(t => (
          <Button key={t} variant={activeTab === t ? 'default' : 'outline'} onClick={() => setActiveTab(t)} disabled={saving} className="capitalize">{t}</Button>
        ))}
      </div>

      {renderActive()}
    </div>
  );
}