import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

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

  const createdDate = new Date(fault.created_date);
  const updatedDate = new Date(fault.updated_date);
  const now = new Date();
  
  const formatDate = (date) => format(date, 'dd.MM.yyyy HH:mm', { locale: he });
  
  const getTimeDetails = () => {
    if (fault.status === 'בטיפול') {
      const hours = differenceInHours(now, createdDate);
      if (hours < 24) {
        return `${hours} שעות בטיפול`;
      }
      return `${Math.round(hours / 24)} ימים בטיפול`;
    } else if (fault.status === 'ממתין') {
      const hours = differenceInHours(now, createdDate);
      if (hours < 24) {
        return `${hours} שעות ממתינה`;
      }
      return `${Math.round(hours / 24)} ימים ממתינה`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{fault.title || fault.faultType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-right">
          {/* Images */}
          {(fault.image || fault.repairImage) && (
            <div className={`grid gap-3 ${fault.image && fault.repairImage ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {fault.image && (
                <div className="space-y-1">
                  {fault.repairImage && <p className="text-xs text-muted-foreground font-medium text-center">תמונה מקורית</p>}
                  <div className="w-full h-52 rounded-lg overflow-hidden bg-muted">
                    <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              {fault.repairImage && (
                <div className="space-y-1">
                  <p className="text-xs text-green-600 font-medium text-center">לאחר התיקון</p>
                  <div className="w-full h-52 rounded-lg overflow-hidden bg-muted border-2 border-green-400">
                    <img src={fault.repairImage} alt="לאחר תיקון" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location and Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">מיקום</span>
            </div>
            <p className="text-base text-foreground">
              {fault.location}{fault.roomNumber ? ` - ${fault.roomNumber}` : ''}
            </p>
          </div>

          {/* Status, Priority and Type in one row */}
          <div className="flex flex-wrap gap-6 justify-end text-xs">
            {fault.faultType && (
              <span className="text-foreground"><span className="text-muted-foreground">סוג תקלה:</span> {fault.faultType}</span>
            )}
            <span className="text-foreground"><span className="text-muted-foreground">סטטוס:</span> {fault.status}</span>
            <span className="text-foreground"><span className="text-muted-foreground">דחיפות:</span> {fault.priority}</span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">תיאור</span>
            <p className="text-base text-foreground">{fault.description}</p>
          </div>

          {/* Timeline details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">תאריך יצירה</span>
              </div>
              <p className="text-sm text-foreground">{formatDate(createdDate)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">תאריך עדכון אחרון</span>
              </div>
              <p className="text-sm text-foreground">{formatDate(updatedDate)}</p>
            </div>

            {getTimeDetails() && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{fault.status === 'בטיפול' ? 'זמן בטיפול' : 'זמן ממתינה'}</span>
                </div>
                <p className="text-sm text-foreground font-medium text-primary">{getTimeDetails()}</p>
              </div>
            )}
          </div>
          </div>
          </DialogContent>
          </Dialog>
          );
          }