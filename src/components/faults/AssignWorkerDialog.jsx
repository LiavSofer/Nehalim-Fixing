import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';

export default function AssignWorkerDialog({ open, onOpenChange, fault, users, onAssignmentChange }) {
  const [selectedWorker, setSelectedWorker] = useState(fault?.assignedTo || '');
  const [priority, setPriority] = useState(fault?.priority || 'לא מוגדר');
  const [saving, setSaving] = useState(false);

  // Filter maintenance workers only
  const maintenanceWorkers = users.filter(user => 
    ['אב בית', 'עובד אחזקה'].includes(user.role)
  );

  const handleAssign = async () => {
    setSaving(true);
    try {
      const updateData = { priority };
      if (selectedWorker) {
        updateData.assignedTo = selectedWorker;
        // Auto-set status to "בטיפול" when assigning
        if (fault.status === 'ממתין') {
          updateData.status = 'בטיפול';
        }
      }
      await base44.entities.Fault.update(fault.id, updateData);
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
          <DialogTitle>שיוך עובד וקביעת דחיפות</DialogTitle>
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
                  const initials = worker.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
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
                      <span className="text-xs text-center leading-tight line-clamp-2">{worker.full_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground">דחיפות</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'גבוהה', label: 'גבוהה', color: 'bg-red-50 border-red-200 text-red-700', activeColor: 'bg-red-500 border-red-500 text-white' },
                { value: 'בינונית', label: 'בינונית', color: 'bg-amber-50 border-amber-200 text-amber-700', activeColor: 'bg-amber-500 border-amber-500 text-white' },
                { value: 'נמוכה', label: 'נמוכה', color: 'bg-blue-50 border-blue-200 text-blue-700', activeColor: 'bg-blue-500 border-blue-500 text-white' },
                { value: 'לא מוגדר', label: 'ללא', color: 'bg-muted border-border text-muted-foreground', activeColor: 'bg-gray-500 border-gray-500 text-white' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`py-2 px-1 rounded-lg border-2 text-xs font-semibold transition-all ${
                    priority === p.value ? p.activeColor : p.color + ' hover:opacity-80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
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