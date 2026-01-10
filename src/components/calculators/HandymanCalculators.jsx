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
  const [studInputs, setStudInputs] = useState({ wallLength: '', studSpacing: '' });
  const [rafterInputs, setRafterInputs] = useState({ span: '', pitch: '' });
  const [headerInputs, setHeaderInputs] = useState({ span: '', load: '' });
  const [results, setResults] = useState(null);

  const calculateStuds = () => {
    setResults({ type: 'studs', count: 0, message: 'Calculation pending' });
  };

  const calculateRafters = () => {
    setResults({ type: 'rafters', length: 0, message: 'Calculation pending' });
  };

  const calculateHeader = () => {
    setResults({ type: 'header', size: '', message: 'Calculation pending' });
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
              <Input type="number" value={studInputs.wallLength} onChange={(e) => setStudInputs({...studInputs, wallLength: e.target.value})} />
            </div>
            <div>
              <Label>Stud Spacing (in)</Label>
              <Input type="number" value={studInputs.studSpacing} onChange={(e) => setStudInputs({...studInputs, studSpacing: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateStuds} className="w-full">Calculate Studs</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Rafter Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Span (ft)</Label>
              <Input type="number" value={rafterInputs.span} onChange={(e) => setRafterInputs({...rafterInputs, span: e.target.value})} />
            </div>
            <div>
              <Label>Pitch (rise/run)</Label>
              <Input type="text" value={rafterInputs.pitch} onChange={(e) => setRafterInputs({...rafterInputs, pitch: e.target.value})} placeholder="e.g., 6/12" />
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
              <Input type="number" value={headerInputs.span} onChange={(e) => setHeaderInputs({...headerInputs, span: e.target.value})} />
            </div>
            <div>
              <Label>Load Type</Label>
              <Input type="text" value={headerInputs.load} onChange={(e) => setHeaderInputs({...headerInputs, load: e.target.value})} placeholder="Roof, Floor, etc." />
            </div>
          </div>
          <Button onClick={calculateHeader} className="w-full">Calculate Header</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
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
    setResults({ steps: 0, riserHeight: 0, treadDepth: 0, message: 'Calculation pending' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stairs Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Total Rise (in)</Label>
          <Input type="number" value={inputs.totalRise} onChange={(e) => setInputs({...inputs, totalRise: e.target.value})} placeholder="Total vertical height" />
        </div>
        <div>
          <Label>Total Run (in)</Label>
          <Input type="number" value={inputs.totalRun} onChange={(e) => setInputs({...inputs, totalRun: e.target.value})} placeholder="Total horizontal length" />
        </div>
        <Button onClick={calculate} className="w-full">Calculate Stairs</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Concrete Calculator
function ConcreteCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', depth: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    setResults({ cubicYards: 0, bags: 0, message: 'Calculation pending' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concrete Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Length (ft)</Label>
          <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} />
        </div>
        <div>
          <Label>Width (ft)</Label>
          <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} />
        </div>
        <div>
          <Label>Depth (in)</Label>
          <Input type="number" value={inputs.depth} onChange={(e) => setInputs({...inputs, depth: e.target.value})} />
        </div>
        <Button onClick={calculate} className="w-full">Calculate Concrete</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Materials Calculator
function MaterialsCalculator() {
  const [boardFeet, setBoardFeet] = useState({ length: '', width: '', thickness: '', quantity: '' });
  const [roofing, setRoofing] = useState({ length: '', width: '', pitch: '' });
  const [decking, setDecking] = useState({ length: '', width: '', joist: '' });
  const [results, setResults] = useState(null);

  const calculateBoardFeet = () => {
    setResults({ type: 'boardFeet', total: 0, message: 'Calculation pending' });
  };

  const calculateRoofing = () => {
    setResults({ type: 'roofing', squares: 0, message: 'Calculation pending' });
  };

  const calculateDecking = () => {
    setResults({ type: 'decking', boards: 0, message: 'Calculation pending' });
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
              <Input type="number" value={boardFeet.length} onChange={(e) => setBoardFeet({...boardFeet, length: e.target.value})} />
            </div>
            <div>
              <Label>Width (in)</Label>
              <Input type="number" value={boardFeet.width} onChange={(e) => setBoardFeet({...boardFeet, width: e.target.value})} />
            </div>
            <div>
              <Label>Thickness (in)</Label>
              <Input type="number" value={boardFeet.thickness} onChange={(e) => setBoardFeet({...boardFeet, thickness: e.target.value})} />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={boardFeet.quantity} onChange={(e) => setBoardFeet({...boardFeet, quantity: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateBoardFeet} className="w-full">Calculate Board Feet</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Roofing Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Length (ft)</Label>
              <Input type="number" value={roofing.length} onChange={(e) => setRoofing({...roofing, length: e.target.value})} />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input type="number" value={roofing.width} onChange={(e) => setRoofing({...roofing, width: e.target.value})} />
            </div>
            <div>
              <Label>Pitch</Label>
              <Input type="text" value={roofing.pitch} onChange={(e) => setRoofing({...roofing, pitch: e.target.value})} placeholder="e.g., 6/12" />
            </div>
          </div>
          <Button onClick={calculateRoofing} className="w-full">Calculate Roofing</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Decking Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Length (ft)</Label>
              <Input type="number" value={decking.length} onChange={(e) => setDecking({...decking, length: e.target.value})} />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input type="number" value={decking.width} onChange={(e) => setDecking({...decking, width: e.target.value})} />
            </div>
            <div>
              <Label>Joist Spacing (in)</Label>
              <Input type="number" value={decking.joist} onChange={(e) => setDecking({...decking, joist: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateDecking} className="w-full">Calculate Decking</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Drywall Calculator
function DrywallCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '', doors: '', windows: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    setResults({ sheets: 0, compound: 0, tape: 0, message: 'Calculation pending' });
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
            <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} />
          </div>
          <div>
            <Label>Room Width (ft)</Label>
            <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} />
          </div>
          <div>
            <Label>Ceiling Height (ft)</Label>
            <Input type="number" value={inputs.height} onChange={(e) => setInputs({...inputs, height: e.target.value})} />
          </div>
          <div>
            <Label>Number of Doors</Label>
            <Input type="number" value={inputs.doors} onChange={(e) => setInputs({...inputs, doors: e.target.value})} />
          </div>
          <div>
            <Label>Number of Windows</Label>
            <Input type="number" value={inputs.windows} onChange={(e) => setInputs({...inputs, windows: e.target.value})} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate Drywall</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Paint Calculator
function PaintCalculator() {
  const [inputs, setInputs] = useState({ length: '', width: '', height: '', coats: '' });
  const [results, setResults] = useState(null);

  const calculate = () => {
    setResults({ gallons: 0, message: 'Calculation pending' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paint Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Room Length (ft)</Label>
            <Input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: e.target.value})} />
          </div>
          <div>
            <Label>Room Width (ft)</Label>
            <Input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: e.target.value})} />
          </div>
          <div>
            <Label>Ceiling Height (ft)</Label>
            <Input type="number" value={inputs.height} onChange={(e) => setInputs({...inputs, height: e.target.value})} />
          </div>
          <div>
            <Label>Number of Coats</Label>
            <Input type="number" value={inputs.coats} onChange={(e) => setInputs({...inputs, coats: e.target.value})} />
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate Paint</Button>
        
        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trim Calculator
function TrimCalculator() {
  const [miter, setMiter] = useState({ angle: '' });
  const [crown, setCrown] = useState({ roomLength: '', roomWidth: '' });
  const [baseboard, setBaseboard] = useState({ roomLength: '', roomWidth: '', doorCount: '' });
  const [results, setResults] = useState(null);

  const calculateMiter = () => {
    setResults({ type: 'miter', cut: 0, message: 'Calculation pending' });
  };

  const calculateCrown = () => {
    setResults({ type: 'crown', linearFeet: 0, message: 'Calculation pending' });
  };

  const calculateBaseboard = () => {
    setResults({ type: 'baseboard', linearFeet: 0, message: 'Calculation pending' });
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
            <Label>Wall Angle (degrees)</Label>
            <Input type="number" value={miter.angle} onChange={(e) => setMiter({...miter, angle: e.target.value})} placeholder="e.g., 90" />
          </div>
          <Button onClick={calculateMiter} className="w-full">Calculate Miter</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Crown Molding</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room Length (ft)</Label>
              <Input type="number" value={crown.roomLength} onChange={(e) => setCrown({...crown, roomLength: e.target.value})} />
            </div>
            <div>
              <Label>Room Width (ft)</Label>
              <Input type="number" value={crown.roomWidth} onChange={(e) => setCrown({...crown, roomWidth: e.target.value})} />
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
              <Input type="number" value={baseboard.roomLength} onChange={(e) => setBaseboard({...baseboard, roomLength: e.target.value})} />
            </div>
            <div>
              <Label>Room Width (ft)</Label>
              <Input type="number" value={baseboard.roomWidth} onChange={(e) => setBaseboard({...baseboard, roomWidth: e.target.value})} />
            </div>
            <div>
              <Label>Door Count</Label>
              <Input type="number" value={baseboard.doorCount} onChange={(e) => setBaseboard({...baseboard, doorCount: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateBaseboard} className="w-full">Calculate Baseboard</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Layout Calculator
function LayoutCalculator() {
  const [diagonal, setDiagonal] = useState({ side1: '', side2: '' });
  const [slope, setSlope] = useState({ rise: '', run: '' });
  const [triangle, setTriangle] = useState({ unit: '' });
  const [results, setResults] = useState(null);

  const calculateDiagonal = () => {
    setResults({ type: 'diagonal', length: 0, message: 'Calculation pending' });
  };

  const calculateSlope = () => {
    setResults({ type: 'slope', ratio: '', message: 'Calculation pending' });
  };

  const calculateTriangle = () => {
    setResults({ type: 'triangle', sides: [], message: 'Calculation pending' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Diagonal Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Side 1 (ft)</Label>
              <Input type="number" value={diagonal.side1} onChange={(e) => setDiagonal({...diagonal, side1: e.target.value})} />
            </div>
            <div>
              <Label>Side 2 (ft)</Label>
              <Input type="number" value={diagonal.side2} onChange={(e) => setDiagonal({...diagonal, side2: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateDiagonal} className="w-full">Calculate Diagonal</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Slope Calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rise (in)</Label>
              <Input type="number" value={slope.rise} onChange={(e) => setSlope({...slope, rise: e.target.value})} />
            </div>
            <div>
              <Label>Run (in)</Label>
              <Input type="number" value={slope.run} onChange={(e) => setSlope({...slope, run: e.target.value})} />
            </div>
          </div>
          <Button onClick={calculateSlope} className="w-full">Calculate Slope</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">3-4-5 Triangle</h3>
          <div>
            <Label>Unit Multiplier</Label>
            <Input type="number" value={triangle.unit} onChange={(e) => setTriangle({...triangle, unit: e.target.value})} placeholder="e.g., 2 for 6-8-10" />
          </div>
          <Button onClick={calculateTriangle} className="w-full">Calculate 3-4-5</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Conversions Calculator
function ConversionsCalculator() {
  const [fraction, setFraction] = useState({ input: '' });
  const [feetInches, setFeetInches] = useState({ feet: '', inches: '' });
  const [metric, setMetric] = useState({ value: '', from: 'ft', to: 'm' });
  const [results, setResults] = useState(null);

  const convertFraction = () => {
    setResults({ type: 'fraction', decimal: 0, message: 'Calculation pending' });
  };

  const convertFeetInches = () => {
    setResults({ type: 'feetInches', decimal: 0, message: 'Calculation pending' });
  };

  const convertMetric = () => {
    setResults({ type: 'metric', converted: 0, message: 'Calculation pending' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Conversions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Fraction to Decimal</h3>
          <div>
            <Label>Fraction</Label>
            <Input type="text" value={fraction.input} onChange={(e) => setFraction({...fraction, input: e.target.value})} placeholder="e.g., 3/4" />
          </div>
          <Button onClick={convertFraction} className="w-full">Convert Fraction</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Feet & Inches to Decimal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Feet</Label>
              <Input type="number" value={feetInches.feet} onChange={(e) => setFeetInches({...feetInches, feet: e.target.value})} />
            </div>
            <div>
              <Label>Inches</Label>
              <Input type="number" value={feetInches.inches} onChange={(e) => setFeetInches({...feetInches, inches: e.target.value})} />
            </div>
          </div>
          <Button onClick={convertFeetInches} className="w-full">Convert to Decimal Feet</Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Metric Conversion</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <Label>Value</Label>
              <Input type="number" value={metric.value} onChange={(e) => setMetric({...metric, value: e.target.value})} />
            </div>
            <div>
              <Label>From</Label>
              <Input type="text" value={metric.from} onChange={(e) => setMetric({...metric, from: e.target.value})} placeholder="ft, in, m, cm" />
            </div>
            <div>
              <Label>To</Label>
              <Input type="text" value={metric.to} onChange={(e) => setMetric({...metric, to: e.target.value})} placeholder="ft, in, m, cm" />
            </div>
          </div>
          <Button onClick={convertMetric} className="w-full">Convert Units</Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Results:</h4>
            <p className="text-sm text-slate-600">{results.message}</p>
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

        <div className="border-t my-4"></div>

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

        <div className="border-t my-4"></div>

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

        <div className="border-t my-4"></div>

        <div className="space-y-3">
          <h3 className="font-semibold">Fastener Schedule</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Joist to Sill:</strong> 3-8d toenails or 2-16d face nails</p>
            <p className="mb-1"><strong>Top Plate Laps:</strong> 2-16d nails min</p>
            <p className="mb-1"><strong>Stud to Plate:</strong> 4-8d toenails or 2-16d end nails</p>
            <p className="mb-1"><strong>Sheathing:</strong> 8d common, 6" edges, 12" field</p>
            <p><strong>Drywall Screws:</strong> Type W, 1-1/4" minimum</p>
          </div>
        </div>

        <div className="border-t my-4"></div>

        <div className="space-y-3">
          <h3 className="font-semibold">Spacing Standards</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm">
            <p className="mb-1"><strong>Wall Studs:</strong> 16" or 24" OC</p>
            <p className="mb-1"><strong>Floor Joists:</strong> 12", 16", or 24" OC</p>
            <p className="mb-1"><strong>Roof Rafters:</strong> 12", 16", 19.2", or 24" OC</p>
            <p><strong>Drywall Screws:</strong> 12" OC ceiling, 16" OC walls</p>
          </div>
        </div>

        <div className="border-t my-4"></div>

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

        <div className="border-t my-4"></div>

        <div className="space-y-3">
          <h3 className="font-semibold">Roof Pitch Multipliers</h3>
          <div className="bg-slate-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-x-4">
            <div>
              <p className="mb-1"><strong>Flat:</strong> 1.000</p>
              <p className="mb-1"><strong>2/12:</strong> 1.014</p>
              <p className="mb-1"><strong>4/12:</strong> 1.054</p>
              <p className="mb-1"><strong>6/12:</strong> 1.118</p>
            </div>
            <div>
              <p className="mb-1"><strong>8/12:</strong> 1.202</p>
              <p className="mb-1"><strong>10/12:</strong> 1.302</p>
              <p className="mb-1"><strong>12/12:</strong> 1.414</p>
            </div>
          </div>
        </div>

        <div className="border-t my-4"></div>

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