import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Wrench, Flag, XCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import FaultChat from './FaultChat';
import AssignWorkerDialog from './AssignWorkerDialog';
import PriorityDialog from './PriorityDialog';

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

export default function FaultDetailDialog({ open, onOpenChange, fault, users = [], currentUser, onAssignmentChange }) {
  const [hasComments, setHasComments] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [closingFault, setClosingFault] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const isMaintenanceManager = currentUser?.userType === 'מנהל אחזקה';

  const handleCloseFault = async () => {
    setClosingFault(true);
    try {
      await base44.functions.invoke('updateFault', { faultId: fault.id, updates: { status: 'סגור' }, action: 'close' });
      const me = await base44.auth.me();
      await base44.entities.FaultComment.create({
        faultId: fault.id,
        comment: 'התקלה נסגרה ע"י מנהל האחזקה',
        userId: me?.id || '',
        userName: me?.displayName || me?.full_name || '',
        userProfileImage: me?.profileImage || '',
        type: 'automatic',
        automaticEventType: 'closed',
      });
      onAssignmentChange?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to close fault:', err);
    } finally {
      setClosingFault(false);
    }
  };

  useEffect(() => {
    if (!fault?.id || !open) return;
    base44.entities.FaultComment.filter({ faultId: fault.id }, '-created_date', 1)
      .then(data => setHasComments(data.length > 0))
      .catch(() => {});
  }, [fault?.id, open]);

  if (!fault) return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent /></Dialog>;

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
    <>
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
                              {(reportedUser?.displayName || reportedUser?.full_name)?.split(' ').map(n => n[0]).join('').substring(0, 2) || '—'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{reportedUser?.displayName || reportedUser?.full_name || fault.reportedBy?.split('@')[0] || 'משתמש בלתי ידוע'}</span>
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
                            {(assignedUser?.displayName || assignedUser?.full_name)?.split(' ').map(n => n[0]).join('').substring(0, 2) || '—'}
                             </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">{assignedUser?.displayName || assignedUser?.full_name || 'לא משויך'}</span>
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

          {/* Manager actions */}
          {isMaintenanceManager && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <Wrench className="w-4 h-4 text-primary" />
                  שיוך לעובד
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setPriorityDialogOpen(true)}
                >
                  <Flag className="w-4 h-4 text-amber-500" />
                  שינוי דחיפות
                </Button>
              </div>
              {fault.status !== 'סגור' && (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setConfirmCloseOpen(true)}
                  disabled={closingFault}
                >
                  <XCircle className="w-4 h-4" />
                  {closingFault ? 'סוגר...' : 'סגירת תקלה'}
                </Button>
              )}
            </div>
          )}

          {/* Chat */}
          <div className="pt-4 border-t">
            <FaultChat fault={fault} currentUser={currentUser} />
          </div>

            </div>
          </DialogContent>
        </Dialog>

        <AssignWorkerDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          fault={fault}
          users={users}
          onAssignmentChange={() => { onAssignmentChange?.(); }}
        />
        <PriorityDialog
          open={priorityDialogOpen}
          onOpenChange={setPriorityDialogOpen}
          fault={fault}
          onSuccess={() => { onAssignmentChange?.(); }}
        />

        {/* Confirm close dialog */}
        <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
          <DialogContent dir="rtl" className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-right">סגירת תקלה</DialogTitle>
              <DialogDescription className="text-right pt-2">
                האם אתה בטוח שברצונך לסגור את התקלה?<br />
                <span className="font-semibold text-destructive">פעולה זו אינה ניתנת לביטול.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 flex-row-reverse mt-2">
              <Button
                variant="destructive"
                onClick={() => { setConfirmCloseOpen(false); handleCloseFault(); }}
                disabled={closingFault}
              >
                כן, סגור תקלה
              </Button>
              <Button variant="outline" onClick={() => setConfirmCloseOpen(false)}>
                ביטול
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}