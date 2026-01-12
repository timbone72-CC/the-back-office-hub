// ========== FILE: pages/EstimateDetail.jsx ==========

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EstimateDetail() {
  // --- THE FIX: We define estimateId here ---
const { id } = useParams();
const [searchParams] = useSearchParams();
const estimateId = id || searchParams.get('id');

  // State
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!estimateId) return;

    const fetchEstimate = async () => {
      try {
        setLoading(true);
        // Safe Mode Fetch
        const res = await base44.entities.JobEstimate.list(); 
        const found = (res || []).find(e => e._id === estimateId || e.id === estimateId);
        
        if (found) {
          const items = found.items || [];
          const tax_rate = found.tax_rate || 0;
          
          // Calculate Totals
          const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
          const total = subtotal * (1 + (Number(tax_rate) / 100));

          setFormData({
            ...found,
            items: items,
            tax_rate: tax_rate,
            subtotal: subtotal,
            total_amount: total
          });
        }
      } catch (error) {
        console.error("Error loading estimate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [estimateId]);

  // --- 2. CALCULATION LOGIC ---
  const recalculate = (currentData) => {
    const items = currentData.items || [];
    
    // Calc Line Items & Subtotal
    const updatedItems = items.map(item => ({
      ...item,
      total: (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)
    }));
    const sub = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const total = sub * (1 + ((Number(currentData.tax_rate) || 0) / 100));

    return { ...currentData, items: updatedItems, subtotal: sub, total_amount: total };
  };

  // --- 3. HANDLERS ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(recalculate({ ...formData, items: newItems }));
  };

  const handleAddItem = () => {
    const newItem = { description: '', quantity: 1, unit_cost: 0, total: 0 };
    setFormData(recalculate({ ...formData, items: [...formData.items, newItem] }));
  };

  const handleDeleteItem = (index) => {
    setFormData(recalculate({ ...formData, items: formData.items.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!estimateId || !formData) return;
    setSaving(true);
    try {
      await base44.entities.JobEstimate.update(estimateId, formData);
      alert('✅ Estimate Saved!');
    } catch (error) {
      console.error("Save failed:", error);
      alert('Error saving estimate.');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ---
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!formData) return <div className="p-8 text-center text-red-500">Estimate not found.</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">{formData.title || 'Untitled Estimate'}</h1>
            <p className="text-sm text-gray-500">#{estimateId.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => navigate('/tools')}><Calculator className="w-4 h-4 mr-2" /> Open Tools</Button>
           <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> Save</Button>
        </div>
      </div>

      {/* Client Info */}
      <Card>
        <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <div><Label>Job Title</Label><Input value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
           <div><Label>Client Name</Label><Input value={formData.client_name || ''} onChange={(e) => setFormData({...formData, client_name: e.target.value})} /></div>
           <div><Label>Status</Label>
             <select className="w-full p-2 border rounded-md" value={formData.status || 'draft'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
               <option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option>
             </select>
           </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Line Items</CardTitle><Button size="sm" variant="outline" onClick={handleAddItem}><Plus className="w-4 h-4 mr-2" /> Add Item</Button></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 font-bold text-xs text-gray-500 uppercase px-2">
              <div className="col-span-6">Description</div><div className="col-span-2 text-right">Qty</div><div className="col-span-2 text-right">Cost</div><div className="col-span-2 text-right">Total</div>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded hover:bg-slate-100 group">
                <div className="col-span-6"><Input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="bg-white"/></div>
                <div className="col-span-2"><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="text-right bg-white"/></div>
                <div className="col-span-2"><Input type="number" value={item.unit_cost} onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)} className="text-right bg-white"/></div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="font-bold text-sm">${(item.total || 0).toFixed(2)}</span>
                  <button onClick={() => handleDeleteItem(index)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex justify-end">
        <Card className="w-full md:w-1/3">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Tax Rate (%)</span><Input type="number" className="w-20 text-right h-8" value={formData.tax_rate} onChange={(e) => { const nextState = { ...formData, tax_rate: e.target.value }; setFormData(recalculate(nextState)); }} /></div>
            <div className="border-t pt-3 flex justify-between items-center"><span className="font-bold text-lg">Total</span><span className="font-bold text-xl text-green-700">${(formData.total_amount || 0).toFixed(2)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}