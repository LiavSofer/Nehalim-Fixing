import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Wrench } from 'lucide-react';
import SortableList from './SortableList';

const DEFAULT_CATEGORIES = ['חשמל', 'אינסטלציה', 'צבע ושפכטל', 'ניקיון', 'אחר'];

export default function FaultCategorySettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['faultCategories'],
    queryFn: () => base44.entities.FaultCategory.list('order'),
  });

  const openNew = () => { setEditing(null); setName(''); setDialogOpen(true); };
  const openEdit = (cat) => { setEditing(cat); setName(cat.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.FaultCategory.update(editing.id, { name: name.trim() });
    } else {
      await base44.entities.FaultCategory.create({ name: name.trim(), order: categories.length });
    }
    queryClient.invalidateQueries({ queryKey: ['faultCategories'] });
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (cat) => {
    await base44.entities.FaultCategory.delete(cat.id);
    queryClient.invalidateQueries({ queryKey: ['faultCategories'] });
  };

  const handleReorder = async (newItems) => {
    // Optimistic update
    queryClient.setQueryData(['faultCategories'], newItems);
    await Promise.all(newItems.map((cat, i) => base44.entities.FaultCategory.update(cat.id, { order: i })));
    queryClient.invalidateQueries({ queryKey: ['faultCategories'] });
  };

  const seedDefaults = async () => {
    setSeeding(true);
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await base44.entities.FaultCategory.create({ name: DEFAULT_CATEGORIES[i], order: i });
    }
    queryClient.invalidateQueries({ queryKey: ['faultCategories'] });
    setSeeding(false);
  };

  // "אחר" should always be last — find it
  const otherIndex = categories.findIndex(c => c.name === 'אחר');
  const lockLast = otherIndex === categories.length - 1 && otherIndex !== -1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">קטגוריות תקלות</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> הוסף
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-6">
          <Wrench className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">אין קטגוריות מוגדרות עדיין</p>
          <Button variant="outline" size="sm" onClick={seedDefaults} disabled={seeding}>
            {seeding ? 'טוען...' : 'טען קטגוריות ברירת מחדל'}
          </Button>
        </div>
      ) : (
        <SortableList
          items={categories}
          onReorder={handleReorder}
          onEdit={openEdit}
          onDelete={handleDelete}
          lockLast={lockLast}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            <Label>שם הקטגוריה</Label>
            <Input placeholder="למשל: חשמל, אינסטלציה..." value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}