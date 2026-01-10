import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, Ruler, BookOpen, PaintBucket, Hammer, ArrowUpDown, Box, Package, Frame, Triangle, ArrowRightLeft, FileText } from 'lucide-react';

// Framing Calculator
function FramingCalculator() {
  const [studInputs, setStudInputs] = useState({ wallLength: '', studSpacing: '16' });
  const [rafterInputs, setRafterInputs] = useState({ span: '', pitch: '4' });
  const [headerInputs, setHeaderInputs] = useState({ span: '', load: 'bearing' });
  const [results, setResults] = useState(null);

  const calculateStuds = () => {
    const wallLength = parseFloat(studInputs.wallLength);
    const spacing = parseFloat(studInputs.studSpacing);
    
    if (!wallLength || !spacing) {
      setResults({ type: 'studs', message: 'Please enter wall length and spacing' });
      return;
    }
    
    const wallLengthInches = wallLength * 12;
    const studs = Math.ceil(wallLengthInches / spacing) + 1;
    const plates = Math.ceil(wallLength / 8) * 3; // top, bottom, double top
    const totalLinearFeet = (studs * 8) + (wallLength * 3);
    
    setResults({ 
      type: 'studs', 
      studs,
      plates,
      totalLinearFeet: Math.round(totalLinearFeet),
      message: `Studs needed: ${studs} | Plate boards: ${plates} | Total linear feet: ${Math.round(totalLinearFeet)} ft`
    });
  };

  const calculateRafters = () => {
    const span = parseFloat(rafterInputs.span);
    const pitch = parseFloat(rafterInputs.pitch);
    
    if (!span || !pitch) {
      setResults({ type: 'rafters', message: 'Please enter span and pitch' });
      return;
    }
    
    const run = span / 2;
    const rise = (run * pitch) / 12;
    const rafterLength = Math.sqrt((run * run) + (rise * rise));
    const pitchAngle = Math.atan(pitch / 12) * (180 / Math.PI);
    
    setResults({ 
      type: 'rafters', 
      run: Math.round(run * 10) / 10,
      rise: Math.round(rise * 10) / 10,
      rafterLength: Math.round(rafterLength * 10) / 10,
      pitchAngle: Math.round(pitchAngle * 10) / 10,
      message: `Run: ${Math.round(run * 10) / 10} ft | Rise: ${Math.round(rise * 10) / 10} ft | Rafter length: ${Math.round(rafterLength * 10) / 10} ft | Pitch angle: ${Math.round(pitchAngle * 10) / 10}°`
    });
  };

  const calculateHeader = () => {
    const span = parseFloat(headerInputs.span);
    const isBearing = headerInputs.load === 'bearing';
    
    if (!span) {
      setResults({ type: 'header', message: 'Please enter span' });
      return;
    }
    
    let headerSize = "";
    let jackStuds = 1;
    
    if (!isBearing) {
      if (span <= 4) headerSize = "2x4 flat or 2x6";
      else if (span <= 6) headerSize = "2x6 or 2x8";
      else headerSize = "2x8 or 2x10";
    } else {
      if (span <= 4) { headerSize = "2x6 or doubled 2x4"; jackStuds = 1; }
      else if (span <= 6) { headerSize = "2x8 or doubled 2x6"; jackStuds = 1; }
      else if (span <= 8) { headerSize = "2x10 or doubled 2x8"; jackStuds = 2; }
      else if (span <= 10) { headerSize = "2x12 or doubled 2x10"; jackStuds = 2; }
      else { headerSize = "LVL or engineered beam required"; jackStuds = 2; }
    }
    
    setResults({ 
      type: 'header', 
      headerSize,
      jackStuds,
      message: `Recommended: ${headerSize} | Jack studs each side: ${jackStuds}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Framing Calculators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Stud Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Wall Length (ft)</Label>
              <Input type="number" value={studInputs.wallLength} onChange={(e) => setStudInputs({...studInputs, wallLength: e.target.value})} placeholder="e.g., 20" />
            </div>
            <div>
              <Label>Stud Spacing (in)</Label>
              <Input type="number" value={studInputs.studSpacing} onChange={(e) => setStudInputs({...studInputs, studSpacing: e.target.value})} placeholder="16 or 24" />
            </div>
          </div>
          <Button onClick={calculateStuds} className="w-full">Calculate Studs</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Rafter Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Building Width/Span (ft)</Label>
              <Input type="number" value={rafterInputs.span} onChange={(e) => setRafterInputs({...rafterInputs, span: e.target.value})} placeholder="e.g., 24" />
            </div>
            <div>
              <Label>Pitch (rise per 12" run)</Label>
              <Input type="number" value={rafterInputs.pitch} onChange={(e) => setRafterInputs({...rafterInputs, pitch: e.target.value})} placeholder="e.g., 4, 6, 8" />
            </div>
          </div>
          <Button onClick={calculateRafters} className="w-full">Calculate Rafters</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Header Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Span (ft)</Label>
              <Input type="number" value={headerInputs.span} onChange={(e) => setHeaderInputs({...headerInputs, span: e.target.value})} placeholder="Opening width" />
            </div>
            <div>
              <Label>Load Type</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={headerInputs.load} 
                onChange={(e) => setHeaderInputs({...headerInputs, load: e.target.value})}
              >
                <option value="bearing">Load Bearing</option>
                <option value="non-bearing">Non-Bearing</option>
              </select>
            </div>
          </div>
          <Button onClick={calculateHeader} className="w-full">Calculate Header</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stairs Calculator
function StairsCalculator() {
  const [inputs, setInputs] = useState({ totalRise: '', totalRun: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const totalRise = parseFloat(inputs.totalRise);
    const desiredRun = inputs.totalRun ? parseFloat(inputs.totalRun) : null;
    
    if (!totalRise) {
      setResults({ message: 'Please enter total rise' });
      return;
    }
    
    const maxRiser = 7.75;
    const minRiser = 6;
    
    // Calculate ideal number of risers
    let numRisers = Math.round(totalRise / 7.5);
    let riserHeight = totalRise / numRisers;
    
    // Adjust if out of range
    if (riserHeight > maxRiser) {
      numRisers = Math.ceil(totalRise / maxRiser);
      riserHeight = totalRise / numRisers;
    }
    
    const numTreads = numRisers - 1;
    
    // Tread depth: 10" minimum, or use rule (riser + tread ≈ 17.5")
    const treadDepth = desiredRun ? 
      (desiredRun / numTreads) : 
      Math.max(10, 17.5 - riserHeight);
    
    const totalRun = treadDepth * numTreads;
    
    // Stringer length (hypotenuse)
    const stringerLength = Math.sqrt((totalRise * totalRise) + (totalRun * totalRun));
    
    const meetsCode = riserHeight <= maxRiser && riserHeight >= minRiser && treadDepth >= 10;
    
    setResults({ 
      numRisers,
      numTreads,
      riserHeight: Math.round(riserHeight * 100) / 100,
      treadDepth: Math.round(treadDepth * 100) / 100,
      totalRun: Math.round(totalRun * 100) / 100,
      stringerLength: Math.round(stringerLength * 100) / 100,
      stringerLengthFeet: Math.round((stringerLength / 12) * 10) / 10,
      meetsCode,
      message: `Risers: ${numRisers} @ ${Math.round(riserHeight * 100) / 100}" | Treads: ${numTreads} @ ${Math.round(treadDepth * 100) / 100}" | Total run: ${Math.round(totalRun * 100) / 100}" | Stringer: ${Math.round((stringerLength / 12) * 10) / 10} ft | ${meetsCode ? '✓ Meets IRC Code' : '✗ Check code compliance'}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stairs Calculator</CardTitle>
        <p className="text-sm text-slate-500">IRC: Max riser 7¾", Min tread 10"</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Total Rise (inches) *</Label>
          <Input type="number" value={inputs.totalRise} onChange={(e) => setInputs({...inputs, totalRise: e.target.value})} placeholder="Floor to floor height (e.g., 108)" />
        </div>
        <div>
          <Label>Total Run (inches) - Optional</Label>
          <Input type="number" value={inputs.totalRun} onChange={(e) => setInputs({...inputs, totalRun: e.target.value})} placeholder="Leave blank for auto-calculate" />
        </div>
        <Button onClick={calculate} className="w-full">Calculate Stairs</Button>
        
        {results && (
          <div className={`mt-4 p-4 rounded-lg ${results.meetsCode ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <h4 className={`font-semibold mb-2 ${results.meetsCode ? 'text-green-800' : 'text-yellow-800'}`}>Results:</h4>
            <p className={`text-sm ${results.meetsCode ? 'text-green-700' : 'text-yellow-700'}`}>{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Concrete Calculator
function ConcreteCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '4' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const length = parseFloat(inputs.length);
    const width = parseFloat(inputs.width);
    const depthInches = parseFloat(inputs.depth);
    
    if (!length || !width || !depthInches) {
      setResults({ message: 'Please enter all dimensions' });
      return;
    }
    
    const depthFeet = depthInches / 12;
    const cubicFeet = length * width * depthFeet;
    const cubicYards = cubicFeet / 27;
    const cubicYardsWithWaste = cubicYards * 1.1;
    
    // Bag calculations
    const bags60lb = Math.ceil(cubicFeet / 0.45);
    const bags80lb = Math.ceil(cubicFeet / 0.6);
    
    setResults({ 
      squareFeet: length * width,
      cubicFeet: Math.round(cubicFeet * 100) / 100,
      cubicYards: Math.round(cubicYards * 100) / 100,
      cubicYardsWithWaste: Math.round(cubicYardsWithWaste * 100) / 100,
      bags60lb,
      bags80lb,
      message: `Area: ${length * width} sq ft | Volume: ${Math.round(cubicFeet * 100) / 100} cu ft (${Math.round(cubicYards * 100) / 100} cu yd) | With 10% waste: ${Math.round(cubicYardsWithWaste * 100) / 100} cu yd | Bags: ${bags60lb} (60lb) or ${bags80lb} (80lb)`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concrete Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Length (ft)</Label>
          <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} placeholder="e.g., 20" />
        </div>
        <div>
          <Label>Width (ft)</Label>
          <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} placeholder="e.g., 10" />
        </div>
        <div>
          <Label>Depth (inches)</Label>
          <Input type="number" value={inputs.depth} onChange={(e) => setInputs({...inputs, depth: e.target.value})} placeholder="e.g., 4" />
        </div>
        <Button onClick={calculate} className="w-full">Calculate Concrete</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Materials Calculator
function MaterialsCalculator() {
  const [boardFeet, setBoardFeet] = useState({ length: '', width: '', thickness: '1', quantity: '1' });
  const [roofing, setRoofing] = useState({ length: '', width: '', pitch: '4' });
  const [decking, setDecking] = useState({ length: '', width: '', boardWidth: '5.5', gap: '0.25' });
  const [results, setResults] = useState(null);

  const pitchMultipliers = {
    0: 1.000, 1: 1.003, 2: 1.014, 3: 1.031, 4: 1.054,
    5: 1.083, 6: 1.118, 7: 1.158, 8: 1.202, 9: 1.250,
    10: 1.302, 11: 1.357, 12: 1.414
  };

  const calculateBoardFeet = () => {
    const length = parseFloat(boardFeet.length);
    const width = parseFloat(boardFeet.width);
    const thickness = parseFloat(boardFeet.thickness);
    const quantity = parseFloat(boardFeet.quantity) || 1;
    
    if (!length || !width || !thickness) {
      setResults({ type: 'boardFeet', message: 'Please enter all dimensions' });
      return;
    }
    
    const bfEach = (thickness * width * length) / 12;
    const totalBF = bfEach * quantity;
    
    setResults({ 
      type: 'boardFeet', 
      bfEach: Math.round(bfEach * 100) / 100,
      totalBF: Math.round(totalBF * 100) / 100,
      message: `Board feet each: ${Math.round(bfEach * 100) / 100} BF | Total: ${Math.round(totalBF * 100) / 100} BF`
    });
  };

  const calculateRoofing = () => {
    const length = parseFloat(roofing.length);
    const width = parseFloat(roofing.width);
    const pitch = parseInt(roofing.pitch);
    
    if (!length || !width) {
      setResults({ type: 'roofing', message: 'Please enter dimensions' });
      return;
    }
    
    const flatArea = length * width;
    const multiplier = pitchMultipliers[pitch] || 1.054;
    const actualArea = flatArea * multiplier;
    const squares = actualArea / 100;
    const bundles = Math.ceil(squares * 3);
    const bundlesWithWaste = Math.ceil(bundles * 1.1);
    
    setResults({ 
      type: 'roofing', 
      flatArea,
      actualArea: Math.round(actualArea),
      squares: Math.round(squares * 10) / 10,
      bundles,
      bundlesWithWaste,
      message: `Flat area: ${flatArea} sq ft | Actual area: ${Math.round(actualArea)} sq ft | Squares: ${Math.round(squares * 10) / 10} | Bundles: ${bundles} (with waste: ${bundlesWithWaste})`
    });
  };

  const calculateDecking = () => {
    const length = parseFloat(decking.length);
    const width = parseFloat(decking.width);
    const boardWidth = parseFloat(decking.boardWidth);
    const gap = parseFloat(decking.gap);
    
    if (!length || !width) {
      setResults({ type: 'decking', message: 'Please enter dimensions' });
      return;
    }
    
    const deckArea = length * width;
    const boardWidthFeet = (boardWidth + gap) / 12;
    const numBoards = Math.ceil(width / boardWidthFeet);
    const totalLinearFeet = numBoards * length;
    
    setResults({ 
      type: 'decking', 
      deckArea,
      numBoards,
      totalLinearFeet: Math.round(totalLinearFeet),
      boards8ft: Math.ceil(totalLinearFeet / 8),
      boards12ft: Math.ceil(totalLinearFeet / 12),
      boards16ft: Math.ceil(totalLinearFeet / 16),
      message: `Area: ${deckArea} sq ft | Boards needed: ${numBoards} | Linear feet: ${Math.round(totalLinearFeet)} | 8' boards: ${Math.ceil(totalLinearFeet / 8)} | 12' boards: ${Math.ceil(totalLinearFeet / 12)} | 16' boards: ${Math.ceil(totalLinearFeet / 16)}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials Estimator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Board Feet Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Length (ft)</Label>
              <Input type="number" value={boardFeet.length} onChange={(e) => setBoardFeet({...boardFeet, length: e.target.value})} placeholder="e.g., 8" />
            </div>
            <div>
              <Label>Width (in)</Label>
              <Input type="number" value={boardFeet.width} onChange={(e) => setBoardFeet({...boardFeet, width: e.target.value})} placeholder="e.g., 6" />
            </div>
            <div>
              <Label>Thickness (in)</Label>
              <Input type="number" value={boardFeet.thickness} onChange={(e) => setBoardFeet({...boardFeet, thickness: e.target.value})} placeholder="e.g., 1" />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={boardFeet.quantity} onChange={(e) => setBoardFeet({...boardFeet, quantity: e.target.value})} placeholder="e.g., 10" />
            </div>
          </div>
          <Button onClick={calculateBoardFeet} className="w-full">Calculate Board Feet</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Roofing Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Roof Length (ft)</Label>
              <Input type="number" value={roofing.length} onChange={(e) => setRoofing({...roofing, length: e.target.value})} placeholder="e.g., 40" />
            </div>
            <div>
              <Label>Roof Width (ft)</Label>
              <Input type="number" value={roofing.width} onChange={(e) => setRoofing({...roofing, width: e.target.value})} placeholder="e.g., 30" />
            </div>
            <div className="col-span-2">
              <Label>Pitch (rise per 12" run)</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={roofing.pitch} 
                onChange={(e) => setRoofing({...roofing, pitch: e.target.value})}
              >
                {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                  <option key={p} value={p}>{p}/12</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={calculateRoofing} className="w-full">Calculate Roofing</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Decking Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deck Length (ft)</Label>
              <Input type="number" value={decking.length} onChange={(e) => setDecking({...decking, length: e.target.value})} placeholder="e.g., 16" />
            </div>
            <div>
              <Label>Deck Width (ft)</Label>
              <Input type="number" value={decking.width} onChange={(e) => setDecking({...decking, width: e.target.value})} placeholder="e.g., 12" />
            </div>
            <div>
              <Label>Board Width (in)</Label>
              <Input type="number" value={decking.boardWidth} onChange={(e) => setDecking({...decking, boardWidth: e.target.value})} placeholder="5.5" />
            </div>
            <div>
              <Label>Gap (in)</Label>
              <Input type="number" value={decking.gap} onChange={(e) => setDecking({...decking, gap: e.target.value})} placeholder="0.25" />
            </div>
          </div>
          <Button onClick={calculateDecking} className="w-full">Calculate Decking</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Drywall Calculator
function DrywallCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', doors: '0', windows: '0' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const length = parseFloat(inputs.length);
    const width = parseFloat(inputs.width);
    const height = parseFloat(inputs.height);
    const doors = parseInt(inputs.doors) || 0;
    const windows = parseInt(inputs.windows) || 0;
    
    if (!length || !width || !height) {
      setResults({ message: 'Please enter room dimensions' });
      return;
    }
    
    const wallArea = 2 * (length + width) * height;
    const ceilingArea = length * width;
    const openingArea = (doors * 21) + (windows * 15);
    const netWallArea = wallArea - openingArea;
    const totalArea = netWallArea + ceilingArea;
    
    const sheets4x8 = Math.ceil(totalArea / 32);
    const sheets4x12 = Math.ceil(totalArea / 48);
    const tapeRolls = Math.ceil(totalArea / 500);
    const mudGallons = Math.ceil(totalArea / 100);
    const screwsLbs = Math.ceil(totalArea / 100);
    
    setResults({ 
      wallArea: Math.round(netWallArea),
      ceilingArea,
      totalArea: Math.round(totalArea),
      sheets4x8,
      sheets4x12,
      tapeRolls,
      mudGallons,
      screwsLbs,
      message: `Wall area: ${Math.round(netWallArea)} sq ft | Ceiling: ${ceilingArea} sq ft | Total: ${Math.round(totalArea)} sq ft | 4x8 sheets: ${sheets4x8} | 4x12 sheets: ${sheets4x12} | Tape: ${tapeRolls} rolls | Mud: ${mudGallons} gal | Screws: ${screwsLbs} lbs`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drywall Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Room Length (ft)</Label>
            <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} placeholder="e.g., 12" />
          </div>
          <div>
            <Label>Room Width (ft)</Label>
            <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} placeholder="e.g., 10" />
          </div>
          <div>
            <Label>Ceiling Height (ft)</Label>
            <Input type="number" value={inputs.height} onChange={(e) => setInputs({...inputs, height: e.target.value})} placeholder="8" />
          </div>
          <div>
            <Label>Number of Doors</Label>
            <Input type="number" value={inputs.doors} onChange={(e) => setInputs({...inputs, doors: e.target.value})} placeholder="0" />
          </div>
          <div>
            <Label>Number of Windows</Label>
            <Input type="number" value={inputs.windows} onChange={(e) => setInputs({...inputs, windows: e.target.value})} placeholder="0" />
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate Drywall</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Paint Calculator
function PaintCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '8', doors: '0', windows: '0', coats: '2' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    const length = parseFloat(inputs.length);
    const width = parseFloat(inputs.width);
    const height = parseFloat(inputs.height);
    const doors = parseInt(inputs.doors) || 0;
    const windows = parseInt(inputs.windows) || 0;
    const coats = parseInt(inputs.coats) || 2;
    
    if (!length || !width || !height) {
      setResults({ message: 'Please enter room dimensions' });
      return;
    }
    
    const wallArea = 2 * (length + width) * height;
    const ceilingArea = length * width;
    const openingArea = (doors * 21) + (windows * 15);
    const netWallArea = wallArea - openingArea;
    const coveragePerGallon = 350;
    
    const wallGallons = Math.ceil((netWallArea * coats) / coveragePerGallon);
    const ceilingGallons = Math.ceil((ceilingArea * coats) / coveragePerGallon);
    const totalGallons = wallGallons + ceilingGallons;
    const primerGallons = Math.ceil((netWallArea + ceilingArea) / coveragePerGallon);
    
    setResults({ 
      wallArea: Math.round(netWallArea),
      ceilingArea,
      wallGallons,
      ceilingGallons,
      totalGallons,
      primerGallons,
      message: `Wall area: ${Math.round(netWallArea)} sq ft | Ceiling: ${ceilingArea} sq ft | Wall paint: ${wallGallons} gal | Ceiling paint: ${ceilingGallons} gal | Total paint: ${totalGallons} gal | Primer (1 coat): ${primerGallons} gal`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paint Calculator</CardTitle>
        <p className="text-sm text-slate-500">Coverage: ~350 sq ft per gallon</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Room Length (ft)</Label>
            <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} placeholder="e.g., 12" />
          </div>
          <div>
            <Label>Room Width (ft)</Label>
            <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} placeholder="e.g., 10" />
          </div>
          <div>
            <Label>Ceiling Height (ft)</Label>
            <Input type="number" value={inputs.height} onChange={(e) => setInputs({...inputs, height: e.target.value})} placeholder="8" />
          </div>
          <div>
            <Label>Number of Doors</Label>
            <Input type="number" value={inputs.doors} onChange={(e) => setInputs({...inputs, doors: e.target.value})} placeholder="0" />
          </div>
          <div>
            <Label>Number of Windows</Label>
            <Input type="number" value={inputs.windows} onChange={(e) => setInputs({...inputs, windows: e.target.value})} placeholder="0" />
          </div>
          <div>
            <Label>Number of Coats</Label>
            <select 
              className="w-full h-10 px-3 border rounded-md"
              value={inputs.coats} 
              onChange={(e) => setInputs({...inputs, coats: e.target.value})}
            >
              <option value="1">1 Coat</option>
              <option value="2">2 Coats</option>
              <option value="3">3 Coats</option>
            </select>
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate Paint</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trim Calculator
function TrimCalculator() {
  const [miter, setMiter] = useState({ angle: '90' });
  const [crown, setCrown] = useState({ roomLength: '', roomWidth: '', springAngle: '38' });
  const [baseboard, setBaseboard] = useState({ roomLength: '', roomWidth: '', doorCount: '1' });
  const [results, setResults] = useState(null);

  const calculateMiter = () => {
    const cornerAngle = parseFloat(miter.angle);
    
    if (!cornerAngle) {
      setResults({ type: 'miter', message: 'Please enter corner angle' });
      return;
    }
    
    const miterAngle = (180 - cornerAngle) / 2;
    
    setResults({ 
      type: 'miter',
      cornerAngle,
      miterAngle: Math.round(miterAngle * 10) / 10,
      message: `Corner angle: ${cornerAngle}° | Set miter saw to: ${Math.round(miterAngle * 10) / 10}°`
    });
  };

  const calculateCrown = () => {
    const length = parseFloat(crown.roomLength);
    const width = parseFloat(crown.roomWidth);
    const springAngle = parseInt(crown.springAngle);
    
    if (!length || !width) {
      setResults({ type: 'crown', message: 'Please enter room dimensions' });
      return;
    }
    
    const perimeter = 2 * (length + width);
    
    // Crown molding settings for 90° corners
    let miterSetting, bevelSetting;
    if (springAngle === 38) {
      miterSetting = 31.6;
      bevelSetting = 33.9;
    } else {
      miterSetting = 35.3;
      bevelSetting = 30;
    }
    
    setResults({ 
      type: 'crown',
      perimeter,
      linearFeetWithWaste: Math.round(perimeter * 1.1),
      miterSetting,
      bevelSetting,
      message: `Perimeter: ${perimeter} ft | With 10% waste: ${Math.round(perimeter * 1.1)} ft | For ${springAngle}° spring angle: Miter ${miterSetting}°, Bevel ${bevelSetting}°`
    });
  };

  const calculateBaseboard = () => {
    const length = parseFloat(baseboard.roomLength);
    const width = parseFloat(baseboard.roomWidth);
    const doors = parseInt(baseboard.doorCount) || 1;
    
    if (!length || !width) {
      setResults({ type: 'baseboard', message: 'Please enter room dimensions' });
      return;
    }
    
    const perimeter = 2 * (length + width);
    const doorOpenings = doors * 3; // 3ft door opening
    const linearFeet = perimeter - doorOpenings;
    
    setResults({ 
      type: 'baseboard',
      perimeter,
      linearFeet: Math.round(linearFeet),
      withWaste: Math.round(linearFeet * 1.1),
      pieces8ft: Math.ceil(linearFeet * 1.1 / 8),
      pieces12ft: Math.ceil(linearFeet * 1.1 / 12),
      message: `Perimeter: ${perimeter} ft | Minus doors: ${Math.round(linearFeet)} ft | With 10% waste: ${Math.round(linearFeet * 1.1)} ft | 8' pieces: ${Math.ceil(linearFeet * 1.1 / 8)} | 12' pieces: ${Math.ceil(linearFeet * 1.1 / 12)}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trim Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Miter Angle Calculator</h3>
          <div>
            <Label>Corner Angle (degrees)</Label>
            <Input type="number" value={miter.angle} onChange={(e) => setMiter({...miter, angle: e.target.value})} placeholder="90" />
          </div>
          <Button onClick={calculateMiter} className="w-full">Calculate Miter</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Crown Molding</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room Length (ft)</Label>
              <Input type="number" value={crown.roomLength} onChange={(e) => setCrown({...crown, roomLength: e.target.value})} placeholder="e.g., 12" />
            </div>
            <div>
              <Label>Room Width (ft)</Label>
              <Input type="number" value={crown.roomWidth} onChange={(e) => setCrown({...crown, roomWidth: e.target.value})} placeholder="e.g., 10" />
            </div>
            <div className="col-span-2">
              <Label>Spring Angle</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={crown.springAngle} 
                onChange={(e) => setCrown({...crown, springAngle: e.target.value})}
              >
                <option value="38">38° (most common)</option>
                <option value="45">45°</option>
              </select>
            </div>
          </div>
          <Button onClick={calculateCrown} className="w-full">Calculate Crown Molding</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Baseboard</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room Length (ft)</Label>
              <Input type="number" value={baseboard.roomLength} onChange={(e) => setBaseboard({...baseboard, roomLength: e.target.value})} placeholder="e.g., 12" />
            </div>
            <div>
              <Label>Room Width (ft)</Label>
              <Input type="number" value={baseboard.roomWidth} onChange={(e) => setBaseboard({...baseboard, roomWidth: e.target.value})} placeholder="e.g., 10" />
            </div>
            <div>
              <Label>Number of Doors</Label>
              <Input type="number" value={baseboard.doorCount} onChange={(e) => setBaseboard({...baseboard, doorCount: e.target.value})} placeholder="1" />
            </div>
          </div>
          <Button onClick={calculateBaseboard} className="w-full">Calculate Baseboard</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Layout Calculator
function LayoutCalculator() {
  const [diagonal, setDiagonal] = useState({ side1: '', side2: '' });
  const [squareCheck, setSquareCheck] = useState({ diag1: '', diag2: '' });
  const [slope, setSlope] = useState({ rise: '', run: '' });
  const [triangle, setTriangle] = useState({ unit: '1' });
  const [results, setResults] = useState(null);

  const calculateDiagonal = () => {
    const side1 = parseFloat(diagonal.side1);
    const side2 = parseFloat(diagonal.side2);
    
    if (!side1 || !side2) {
      setResults({ type: 'diagonal', message: 'Please enter both sides' });
      return;
    }
    
    const diag = Math.sqrt((side1 * side1) + (side2 * side2));
    const feet = Math.floor(diag);
    const remainingInches = (diag - feet) * 12;
    const inches = Math.floor(remainingInches);
    const sixteenths = Math.round((remainingInches - inches) * 16);
    
    setResults({ 
      type: 'diagonal',
      diagonalDecimal: Math.round(diag * 1000) / 1000,
      diagonalDisplay: `${feet}' ${inches} ${sixteenths}/16"`,
      message: `Diagonal: ${Math.round(diag * 1000) / 1000} ft (${feet}' ${inches} ${sixteenths}/16") | Measure both diagonals - if equal, it's square!`
    });
  };

  const checkSquare = () => {
    const d1 = parseFloat(squareCheck.diag1);
    const d2 = parseFloat(squareCheck.diag2);
    
    if (!d1 || !d2) {
      setResults({ type: 'squareCheck', message: 'Please enter both diagonal measurements' });
      return;
    }
    
    const diff = Math.abs(d1 - d2);
    const isSquare = diff < 0.125; // within 1/8"
    
    setResults({ 
      type: 'squareCheck',
      diff: Math.round(diff * 1000) / 1000,
      isSquare,
      message: isSquare 
        ? `✓ SQUARE! Difference: ${Math.round(diff * 1000) / 1000}" (within tolerance)`
        : `✗ OUT OF SQUARE by ${Math.round(diff * 1000) / 1000}" - adjust corners`
    });
  };

  const calculateSlope = () => {
    const rise = parseFloat(slope.rise);
    const run = parseFloat(slope.run);
    
    if (!rise || !run) {
      setResults({ type: 'slope', message: 'Please enter rise and run' });
      return;
    }
    
    const slopePercent = (rise / run) * 100;
    const slopeAngle = Math.atan(rise / run) * (180 / Math.PI);
    const pitch = (rise / run) * 12;
    
    setResults({ 
      type: 'slope',
      slopePercent: Math.round(slopePercent * 10) / 10,
      slopeAngle: Math.round(slopeAngle * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
      message: `Slope: ${Math.round(slopePercent * 10) / 10}% | Angle: ${Math.round(slopeAngle * 10) / 10}° | Pitch: ${Math.round(pitch * 10) / 10}/12`
    });
  };

  const calculateTriangle = () => {
    const mult = parseFloat(triangle.unit) || 1;
    
    setResults({ 
      type: 'triangle',
      side1: 3 * mult,
      side2: 4 * mult,
      hypotenuse: 5 * mult,
      message: `3-4-5 Triangle (×${mult}): Measure ${3 * mult}' on one wall, ${4 * mult}' on the other. Diagonal should be exactly ${5 * mult}' if square.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Diagonal Calculator (Squaring)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Length (ft)</Label>
              <Input type="number" value={diagonal.side1} onChange={(e) => setDiagonal({...diagonal, side1: e.target.value})} placeholder="e.g., 10" />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input type="number" value={diagonal.side2} onChange={(e) => setDiagonal({...diagonal, side2: e.target.value})} placeholder="e.g., 12" />
            </div>
          </div>
          <Button onClick={calculateDiagonal} className="w-full">Calculate Diagonal</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Square Checker</h3>
          <p className="text-xs text-slate-500">Measure both diagonals and enter below</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Diagonal 1 (inches)</Label>
              <Input type="number" value={squareCheck.diag1} onChange={(e) => setSquareCheck({...squareCheck, diag1: e.target.value})} placeholder="e.g., 186.5" />
            </div>
            <div>
              <Label>Diagonal 2 (inches)</Label>
              <Input type="number" value={squareCheck.diag2} onChange={(e) => setSquareCheck({...squareCheck, diag2: e.target.value})} placeholder="e.g., 186.25" />
            </div>
          </div>
          <Button onClick={checkSquare} className="w-full">Check If Square</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Slope Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rise (inches)</Label>
              <Input type="number" value={slope.rise} onChange={(e) => setSlope({...slope, rise: e.target.value})} placeholder="e.g., 6" />
            </div>
            <div>
              <Label>Run (inches)</Label>
              <Input type="number" value={slope.run} onChange={(e) => setSlope({...slope, run: e.target.value})} placeholder="e.g., 12" />
            </div>
          </div>
          <Button onClick={calculateSlope} className="w-full">Calculate Slope</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">3-4-5 Triangle (Squaring Method)</h3>
          <div>
            <Label>Unit Multiplier</Label>
            <select 
              className="w-full h-10 px-3 border rounded-md"
              value={triangle.unit} 
              onChange={(e) => setTriangle({...triangle, unit: e.target.value})}
            >
              <option value="1">1× (3-4-5)</option>
              <option value="2">2× (6-8-10)</option>
              <option value="3">3× (9-12-15)</option>
              <option value="4">4× (12-16-20)</option>
              <option value="5">5× (15-20-25)</option>
            </select>
          </div>
          <Button onClick={calculateTriangle} className="w-full">Show 3-4-5 Triangle</Button>
        </div>

        {results && (
          <div className={`mt-4 p-4 rounded-lg ${results.type === 'squareCheck' ? (results.isSquare ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-green-50 border border-green-200'}`}>
            <h4 className={`font-semibold mb-2 ${results.type === 'squareCheck' ? (results.isSquare ? 'text-green-800' : 'text-red-800') : 'text-green-800'}`}>Results:</h4>
            <p className={`text-sm ${results.type === 'squareCheck' ? (results.isSquare ? 'text-green-700' : 'text-red-700') : 'text-green-700'}`}>{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Conversions Calculator
function ConversionsCalculator() {
  const [fraction, setFraction] = useState({ numerator: '', denominator: '' });
  const [decimal, setDecimal] = useState({ value: '' });
  const [feetInches, setFeetInches] = useState({ feet: '', inches: '' });
  const [metric, setMetric] = useState({ value: '', type: 'mToFt' });
  const [results, setResults] = useState(null);

  const convertFractionToDecimal = () => {
    const num = parseFloat(fraction.numerator);
    const den = parseFloat(fraction.denominator);
    
    if (!num || !den) {
      setResults({ type: 'fraction', message: 'Please enter numerator and denominator' });
      return;
    }
    
    const dec = num / den;
    
    setResults({ 
      type: 'fraction',
      decimal: Math.round(dec * 10000) / 10000,
      message: `${num}/${den} = ${Math.round(dec * 10000) / 10000}`
    });
  };

  const convertDecimalToFraction = () => {
    const dec = parseFloat(decimal.value);
    
    if (isNaN(dec)) {
      setResults({ type: 'decimal', message: 'Please enter a decimal value' });
      return;
    }
    
    // Find closest fraction with max denominator of 16
    let bestNum = 0, bestDen = 1, bestError = Math.abs(dec);
    
    for (let d = 1; d <= 16; d++) {
      const n = Math.round(dec * d);
      const error = Math.abs(dec - n / d);
      if (error < bestError) {
        bestError = error;
        bestNum = n;
        bestDen = d;
      }
    }
    
    setResults({ 
      type: 'decimal',
      fraction: `${bestNum}/${bestDen}`,
      message: `${dec} ≈ ${bestNum}/${bestDen}`
    });
  };

  const convertFeetInchesToDecimal = () => {
    const feet = parseFloat(feetInches.feet) || 0;
    const inches = parseFloat(feetInches.inches) || 0;
    
    const totalInches = (feet * 12) + inches;
    const decimalFeet = totalInches / 12;
    
    setResults({ 
      type: 'feetInches',
      decimalFeet: Math.round(decimalFeet * 10000) / 10000,
      totalInches,
      message: `${feet}' ${inches}" = ${Math.round(decimalFeet * 10000) / 10000} decimal feet (${totalInches} total inches)`
    });
  };

  const convertMetric = () => {
    const value = parseFloat(metric.value);
    
    if (!value) {
      setResults({ type: 'metric', message: 'Please enter a value' });
      return;
    }
    
    let result, message;
    
    switch(metric.type) {
      case 'mToFt':
        result = value * 3.28084;
        message = `${value} meters = ${Math.round(result * 1000) / 1000} feet (${Math.round(result * 12 * 100) / 100} inches)`;
        break;
      case 'ftToM':
        result = value / 3.28084;
        message = `${value} feet = ${Math.round(result * 1000) / 1000} meters (${Math.round(result * 100 * 10) / 10} cm)`;
        break;
      case 'inToCm':
        result = value * 2.54;
        message = `${value} inches = ${Math.round(result * 100) / 100} cm`;
        break;
      case 'cmToIn':
        result = value / 2.54;
        message = `${value} cm = ${Math.round(result * 100) / 100} inches`;
        break;
      default:
        message = 'Select conversion type';
    }
    
    setResults({ 
      type: 'metric',
      result: Math.round(result * 1000) / 1000,
      message
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Conversions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Fraction to Decimal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Numerator</Label>
              <Input type="number" value={fraction.numerator} onChange={(e) => setFraction({...fraction, numerator: e.target.value})} placeholder="e.g., 3" />
            </div>
            <div>
              <Label>Denominator</Label>
              <Input type="number" value={fraction.denominator} onChange={(e) => setFraction({...fraction, denominator: e.target.value})} placeholder="e.g., 8" />
            </div>
          </div>
          <Button onClick={convertFractionToDecimal} className="w-full">Convert to Decimal</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Decimal to Fraction</h3>
          <div>
            <Label>Decimal Value</Label>
            <Input type="number" step="0.0001" value={decimal.value} onChange={(e) => setDecimal({...decimal, value: e.target.value})} placeholder="e.g., 0.375" />
          </div>
          <Button onClick={convertDecimalToFraction} className="w-full">Convert to Fraction</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Feet-Inches to Decimal Feet</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Feet</Label>
              <Input type="number" value={feetInches.feet} onChange={(e) => setFeetInches({...feetInches, feet: e.target.value})} placeholder="e.g., 5" />
            </div>
            <div>
              <Label>Inches</Label>
              <Input type="number" value={feetInches.inches} onChange={(e) => setFeetInches({...feetInches, inches: e.target.value})} placeholder="e.g., 6" />
            </div>
          </div>
          <Button onClick={convertFeetInchesToDecimal} className="w-full">Convert to Decimal Feet</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Metric / Imperial</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value</Label>
              <Input type="number" value={metric.value} onChange={(e) => setMetric({...metric, value: e.target.value})} placeholder="Enter value" />
            </div>
            <div>
              <Label>Conversion</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={metric.type} 
                onChange={(e) => setMetric({...metric, type: e.target.value})}
              >
                <option value="mToFt">Meters → Feet</option>
                <option value="ftToM">Feet → Meters</option>
                <option value="inToCm">Inches → CM</option>
                <option value="cmToIn">CM → Inches</option>
              </select>
            </div>
          </div>
          <Button onClick={convertMetric} className="w-full">Convert</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Results:</h4>
            <p className="text-sm text-green-700">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specs Reference
function SpecsReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference Tables & IRC Standards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Common Lumber Sizes (Nominal vs Actual)</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>2×4:</strong> Actual 1.5" × 3.5"</p>
            <p className="mb-1"><strong>2×6:</strong> Actual 1.5" × 5.5"</p>
            <p className="mb-1"><strong>2×8:</strong> Actual 1.5" × 7.25"</p>
            <p className="mb-1"><strong>2×10:</strong> Actual 1.5" × 9.25"</p>
            <p className="mb-1"><strong>2×12:</strong> Actual 1.5" × 11.25"</p>
            <p className="mb-1"><strong>4×4:</strong> Actual 3.5" × 3.5"</p>
            <p className="mb-1"><strong>1×4:</strong> Actual 0.75" × 3.5"</p>
            <p><strong>1×6:</strong> Actual 0.75" × 5.5"</p>
          </div>
        </div>

        <Separator />

                <div className="space-y-3">
          <h3 className="font-semibold">IRC Stair Requirements</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Max Riser Height:</strong> 7.75"</p>
            <p className="mb-1"><strong>Min Tread Depth:</strong> 10"</p>
            <p className="mb-1"><strong>Min Headroom:</strong> 6' 8"</p>
            <p className="mb-1"><strong>Min Width:</strong> 36"</p>
            <p className="mb-1"><strong>Max Variation:</strong> 3/8" between risers/treads</p>
            <p><strong>Handrail Height:</strong> 34" - 38"</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">IRC Deck Requirements</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Guard Height (30"+ drop):</strong> 36" minimum</p>
            <p className="mb-1"><strong>Baluster Spacing:</strong> 4" max</p>
            <p className="mb-1"><strong>Joist Spacing:</strong> 16" OC typical</p>
            <p className="mb-1"><strong>Ledger Bolts:</strong> 1/2" diameter minimum</p>
            <p><strong>Post Spacing:</strong> 6-8 feet typical</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">Fastener Schedule</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Joist to Sill:</strong> 3-8d toenails or 2-16d face nails</p>
            <p className="mb-1"><strong>Top Plate Laps:</strong> 2-16d nails min 24" OC</p>
            <p className="mb-1"><strong>Stud to Plate:</strong> 4-8d toenails or 2-16d end nails</p>
            <p className="mb-1"><strong>Sheathing:</strong> 8d common, 6" edges, 12" field</p>
            <p><strong>Drywall Screws:</strong> Type W, 1-1/4" minimum</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">Spacing Standards</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Wall Studs:</strong> 16" or 24" OC</p>
            <p className="mb-1"><strong>Floor Joists:</strong> 12", 16", or 24" OC</p>
            <p className="mb-1"><strong>Roof Rafters:</strong> 12", 16", 19.2", or 24" OC</p>
            <p><strong>Drywall Screws:</strong> 12" OC ceiling, 16" OC walls</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">Concrete Reference</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Sidewalk Thickness:</strong> 4"</p>
            <p className="mb-1"><strong>Driveway Thickness:</strong> 4-6"</p>
            <p className="mb-1"><strong>Garage Slab:</strong> 4-6"</p>
            <p className="mb-1"><strong>60lb Bag Yields:</strong> 0.45 cu ft</p>
            <p className="mb-1"><strong>80lb Bag Yields:</strong> 0.60 cu ft</p>
            <p><strong>Standard Mix:</strong> 3000-4000 PSI</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">Roof Pitch Multipliers</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-x-4">
            <div>
              <p className="mb-1"><strong>Flat (0/12):</strong> 1.000</p>
              <p className="mb-1"><strong>1/12:</strong> 1.003</p>
              <p className="mb-1"><strong>2/12:</strong> 1.014</p>
              <p className="mb-1"><strong>3/12:</strong> 1.031</p>
              <p className="mb-1"><strong>4/12:</strong> 1.054</p>
              <p className="mb-1"><strong>5/12:</strong> 1.083</p>
            </div>
            <div>
              <p className="mb-1"><strong>6/12:</strong> 1.118</p>
              <p className="mb-1"><strong>7/12:</strong> 1.158</p>
              <p className="mb-1"><strong>8/12:</strong> 1.202</p>
              <p className="mb-1"><strong>9/12:</strong> 1.250</p>
              <p className="mb-1"><strong>10/12:</strong> 1.302</p>
              <p><strong>12/12:</strong> 1.414</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">Coverage Estimates</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Paint (per gallon):</strong> 350-400 sq ft</p>
            <p className="mb-1"><strong>Stain (per gallon):</strong> 200-300 sq ft</p>
            <p className="mb-1"><strong>Drywall Tape Roll:</strong> 500 sq ft</p>
            <p className="mb-1"><strong>Joint Compound (gal):</strong> 100 sq ft</p>
            <p className="mb-1"><strong>Shingle Bundle:</strong> 33 sq ft</p>
            <p><strong>Roofing Square:</strong> 100 sq ft</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HandymanCalculators() {
  return (
    <div className="w-full">
      <Tabs defaultValue="framing" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 mb-4 h-auto">
          <TabsTrigger value="framing" className="flex gap-1 text-xs"><Hammer className="w-3 h-3" /> Framing</TabsTrigger>
          <TabsTrigger value="stairs" className="flex gap-1 text-xs"><ArrowUpDown className="w-3 h-3" /> Stairs</TabsTrigger>
          <TabsTrigger value="concrete" className="flex gap-1 text-xs"><Box className="w-3 h-3" /> Concrete</TabsTrigger>
          <TabsTrigger value="materials" className="flex gap-1 text-xs"><Package className="w-3 h-3" /> Materials</TabsTrigger>
          <TabsTrigger value="drywall" className="flex gap-1 text-xs"><Frame className="w-3 h-3" /> Drywall</TabsTrigger>
          <TabsTrigger value="paint" className="flex gap-1 text-xs"><PaintBucket className="w-3 h-3" /> Paint</TabsTrigger>
          <TabsTrigger value="trim" className="flex gap-1 text-xs"><Ruler className="w-3 h-3" /> Trim</TabsTrigger>
          <TabsTrigger value="layout" className="flex gap-1 text-xs"><Triangle className="w-3 h-3" /> Layout</TabsTrigger>
          <TabsTrigger value="conversions" className="flex gap-1 text-xs"><ArrowRightLeft className="w-3 h-3" /> Convert</TabsTrigger>
          <TabsTrigger value="specs" className="flex gap-1 text-xs"><FileText className="w-3 h-3" /> Specs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="framing"><FramingCalculator /></TabsContent>
        <TabsContent value="stairs"><StairsCalculator /></TabsContent>
        <TabsContent value="concrete"><ConcreteCalculator /></TabsContent>
        <TabsContent value="materials"><MaterialsCalculator /></TabsContent>
        <TabsContent value="drywall"><DrywallCalculator /></TabsContent>
        <TabsContent value="paint"><PaintCalculator /></TabsContent>
        <TabsContent value="trim"><TrimCalculator /></TabsContent>
        <TabsContent value="layout"><LayoutCalculator /></TabsContent>
        <TabsContent value="conversions"><ConversionsCalculator /></TabsContent>
        <TabsContent value="specs"><SpecsReference /></TabsContent>
      </Tabs>
    </div>
  );
}