import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Wrench } from 'lucide-react';

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

  const handleDelete = async (id) => {
    await base44.entities.FaultCategory.delete(id);
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
        <div className="border border-border bg-card rounded-xl overflow-hidden">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30">
              <span className="text-sm">{cat.name}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
          ))}
        </div>
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