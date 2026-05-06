import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import FaultChat from './FaultChat';

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

export default function FaultDetailDialog({ open, onOpenChange, fault, users = [], currentUser }) {
  const [hasComments, setHasComments] = useState(false);

  useEffect(() => {
    if (!fault?.id || !open) return;
    base44.entities.FaultComment.filter({ faultId: fault.id }, '-created_date', 1)
      .then(data => setHasComments(data.length > 0))
      .catch(() => {});
  }, [fault?.id, open]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl" style={{paddingBottom: '1.5rem'}}>
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

          {/* Status, Priority and Type */}
          <div className="flex flex-wrap gap-4 justify-center">
            {fault.faultType && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">סוג תקלה</span>
                <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">{fault.faultType}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">סטטוס</span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                fault.status === 'ממתין' ? 'bg-yellow-50 text-yellow-700' :
                fault.status === 'בטיפול' ? 'bg-blue-50 text-blue-700' :
                fault.status === 'ממתין לאישור' ? 'bg-orange-50 text-orange-700' :
                'bg-green-50 text-green-700'
              }`}>{fault.status}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">דחיפות</span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                fault.priority === 'גבוהה' ? 'bg-red-50 text-red-700' :
                fault.priority === 'בינונית' ? 'bg-amber-50 text-amber-700' :
                'bg-gray-50 text-gray-700'
              }`}>{fault.priority}</span>
            </div>
          </div>

          {/* Location and Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">מיקום</span>
            </div>
            <p className="text-base text-foreground text-center">
              {fault.location}{fault.roomNumber ? ` - ${fault.roomNumber}` : ''}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block text-center">תיאור</span>
            <p className="text-base text-foreground text-center">{fault.description}</p>
          </div>

          {/* Timeline details */}
          <div className="space-y-4 pt-4 border-t">
            {/* Created by and Assigned to */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">נוצר ע"י</span>
                <div className="flex items-center gap-2">
                  {(() => {
                      const reportedUser = users.find(u => u.email === fault.reportedBy);
                      return (
                        <>
                          <Avatar className="h-6 w-6">
                            {reportedUser?.profileImage && <AvatarImage src={reportedUser.profileImage} />}
                            <AvatarFallback className="text-[10px]">
                              {reportedUser?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '—'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{reportedUser?.full_name || fault.reportedBy?.split('@')[0] || 'משתמש בלתי ידוע'}</span>
                        </>
                      );
                    })()}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">משויך ל</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const assignedUser = users.find(u => u.id === fault.assignedTo);
                    return (
                      <>
                        <Avatar className="h-6 w-6">
                          {assignedUser?.profileImage && <AvatarImage src={assignedUser.profileImage} />}
                          <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                            {assignedUser?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '—'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{assignedUser?.full_name || 'לא משויך'}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Other timeline details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">תאריך יצירה</span>
                </div>
                <p className="text-sm text-foreground text-center">{formatDate(createdDate)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">תאריך עדכון אחרון</span>
                </div>
                <p className="text-sm text-foreground text-center">{formatDate(updatedDate)}</p>
              </div>

              {getTimeDetails() && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{fault.status === 'בטיפול' ? 'זמן בטיפול' : 'זמן ממתינה'}</span>
                  </div>
                  <p className="text-sm text-foreground font-medium text-primary text-center">{getTimeDetails()}</p>
                </div>
              )}
            </div>

          {/* Chat */}
          <div className="pt-4 border-t">
            <FaultChat fault={fault} currentUser={currentUser} />
          </div>

            </div>
          </DialogContent>
          </Dialog>
          );
          }