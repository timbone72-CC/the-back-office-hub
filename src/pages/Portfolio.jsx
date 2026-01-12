// ========== SECTION 1: IMPORTS ==========
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

// ========== SECTION 2: PORTFOLIO COMPONENT ==========
export default function Portfolio() {
  // ========== SECTION 3: STATE MANAGEMENT ==========
  const [filterType, setFilterType] = useState('all'); // all, before, after
  const [searchTerm, setSearchTerm] = useState('');

  // ========== SECTION 4: DATA FETCHING ==========
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['portfolio-jobs'],
    queryFn: async () => {
      // Fetch completed jobs
      return base44.entities.Job.filter({ status: 'completed' }, '-updated_date', 100);
    }
  });

  // ========== SECTION 5: PHOTO PROCESSING ==========
  // Flatten photos from Completed Jobs
  const allPhotos = (jobs || []).flatMap(job => {
    const jobPhotos = job.photos || [];
    return jobPhotos.map(p => {
      // Handle legacy string photos vs new objects
      const photoObj = typeof p === 'string' ? { url: p, type: 'general' } : p;
      return {
        ...photoObj,
        jobTitle: job.title,
        jobId: job.id,
        date: job.updated_date, // Use job updated date (completion date roughly)
        status: job.status
      };
    });
  });

  // ========== SECTION 6: FILTERING LOGIC ==========
  const filteredPhotos = allPhotos.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ========== SECTION 7: PDF EXPORT FUNCTION ==========
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

  // ========== SECTION 8: RENDER UI ==========
  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Our Work</h1>
          <p className="text-slate-500 mt-1">Showcase of completed projects</p>
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
            placeholder="Search projects..."
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
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No completed projects yet</h3>
          <p className="text-slate-500">Complete some jobs and add "After" photos to see them here.</p>
        </div>
      )}
    </div>
  );
}