import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>שיוך עובד וקביעת דחיפות</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workers List */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">בחר עובד אחזוקה</Label>
            {maintenanceWorkers.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted text-center text-sm text-muted-foreground">
                אין עובדי אחזוקה מוגדרים
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                <button
                  onClick={() => setSelectedWorker('')}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-right ${
                    !selectedWorker ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                  }`}
                >
                  <div className="text-sm">ללא הקצאה</div>
                </button>
                {maintenanceWorkers.map(worker => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-right ${
                      selectedWorker === worker.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {worker.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">{worker.full_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">דחיפות</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority" className="text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-center">
                <SelectItem value="גבוהה" className="text-red-600 font-medium">🔴 גבוהה</SelectItem>
                <SelectItem value="בינונית" className="text-amber-600 font-medium">🟡 בינונית</SelectItem>
                <SelectItem value="נמוכה" className="text-blue-600 font-medium">🔵 נמוכה</SelectItem>
                <SelectItem value="לא מוגדר" className="text-gray-600 font-medium">⚪ לא מוגדר</SelectItem>
              </SelectContent>
            </Select>
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