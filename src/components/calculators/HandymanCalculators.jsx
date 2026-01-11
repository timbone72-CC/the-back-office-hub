// Components/calculators/HandymanCalculators.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

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
      <CardHeader>
        <CardTitle>Framing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Wall Length (ft)</Label>
            <Input
              type="number"
              value={inputs.length}
              onChange={(e) => setInputs({ ...inputs, length: e.target.value })}
            />
          </div>
          <div>
            <Label>Stud Spacing (in)</Label>
            <Input
              type="number"
              value={inputs.spacing}
              onChange={(e) => setInputs({ ...inputs, spacing: e.target.value })}
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>
            <SaveToEstimatePanel
              description={results.description}
              quantity={results.qty}
              unitLabel="Price per Stud ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

  return (
    <div>
      {/* tabs + selector */}
      <FramingCalculator onSave={handleSaveItem} />
    </div>
  );
}

// --- CONCRETE CALCULATOR ---
function ConcreteCalculator({ onSave }) {
  const [inputs, setInputs] = useState({
    length: '',
    width: '',
    depth: '4',
  });

  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const d = parseFloat(inputs.depth);

    if (!l || !w || !d) return;

    const cubicFeet = l * w * (d / 12);
    const bags80lb = Math.ceil(cubicFeet / 0.6);

    setResults({
      bags: bags80lb,
      description: `Concrete Slab: ${l}' × ${w}' × ${d}"`,
      message: `Volume: ${cubicFeet.toFixed(2)} cu ft | 80lb Bags: ${bags80lb}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concrete</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Length (ft)</Label>
            <Input
              type="number"
              value={inputs.length}
              onChange={(e) =>
                setInputs({ ...inputs, length: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Width (ft)</Label>
            <Input
              type="number"
              value={inputs.width}
              onChange={(e) =>
                setInputs({ ...inputs, width: e.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <Label>Depth (in)</Label>
            <Input
              type="number"
              value={inputs.depth}
              onChange={(e) =>
                setInputs({ ...inputs, depth: e.target.value })
              }
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>

            <SaveToEstimatePanel
              description={results.description}
              quantity={results.bags}
              unitLabel="Price per 80lb Bag ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- DRYWALL CALCULATOR ---
function DrywallCalculator({ onSave }) {
  const [inputs, setInputs] = useState({
    length: '',
    width: '',
    height: '8',
  });

  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const h = parseFloat(inputs.height);

    if (!l || !w || !h) return;

    const wallArea = 2 * (l + w) * h;
    const ceilingArea = l * w;
    const totalArea = wallArea + ceilingArea;

    const sheets4x8 = Math.ceil(totalArea / 32);

    setResults({
      sheets: sheets4x8,
      description: `Drywall: ${l}' × ${w}' room`,
      message: `Total Area: ${Math.round(
        totalArea
      )} sq ft | 4×8 Sheets: ${sheets4x8}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drywall</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Length (ft)</Label>
            <Input
              type="number"
              value={inputs.length}
              onChange={(e) =>
                setInputs({ ...inputs, length: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Width (ft)</Label>
            <Input
              type="number"
              value={inputs.width}
              onChange={(e) =>
                setInputs({ ...inputs, width: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Height (ft)</Label>
            <Input
              type="number"
              value={inputs.height}
              onChange={(e) =>
                setInputs({ ...inputs, height: e.target.value })
              }
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>

            <SaveToEstimatePanel
              description={results.description}
              quantity={results.sheets}
              unitLabel="Price per Sheet ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- PAINT CALCULATOR ---
function PaintCalculator({ onSave }) {
  const [inputs, setInputs] = useState({
    length: '',
    width: '',
    height: '8',
    coats: '1',
  });

  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    const h = parseFloat(inputs.height);
    const coats = parseInt(inputs.coats);

    if (!l || !w || !h || !coats) return;

    const wallArea = 2 * (l + w) * h;
    const coverage = 350;
    const gallons = Math.ceil((wallArea * coats) / coverage);

    setResults({
      gallons,
      description: `Paint: ${l}' × ${w}' room (${coats} coat${coats > 1 ? 's' : ''})`,
      message: `Wall Area: ${Math.round(wallArea)} sq ft | Paint Needed: ${gallons} gal`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paint</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Length (ft)</Label>
            <Input
              type="number"
              value={inputs.length}
              onChange={(e) => setInputs({ ...inputs, length: e.target.value })}
            />
          </div>

          <div>
            <Label>Width (ft)</Label>
            <Input
              type="number"
              value={inputs.width}
              onChange={(e) => setInputs({ ...inputs, width: e.target.value })}
            />
          </div>

          <div>
            <Label>Height (ft)</Label>
            <Input
              type="number"
              value={inputs.height}
              onChange={(e) => setInputs({ ...inputs, height: e.target.value })}
            />
          </div>

          <div>
            <Label>Coats</Label>
            <select
              className="w-full h-10 px-3 border rounded-md"
              value={inputs.coats}
              onChange={(e) => setInputs({ ...inputs, coats: e.target.value })}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>

            <SaveToEstimatePanel
              description={results.description}
              quantity={results.gallons}
              unitLabel="Price per Gallon ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- TRIM CALCULATOR ---
function TrimCalculator({ onSave }) {
  const [inputs, setInputs] = useState({
    length: '',
    width: '',
  });

  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(inputs.length);
    const w = parseFloat(inputs.width);
    if (!l || !w) return;

    const perimeter = 2 * (l + w);
    const withWaste = Math.ceil(perimeter * 1.1);

    setResults({
      feet: withWaste,
      description: `Baseboard: ${l}' × ${w}' room`,
      message: `Perimeter: ${perimeter} ft | With 10% waste: ${withWaste} ft`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trim (Baseboard)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Length (ft)</Label>
            <Input
              type="number"
              value={inputs.length}
              onChange={(e) => setInputs({ ...inputs, length: e.target.value })}
            />
          </div>

          <div>
            <Label>Width (ft)</Label>
            <Input
              type="number"
              value={inputs.width}
              onChange={(e) => setInputs({ ...inputs, width: e.target.value })}
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          Calculate
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-bold text-green-800">{results.message}</p>

            <SaveToEstimatePanel
              description={results.description}
              quantity={results.feet}
              unitLabel="Price per Linear Foot ($)"
              onSave={onSave}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}