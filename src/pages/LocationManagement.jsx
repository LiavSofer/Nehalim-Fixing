import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2, Edit2, Building, Home, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_LABELS = {
  dormitory: 'פנימייה',
  classBuilding: 'בניין כיתות',
  other: 'אחר',
};

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

export default function LocationManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('order'),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (loc) => {
    setEditing(loc);
    setForm({ name: loc.name, type: loc.type });
    setDialogOpen(true);
  };

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
    <div className="p-4 md:p-8 max-w-2xl mx-auto" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">ניהול מיקומים</h1>
              <p className="text-xs text-muted-foreground">הגדרת מיקומים לדיווח על תקלות</p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            מיקום חדש
          </Button>
        </div>
      </motion.div>

      {/* Grouped by type */}
      {['dormitory', 'classBuilding', 'other'].map(type => {
        const group = locations.filter(l => l.type === type);
        if (group.length === 0) return null;
        return (
          <div key={type} className="mb-6">
            <h2 className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1.5 border mb-3 ${TYPE_COLORS[type]}`}>
              {TYPE_ICONS[type]}
              {TYPE_LABELS[type]}
            </h2>
            <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
              {group.map((loc, i) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-sm">{loc.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(loc)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {locations.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">אין מיקומים מוגדרים עדיין</p>
          <Button variant="outline" onClick={openNew} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            הוסף מיקום ראשון
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת מיקום' : 'מיקום חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>שם המיקום</Label>
              <Input
                placeholder="למשל: פנימייה א', בניין כיתות מדעים"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dormitory">🏠 פנימייה (תתי-מיקום: מספר חדר)</SelectItem>
                  <SelectItem value="classBuilding">🏫 בניין כיתות (תתי-מיקום: כיתה)</SelectItem>
                  <SelectItem value="other">📍 אחר (ללא תת-מיקום)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'dormitory' && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                מספר החדר ייקבע לפי סדר האות — פנימייה א' = 100-199, פנימייה ב' = 200-299 וכו'.
              </p>
            )}
            {form.type === 'classBuilding' && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                שם הכיתה יוקלד חופשי בפורמט: ז5, יב3 וכו'.
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}