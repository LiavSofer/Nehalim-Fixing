import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function ManagerReviewDialog({ open, onOpenChange, fault, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [returnComment, setReturnComment] = useState('');
  const queryClient = useQueryClient();

  const handleApprove = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    await base44.functions.invoke('updateFault', { faultId: fault.id, updates: { status: 'סגור' }, action: 'close' });
    await base44.entities.FaultComment.create({
      faultId: fault.id,
      comment: 'מאשר טיפול - התקלה נסגרה',
      userId: me?.id || '',
      userName: me?.full_name || '',
      userProfileImage: me?.profileImage || '',
      type: 'automatic',
      automaticEventType: 'closed'
    });
    await queryClient.invalidateQueries({ queryKey: ['faults'] });
    onSuccess?.();
    onOpenChange(false);
    setLoading(false);
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) return;
    setLoading(true);
    const me = await base44.auth.me();
    await base44.entities.Fault.update(fault.id, { status: 'בטיפול' });
    await base44.entities.FaultComment.create({
      faultId: fault.id,
      comment: returnComment.trim(),
      userId: me?.id || '',
      userName: me?.full_name || '',
      userProfileImage: me?.profileImage || '',
      type: 'automatic',
      automaticEventType: 'returnedToWorker'
    });
    await queryClient.invalidateQueries({ queryKey: ['faults'] });
    onSuccess?.();
    onOpenChange(false);
    setReturnComment('');
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>צפייה בתיקון</DialogTitle>
        </DialogHeader>

        {/* Images */}
        {(fault?.image || fault?.repairImage) &&
        <div className={`grid gap-3 ${fault?.image && fault?.repairImage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {fault?.image &&
          <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium text-center">תמונה מקורית</p>
                <div className="h-44 rounded-lg overflow-hidden bg-muted border">
                  <img src={fault.image} alt="תקלה מקורית" className="w-full h-full object-cover" />
                </div>
              </div>
          }
            {fault?.repairImage &&
          <div className="space-y-1">
                <p className="text-xs text-green-600 font-medium text-center">לאחר התיקון</p>
                <div className="h-44 rounded-lg overflow-hidden bg-muted border-2 border-green-400">
                  <img src={fault.repairImage} alt="לאחר תיקון" className="w-full h-full object-cover" />
                </div>
              </div>
          }
          </div>
        }

        {/* Fault info */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-0.5">
          {fault?.title && <p className="text-sm font-bold text-foreground">{fault.title}</p>}
          <p className="text-sm font-medium text-foreground hidden">{fault?.faultType}</p>
          <p className="text-xs text-muted-foreground">{fault?.location}{fault?.roomNumber ? ` - ${fault.roomNumber}` : ''}</p>
          {fault?.description && <p className="text-xs text-muted-foreground pt-0.5">{fault.description}</p>}
        </div>

        {/* Return comment */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">הוספת הערה:</Label>
          <Textarea
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
            placeholder="הסבר לעובד מה צריך לשפר..."
            className="resize-none h-20 text-sm"
            disabled={loading} />
          
        </div>

        <DialogFooter className="flex gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 gap-2 flex-1">
            
            <CheckCircle2 className="w-4 h-4" />
            אישור תיקון
          </Button>
          <Button
            onClick={handleReturn}
            disabled={loading || !returnComment.trim()}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 gap-2 flex-1">
            
            <RotateCcw className="w-4 h-4" />
            החזרה לעובד
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}