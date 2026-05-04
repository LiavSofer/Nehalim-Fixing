import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Camera, X } from 'lucide-react';

export default function MarkRepairedDialog({ open, onOpenChange, fault, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [repairImage, setRepairImage] = useState(null);

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.70);
    };
    img.src = url;
  });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const compressed = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
    setRepairImage(file_url);
    setImagePreview(file_url);
    setUploading(false);
  };

  const handleMarkRepaired = async () => {
    if (!repairImage) {
      alert('אנא העלה תמונה של התיקון');
      return;
    }

    try {
      setLoading(true);
      await base44.entities.Fault.update(fault.id, { 
        status: 'ממתין לאישור',
        repairImage: repairImage 
      });
      onSuccess?.();
      onOpenChange(false);
      setImagePreview('');
      setRepairImage(null);
    } catch (error) {
      console.error('Error marking repaired:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>סיום טיפול בתקלה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            אנא העלה תמונה של התיקון שביצעת
          </p>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium text-foreground">{fault?.faultType}</p>
            <p className="text-xs text-muted-foreground mt-1">{fault?.location}</p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            {!imagePreview ? (
              <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-primary font-medium">מעלה תמונה...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">צלם / בחר תמונה של התיקון</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                <img src={imagePreview} alt="תיקון" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setRepairImage(null);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleMarkRepaired}
            disabled={loading || !repairImage}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'שומר...' : 'סיימתי טיפול'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}