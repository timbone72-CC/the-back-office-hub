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

