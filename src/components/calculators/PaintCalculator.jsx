import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function PaintCalculator() {
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [doors, setDoors] = useState('0');
  const [windows, setWindows] = useState('0');

  const calculate = () => {
    const l = parseFloat(length) || 0;
    const h = parseFloat(height) || 0;
    const d = parseFloat(doors) || 0;
    const w = parseFloat(windows) || 0;

    const totalWallArea = l * h;
    const deductions = (d * 21) + (w * 15); // Avg Door 21sqft, Window 15sqft
    const netArea = Math.max(0, totalWallArea - deductions);
    
    // Avg coverage 350 sqft per gallon
    const gallons = netArea / 350;
    
    return {
      netArea,
      gallons: gallons > 0 ? gallons.toFixed(2) : 0
    };
  };

  const result = calculate();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Wall Length (ft)</Label>
          <Input 
            type="number" 
            value={length} 
            onChange={(e) => setLength(e.target.value)} 
            placeholder="e.g. 12"
          />
        </div>
        <div className="space-y-2">
          <Label>Wall Height (ft)</Label>
          <Input 
            type="number" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
            placeholder="e.g. 8"
          />
        </div>
        <div className="space-y-2">
          <Label>Doors (count)</Label>
          <Input 
            type="number" 
            value={doors} 
            onChange={(e) => setDoors(e.target.value)} 
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Windows (count)</Label>
          <Input 
            type="number" 
            value={windows} 
            onChange={(e) => setWindows(e.target.value)} 
            placeholder="0"
          />
        </div>
      </div>
      
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Gallons Needed (1 Coat)</div>
            <div className="text-3xl font-bold text-indigo-600">{result.gallons}</div>
            <div className="text-xs text-slate-400 mt-2">
              Based on {result.netArea.toFixed(0)} sqft net area<br/>
              (350 sqft/gal coverage)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}