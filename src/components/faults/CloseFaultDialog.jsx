import React, { useState } from 'react';
import { useDialogBackHandler } from '@/hooks/useDialogBackHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function CloseFaultDialog({ open, onOpenChange, fault, onSuccess }) {
  useDialogBackHandler(open, () => onOpenChange(false));
  const [loading, setLoading] = useState(false);
  const [closingComment, setClosingComment] = useState('');
  const queryClient = useQueryClient();

  const handleCloseFault = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('updateFault', { faultId: fault.id, updates: { status: 'סגור' }, action: 'close' });
      if (response.data?.error) throw new Error(response.data.error);

      const me = await base44.auth.me();

      // Automatic closing comment
      await base44.entities.FaultComment.create({
        faultId: fault.id,
        comment: 'מאשר טיפול - התקלה נסגרה',
        userId: me?.id || '',
        userName: me?.full_name || '',
        userProfileImage: me?.profileImage || '',
        type: 'automatic',
        automaticEventType: 'closed',
      });

      // Manual comment if provided
      if (closingComment.trim()) {
        await base44.entities.FaultComment.create({
          faultId: fault.id,
          comment: closingComment.trim(),
          userId: me?.id || '',
          userName: me?.full_name || '',
          userProfileImage: me?.profileImage || '',
          type: 'manual',
        });
      }
      
      // Invalidate all relevant queries to trigger real-time UI update
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['faults'] }),
        queryClient.invalidateQueries({ queryKey: ['all-users'] }),
      ]);
      
      onSuccess?.();
      onOpenChange(false);
      setClosingComment('');
    } catch (error) {
      console.error('Error closing fault:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>אישור סגירת תקלה</DialogTitle>
        </DialogHeader>

        {/* Show original image + repair image side by side */}
        {(fault?.image || fault?.repairImage) && (
          <div className={`grid gap-3 ${fault?.image && fault?.repairImage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {fault?.image && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium text-center">תמונה מקורית</p>
                <div className="h-52 rounded-lg overflow-hidden bg-muted border">
                  <img src={fault.image} alt="תקלה מקורית" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {fault?.repairImage && (
              <div className="space-y-1">
                <p className="text-xs text-green-600 font-medium text-center">לאחר התיקון</p>
                <div className="h-52 rounded-lg overflow-hidden bg-muted border-2 border-green-400">
                  <img src={fault.repairImage} alt="לאחר תיקון" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            האם אתה בטוח שברצונך לסגור תקלה זו?
          </p>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium text-foreground">{fault?.faultType}</p>
            <p className="text-xs text-muted-foreground mt-1">{fault?.location}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">הערת סגירה (אופציונלי)</p>
            <Textarea
              value={closingComment}
              onChange={(e) => setClosingComment(e.target.value)}
              placeholder="הוסף הערה לסגירה..."
              className="text-sm resize-none"
              rows={2}
              disabled={loading}
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
            onClick={handleCloseFault}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'סוגר...' : 'סגור תקלה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}