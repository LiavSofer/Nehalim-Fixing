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
      className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors rounded-lg group"
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="שם מלא"
              className="h-7 text-xs"
            />
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="מספר טלפון"
              className="h-7 text-xs"
              dir="ltr"
            />
          </div>
        ) : (
          <>
            <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                  <Phone className="w-3 h-3" />
                  {user.phone}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Role selector */}
      {!editing && (
        <Select defaultValue={userRole} key={userRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-32 h-7 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
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

      {/* Edit / Save / Cancel */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {editing ? (
          <>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => setEditing(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity hover:bg-muted" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

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
    <div className="p-4 md:p-8 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">ניהול משתמשים</h1>
          <p className="text-sm text-muted-foreground">{users.length} משתמשים רשומים</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          כל המשתמשים
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
            tab === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          ממתינים לאישור
          {pendingUsers.length > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              tab === 'pending' ? 'bg-white/30 text-white' : 'bg-orange-500 text-white'
            }`}>
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם..."
          className="pr-9 text-sm"
        />
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-36" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {tab === 'pending' ? 'אין משתמשים ממתינים לאישור' : 'לא נמצאו משתמשים'}
              </p>
            </div>
          ) : (
            <motion.div layout>
              {filtered.map(user => (
                <UserRow key={user.id} user={user} onUpdate={handleUpdate} />
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}