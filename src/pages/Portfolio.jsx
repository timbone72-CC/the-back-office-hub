import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Briefcase, Filter, Search, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function Portfolio() {
  const [filterType, setFilterType] = useState('all'); // all, before, after
  const [searchTerm, setSearchTerm] = useState('');

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['portfolio-estimates'],
    queryFn: async () => {
      // Get approved or converted estimates
      const all = await base44.entities.JobEstimate.list('-date', 100);
      return all.filter(e => e.status === 'approved' || e.status === 'converted');
    }
  });

  // Need clients to display client names if needed, but estimate title might be enough.
  // We'll trust estimate title for now or fetch clients if we want to be fancy.
  
  // Flatten photos
  const allPhotos = (estimates || []).flatMap(est => {
    const estPhotos = est.photos || [];
    return estPhotos.map(p => {
      // Handle legacy string photos vs new objects
      const photoObj = typeof p === 'string' ? { url: p, type: 'general' } : p;
      return {
        ...photoObj,
        jobTitle: est.title,
        jobId: est.id,
        date: est.date,
        status: est.status
      };
    });
  });

  const filteredPhotos = allPhotos.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Project Portfolio", 20, 20);
      
      let y = 40;
      
      // Group by job for the PDF
      const grouped = filteredPhotos.reduce((acc, p) => {
        if (!acc[p.jobId]) acc[p.jobId] = { title: p.jobTitle, photos: [] };
        acc[p.jobId].photos.push(p);
        return acc;
      }, {});

      Object.values(grouped).forEach((group, i) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(14);
        doc.text(group.title, 20, y);
        y += 10;
        
        // Just listing photos as text links/descriptions for now as adding actual images to PDF via client-side jsPDF 
        // without proxying them (due to CORS) is tricky. 
        // We'll just list the counts or "Before/After" sets.
        const beforeCount = group.photos.filter(p => p.type === 'before').length;
        const afterCount = group.photos.filter(p => p.type === 'after').length;
        
        doc.setFontSize(10);
        doc.text(`Photos: ${beforeCount} Before, ${afterCount} After`, 25, y);
        y += 15;
      });

      doc.save("portfolio.pdf");
      toast.success("Portfolio summary downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Project Portfolio</h1>
          <p className="text-slate-500 mt-1">Showcase of approved and converted jobs</p>
        </div>
        <Button onClick={generatePDF} variant="outline">
          <Download className="w-4 h-4 mr-2" /> Export PDF
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-9"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              <SelectItem value="before">Before</SelectItem>
              <SelectItem value="after">After</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <Card key={idx} className="group overflow-hidden border-slate-200 hover:shadow-lg transition-all">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img 
                  src={photo.url} 
                  alt={photo.jobTitle}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`
                    ${photo.type === 'before' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 
                      photo.type === 'after' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                      'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                    capitalize shadow-sm
                  `}>
                    {photo.type}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 truncate" title={photo.jobTitle}>
                  {photo.jobTitle}
                </h3>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                  <span>{photo.date ? format(new Date(photo.date), 'MMM d, yyyy') : 'No date'}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                    {photo.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No photos found</h3>
          <p className="text-slate-500">Try adjusting your filters or upload photos to your estimates.</p>
        </div>
      )}
    </div>
  );
}