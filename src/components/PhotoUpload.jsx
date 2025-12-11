import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PhotoUpload({ photos = [], onChange, readOnly = false }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newPhotos = [...photos];

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
        onChange([...newPhotos, ...validUrls]);
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
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((url, index) => (
          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <img 
              src={url} 
              alt={`Photo ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            {!readOnly && (
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
                  Take Photo or Upload
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {photos.length === 0 && readOnly && (
        <div className="text-sm text-slate-500 italic flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> No photos attached
        </div>
      )}
    </div>
  );
}