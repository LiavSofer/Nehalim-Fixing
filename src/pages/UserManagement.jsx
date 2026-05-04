import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Users, Mail, Phone, Search, Clock, UserCheck, Pencil, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ROLES = ['ללא הרשאה', 'צוות מדווח', 'אב בית', 'מנהל אחזקה', 'מפתח'];

const ROLE_COLORS = {
  'ללא הרשאה': 'bg-orange-100 text-orange-700 border-orange-200',
  'צוות מדווח': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'אב בית': 'bg-amber-50 text-amber-700 border-amber-200',
  'מנהל אחזקה': 'bg-primary/10 text-primary border-primary/20',
  'מפתח': 'bg-purple-50 text-purple-700 border-purple-200',
};

function UserRow({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [name, setName] = useState(user.displayName || user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('manageUsers', { action: 'update', userId: user.id, data: { displayName: name, phone } });
      setEditing(false);
      onUpdate();
    } catch (err) {
      const msg = err?.response?.data?.error || 'שגיאה בשמירה';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      await base44.functions.invoke('manageUsers', { action: 'update', userId: user.id, data: { role: newRole } });
      onUpdate();
    } catch (err) {
      const msg = err?.response?.data?.error || 'שגיאה בעדכון התפקיד';
      toast.error(msg);
    }
  };

  const displayName = user.displayName || user.full_name || 'ללא שם';
  const userRole = user.role || 'ללא הרשאה';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
      className="relative flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/50 transition-colors group"
    >
      {/* Avatar + Info in one row */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden ${user.profileImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={() => user.profileImage && setPhotoOpen(true)}
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary">{displayName[0] || '?'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-1">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="שם מלא"
                className="h-6 text-xs"
              />
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="מספר טלפון"
                className="h-6 text-xs"
                dir="ltr"
              />
            </div>
          ) : (
            <>
              <p className="font-semibold text-foreground text-sm leading-none">{displayName}</p>
              <div className="flex flex-col gap-0 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {user.phone}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Role selector */}
      {!editing && (
        <Select defaultValue={userRole} key={userRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-28 h-7 text-xs opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(role => (
              <SelectItem key={role} value={role}>
                <Badge variant="outline" className={`text-xs px-2 py-0 ${ROLE_COLORS[role]}`}>
                  {role}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Edit / Save / Cancel - positioned in corner */}
      {editing ? (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => setEditing(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <Button size="icon" variant="ghost" className="absolute top-1 left-1 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted" onClick={() => setEditing(true)}>
          <Pencil className="w-3 h-3" />
        </Button>
      )}

      {/* Photo lightbox */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-sm p-2 flex flex-col items-center gap-2">
          <img src={user.profileImage} alt={displayName} className="w-full rounded-xl object-contain max-h-[70vh]" />
          <p className="text-sm font-medium text-foreground">{displayName}</p>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'pending'

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageUsers', { action: 'list' });
      return res.data.users || [];
    },
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const ROLE_ORDER = { 'מנהל אחזקה': 0, 'אב בית': 1, 'צוות מדווח': 2, 'מפתח': 3, 'ללא הרשאה': 4 };

  const pendingUsers = users.filter(u => (u.role || 'ללא הרשאה') === 'ללא הרשאה');

  const filtered = (tab === 'pending' ? pendingUsers : users)
    .filter(u => {
      const name = (u.displayName || u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = search.toLowerCase();
      return name.includes(q) || email.includes(q);
    })
    .sort((a, b) => {
      const aOrder = ROLE_ORDER[a.role || 'ללא הרשאה'] ?? 5;
      const bOrder = ROLE_ORDER[b.role || 'ללא הרשאה'] ?? 5;
      return aOrder - bOrder;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ניהול משתמשים</h1>
              <p className="text-sm text-muted-foreground mt-1">{users.length} משתמשים רשומים בסך הכל</p>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              כל המשתמשים
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'bg-card text-orange-600 border border-orange-200 hover:border-orange-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              ממתינים לאישור
              {pendingUsers.length > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  tab === 'pending' ? 'bg-white/20' : 'bg-orange-500 text-white'
                }`}>
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם או אימייל..."
              className="pr-10 text-sm h-10 bg-card border-border"
            />
          </div>
        </div>

        {/* List Container */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="divide-y">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <Skeleton className="h-8 w-32 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {tab === 'pending' ? 'אין משתמשים ממתינים לאישור' : 'לא נמצאו משתמשים'}
              </p>
            </div>
          ) : (
            <motion.div layout className="divide-y divide-border">
              {filtered.map(user => (
                <UserRow key={user.id} user={user} onUpdate={handleUpdate} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}