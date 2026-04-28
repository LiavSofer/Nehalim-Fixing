import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Building, Home, MoreHorizontal } from 'lucide-react';

const TYPE_LABELS = { dormitory: 'פנימייה', classBuilding: 'בניין כיתות', other: 'אחר' };
const TYPE_ICONS = {
  dormitory: <Home className="w-4 h-4" />,
  classBuilding: <Building className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};
const TYPE_COLORS = {
  dormitory: 'bg-purple-50 text-purple-700 border-purple-200',
  classBuilding: 'bg-blue-50 text-blue-700 border-blue-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};
const EMPTY_FORM = { name: '', type: 'other' };

export default function LocationSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('order'),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (loc) => { setEditing(loc); setForm({ name: loc.name, type: loc.type }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Location.update(editing.id, form);
    } else {
      await base44.entities.Location.create({ ...form, order: locations.length });
    }
    queryClient.invalidateQueries({ queryKey: ['locations'] });
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Location.delete(id);
    queryClient.invalidateQueries({ queryKey: ['locations'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">מיקומים</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> הוסף
        </Button>
      </div>

      {['dormitory', 'classBuilding', 'other'].map(type => {
        const group = locations.filter(l => l.type === type);
        if (!group.length) return null;
        return (
          <div key={type} className="mb-4">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1.5 border mb-2 ${TYPE_COLORS[type]}`}>
              {TYPE_ICONS[type]} {TYPE_LABELS[type]}
            </span>
            <div className="border border-border bg-card rounded-xl overflow-hidden">
              {group.map(loc => (
                <div key={loc.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30">
                  <span className="text-sm">{loc.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(loc)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {locations.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">אין מיקומים מוגדרים עדיין</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? 'עריכת מיקום' : 'מיקום חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>שם המיקום</Label>
              <Input placeholder='למשל: פנימייה א׳' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dormitory">🏠 פנימייה</SelectItem>
                  <SelectItem value="classBuilding">🏫 בניין כיתות</SelectItem>
                  <SelectItem value="other">📍 אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}