import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const PRIORITIES = [
  { value: 'גבוהה', label: 'גבוהה', color: 'bg-red-50 border-red-200 text-red-700', activeColor: 'bg-red-500 border-red-500 text-white' },
  { value: 'בינונית', label: 'בינונית', color: 'bg-amber-50 border-amber-200 text-amber-700', activeColor: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'נמוכה', label: 'נמוכה', color: 'bg-blue-50 border-blue-200 text-blue-700', activeColor: 'bg-blue-500 border-blue-500 text-white' },
  { value: 'לא מוגדר', label: 'ללא', color: 'bg-muted border-border text-muted-foreground', activeColor: 'bg-gray-500 border-gray-500 text-white' },
];

export default function PriorityDialog({ open, onOpenChange, fault, onSuccess }) {
  const [priority, setPriority] = useState(fault?.priority || 'לא מוגדר');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const response = await base44.functions.invoke('updateFault', { faultId: fault.id, updates: { priority }, action: 'priority' });
    if (response.data?.error) throw new Error(response.data.error);
    onSuccess?.();
    onOpenChange(false);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs" dir="rtl">
        <DialogHeader>
          <DialogTitle>קביעת דחיפות</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 py-2">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                priority === p.value ? p.activeColor : p.color + ' hover:opacity-80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}