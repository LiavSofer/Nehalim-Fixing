import React, { useState, useRef } from 'react';
import { useDialogBackHandler } from '@/hooks/useDialogBackHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { uploadFile } from '@/lib/uploadFile';
import { Camera, X, MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

export default function MarkRepairedDialog({ open, onOpenChange, fault, onSuccess }) {
  useDialogBackHandler(open, () => onOpenChange(false));
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [repairImage, setRepairImage] = useState(null);
  const [manualComment, setManualComment] = useState('');
  const fileInputRef = useRef(null);

  const compressImage = (file) => new Promise((resolve, reject) => {
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
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('שגיאה בדחיסת תמונה'));
      }, 'image/jpeg', 0.70);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('שגיאה בטעינת תמונה')); };
    img.src = url;
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileToUpload = new File([compressed], file.name || 'image.jpg', { type: 'image/jpeg' });
      const { file_url } = await uploadFile(fileToUpload);
      // Reset input AFTER upload so it doesn't interfere
      if (fileInputRef.current) fileInputRef.current.value = '';
      setRepairImage(file_url);
      setImagePreview(file_url);
    } catch (err) {
      console.error('שגיאה בהעלאת תמונה:', err);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleMarkRepaired = async () => {
    if (!repairImage) {
      alert('אנא העלה תמונה של התיקון');
      return;
    }

    try {
      setLoading(true);
      const response = await base44.functions.invoke('updateFault', {
        faultId: fault.id,
        updates: { status: 'ממתין לאישור', repairImage },
        action: 'markRepaired',
      });
      if (response.data?.error) throw new Error(response.data.error);

      // Add automatic comment
      const me = await base44.auth.me();
      await base44.entities.FaultComment.create({
        faultId: fault.id,
        comment: 'התקלה טופלה ומחכה לאישור',
        userId: me?.id || '',
        userName: me?.full_name || '',
        userProfileImage: me?.profileImage || '',
        type: 'automatic',
        automaticEventType: 'repaired',
      });

      // Add manual comment if provided
      if (manualComment.trim()) {
        await base44.entities.FaultComment.create({
          faultId: fault.id,
          comment: manualComment.trim(),
          userId: me?.id || '',
          userName: me?.full_name || '',
          userProfileImage: me?.profileImage || '',
          type: 'manual',
        });
      }
      
      // Invalidate queries to trigger real-time UI update
      await queryClient.invalidateQueries({ queryKey: ['faults'] });
      
      onSuccess?.();
      onOpenChange(false);
      setImagePreview('');
      setRepairImage(null);
      setManualComment('');
    } catch (error) {
      console.error('Error marking repaired:', error);
      alert('שגיאה בסימון כתוקן');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>סיום טיפול בתקלה</DialogTitle>
          <DialogDescription>העלה תמונה של התיקון שביצעת</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            אנא העלה תמונה של התיקון שביצעת
          </p>

          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="text-sm font-semibold text-foreground">{fault?.title || fault?.faultType}</p>
            {fault?.description && <p className="text-xs text-muted-foreground">{fault.description}</p>}
            <div className="flex items-center gap-1 pt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">{fault?.location}{fault?.roomNumber ? ` - ${fault.roomNumber}` : ''}</p>
            </div>
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
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

          {/* Manual Comment */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">הערה לצ'אט (אופציונלי)</Label>
            <Textarea
              placeholder="הוסף הערה על הטיפול שבוצע..."
              value={manualComment}
              onChange={(e) => setManualComment(e.target.value)}
              className="resize-none h-20 text-sm"
            />
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