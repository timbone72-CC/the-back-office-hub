import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PhotoUpload({ photos = [], onChange, readOnly = false }) {
  const [uploading, setUploading] = useState(false);

  // Helper to normalize photo data (handle legacy strings vs new objects)
  const normalizePhoto = (photo) => {
    if (typeof photo === 'string') return { url: photo, type: 'general' };
    return { url: photo.url, type: photo.type || 'general' };
  };

  const currentPhotos = photos.map(normalizePhoto);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      // Process uploads in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          return result.file_url;
        } catch (error) {
          console.error("Upload failed for file:", file.name, error);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);
      
      if (validUrls.length > 0) {
        // Add new photos with default type 'general'
        const newPhotoObjects = validUrls.map(url => ({ url, type: 'after' })); // Default to 'after' as it's common for jobs
        onChange([...currentPhotos, ...newPhotoObjects]);
        toast.success(`Uploaded ${validUrls.length} photo(s)`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading photos");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removePhoto = (index) => {
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const updatePhotoType = (index, newType) => {
    const newPhotos = [...currentPhotos];
    newPhotos[index] = { ...newPhotos[index], type: newType };
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {currentPhotos.map((photo, index) => (
          <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
            <div className="aspect-square relative">
              <img 
                src={photo.url} 
                alt={`Photo ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {/* Type Badge (Overlay) */}
               <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                 {!readOnly ? (
                   <select
                     value={photo.type}
                     onChange={(e) => updatePhotoType(index, e.target.value)}
                     className="w-full bg-transparent text-white text-xs border-none outline-none focus:ring-0 p-0 cursor-pointer text-center appearance-none font-medium"
                   >
                     <option value="before" className="text-black">Before</option>
                     <option value="after" className="text-black">After</option>
                     <option value="general" className="text-black">General</option>
                   </select>
                 ) : (
                   <div className="text-white text-xs text-center font-medium capitalize">
                     {photo.type}
                   </div>
                 )}
               </div>
            </div>
          </div>
        ))}
        
        {!readOnly && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-500 text-center px-2">
                  Add Photo
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {currentPhotos.length === 0 && readOnly && (
        <div className="text-sm text-slate-500 italic flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> No photos attached
        </div>
      )}
    </div>
  );
}