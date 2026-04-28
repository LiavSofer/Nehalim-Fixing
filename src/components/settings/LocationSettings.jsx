import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Building, Home, MoreHorizontal } from 'lucide-react';
import SortableList from './SortableList';

const TYPE_LABELS = { dormitory: 'פנימייה', classBuilding: 'בניין כיתות', other: 'אחר' };
const TYPE_ICONS = {
  dormitory: <Home className="w-3 h-3" />,
  classBuilding: <Building className="w-3 h-3" />,
  other: <MoreHorizontal className="w-3 h-3" />,
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

  const handleDelete = async (loc) => {
    await base44.entities.Location.delete(loc.id);
    queryClient.invalidateQueries({ queryKey: ['locations'] });
  };

  const handleReorder = async (newItems) => {
    // Optimistic update
    queryClient.setQueryData(['locations'], newItems);
    // Persist new order
    await Promise.all(newItems.map((loc, i) => base44.entities.Location.update(loc.id, { order: i })));
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

      {locations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">אין מיקומים מוגדרים עדיין</p>
      ) : (
        <SortableList
          items={locations}
          onReorder={handleReorder}
          onEdit={openEdit}
          onDelete={handleDelete}
          renderBadge={(loc) => (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${TYPE_COLORS[loc.type]}`}>
              {TYPE_ICONS[loc.type]} {TYPE_LABELS[loc.type]}
            </span>
          )}
        />
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