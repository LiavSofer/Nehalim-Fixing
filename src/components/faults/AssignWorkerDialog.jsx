import React, { useState } from 'react';
import { useDialogBackHandler } from '@/hooks/useDialogBackHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';

export default function AssignWorkerDialog({ open, onOpenChange, fault, users, onAssignmentChange }) {
  useDialogBackHandler(open, () => onOpenChange(false));
  const [selectedWorker, setSelectedWorker] = useState(fault?.assignedTo || '');
  const [saving, setSaving] = useState(false);

  // Filter maintenance workers + managers (can assign to self)
  const maintenanceWorkers = users.filter(user => user.userType === 'אב בית' || user.userType === 'מנהל אחזקה');

  const handleAssign = async () => {
    setSaving(true);
    try {
      const updateData = {};
      if (selectedWorker) {
        updateData.assignedTo = selectedWorker;
        if (fault.status === 'ממתין') {
          updateData.status = 'בטיפול';
        }
      } else {
        updateData.assignedTo = null;
        if (fault.status === 'בטיפול') {
          updateData.status = 'ממתין';
        }
      }
      const response = await base44.functions.invoke('updateFault', { faultId: fault.id, updates: updateData, action: 'assign' });
      if (response.data?.error) throw new Error(response.data.error);

      // Add automatic comment when assigning to a worker
      if (selectedWorker) {
        const worker = users.find(u => u.id === selectedWorker);
        const me = await base44.auth.me();
        const workerDisplayName = worker ? (worker.displayName || worker.full_name) : null;
        await base44.entities.FaultComment.create({
          faultId: fault.id,
          comment: `התקלה הועברה לטיפול${workerDisplayName ? ` - ${workerDisplayName}` : ''}`,
          userId: me?.id || '',
          userName: me?.displayName || me?.full_name || '',
          userProfileImage: me?.profileImage || '',
          type: 'automatic',
          automaticEventType: 'assigned',
        });
      }

      onAssignmentChange?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to assign worker:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שיוך עובד</DialogTitle>
          <DialogDescription>בחר עובד אחזקה או אב בית להקצאת המשימה</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Workers Grid */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">בחר עובד</Label>
            {maintenanceWorkers.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted text-center text-sm text-muted-foreground">
                אין עובדי אחזוקה מוגדרים
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {/* Unassign option */}
                <button
                  onClick={() => setSelectedWorker('')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    !selectedWorker ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center text-lg">
                    —
                  </div>
                  <span className="text-xs text-muted-foreground">ללא</span>
                  {!selectedWorker && <Check className="w-3 h-3 text-primary absolute" />}
                </button>

                {maintenanceWorkers.map(worker => {
                  const isSelected = selectedWorker === worker.id;
                  const workerName = worker.displayName || worker.full_name;
                  const initials = workerName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
                  return (
                    <button
                      key={worker.id}
                      onClick={() => setSelectedWorker(worker.id)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <Avatar className="h-10 w-10">
                        {worker.profileImage && <AvatarImage src={worker.profileImage} />}
                        <AvatarFallback className="text-sm font-semibold bg-primary/15 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-center leading-tight line-clamp-2">{workerName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>


        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
          <Button onClick={handleAssign} disabled={saving || maintenanceWorkers.length === 0}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}