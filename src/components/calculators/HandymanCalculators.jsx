import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DrywallEstimator from './DrywallEstimator';
import FramingCalculator from './FramingCalculator';
import SpecSheet from './SpecSheet';
import { Calculator, Ruler, BookOpen } from 'lucide-react';

export default function HandymanCalculators() {
  return (
    <div className="w-full">
      <Tabs defaultValue="drywall" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="drywall" className="flex gap-2"><Calculator className="w-4 h-4" /> Drywall</TabsTrigger>
          <TabsTrigger value="framing" className="flex gap-2"><Ruler className="w-4 h-4" /> Framing</TabsTrigger>
          <TabsTrigger value="specs" className="flex gap-2"><BookOpen className="w-4 h-4" /> Specs</TabsTrigger>
        </TabsList>
        <TabsContent value="drywall">
          <DrywallEstimator />
        </TabsContent>
        <TabsContent value="framing">
          <FramingCalculator />
        </TabsContent>
        <TabsContent value="specs">
          <SpecSheet />
        </TabsContent>
      </Tabs>
    </div>
  );
}