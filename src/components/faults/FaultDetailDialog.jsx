import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

const STATUS_COLORS = {
  'ממתין': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'בטיפול': 'bg-blue-100 text-blue-800 border-blue-200',
  'ממתין לאישור': 'bg-orange-100 text-orange-800 border-orange-200',
  'סגור': 'bg-green-100 text-green-800 border-green-200',
};

const PRIORITY_COLORS = {
  'גבוהה': 'bg-red-100 text-red-800 border-red-200',
  'בינונית': 'bg-amber-100 text-amber-800 border-amber-200',
  'לא מוגדר': 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function FaultDetailDialog({ open, onOpenChange, fault }) {
  if (!fault) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fault.faultType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {fault.image && (
            <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
              <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Location and Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">מיקום</span>
            </div>
            <p className="text-base text-foreground">
              {fault.location}
              {fault.roomNumber && <span className="text-muted-foreground"> · חדר/כיתה <strong className="text-foreground">{fault.roomNumber}</strong></span>}
            </p>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">סטטוס</span>
              <Badge className={`${STATUS_COLORS[fault.status]} border text-sm mt-2`}>
                {fault.status}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">דחיפות</span>
              <Badge className={`${PRIORITY_COLORS[fault.priority]} border text-sm mt-2`}>
                {fault.priority}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">תיאור</span>
            <p className="text-base text-foreground">{fault.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}