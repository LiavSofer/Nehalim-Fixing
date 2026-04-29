import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, Search, Clock, UserCheck, Pencil, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
  const [name, setName] = useState(user.displayName || user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, { displayName: name, phone });
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  const handleRoleChange = async (newRole) => {
    await base44.entities.User.update(user.id, { role: newRole });
    onUpdate();
  };

  const displayName = user.displayName || user.full_name || 'ללא שם';
  const userRole = user.role || 'ללא הרשאה';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border last:border-0"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{displayName[0] || '?'}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="שם מלא"
              className="h-8 text-sm"
            />
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="מספר טלפון"
              className="h-8 text-sm"
              dir="ltr"
            />
          </div>
        ) : (
          <>
            <p className="font-medium text-foreground truncate">{displayName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {!editing && (
          <Select defaultValue={userRole} key={userRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-36 h-8 text-xs">
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
        {editing ? (
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'pending'

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const pendingUsers = users.filter(u => (u.role || 'ללא הרשאה') === 'ללא הרשאה');

  const filtered = (tab === 'pending' ? pendingUsers : users).filter(u => {
    const name = (u.displayName || u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
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
            <div>
              {filtered.map(user => (
                <UserRow key={user.id} user={user} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}