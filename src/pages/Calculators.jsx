import React from 'react';
import HandymanCalculators from '@/components/calculators/HandymanCalculators';
import { Calculator } from 'lucide-react';

export default function Calculators() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-indigo-600" />
            Handyman Calculators
          </h1>
          <p className="text-slate-500 mt-1">Quick estimation tools and reference sheets</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[600px]">
        <HandymanCalculators />
      </div>
    </div>
  );
}