import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function CloseFaultDialog({ open, onOpenChange, fault, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCloseFault = async () => {
    try {
      setLoading(true);
      await base44.entities.Fault.update(fault.id, { status: 'סגור' });
      onSuccess?.();
      onOpenChange(false);
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

        {fault?.image && (
          <div className="w-full h-80 rounded-lg overflow-hidden bg-muted">
            <img 
              src={fault.image} 
              alt="תקלה מתוקנת" 
              className="w-full h-full object-cover"
            />
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