import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Wrench, ChevronDown } from 'lucide-react';
import FaultCard from '@/components/faults/FaultCard';
import PageHeader from '@/components/layout/PageHeader';

import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const STATUS_TABS = [
  { label: 'ממתינות', value: 'ממתין', color: 'text-yellow-600', dot: 'bg-yellow-400', activeBorder: 'border-yellow-400', bg: 'bg-yellow-50' },
  { label: 'בטיפול', value: 'בטיפול', color: 'text-blue-600', dot: 'bg-blue-400', activeBorder: 'border-blue-400', bg: 'bg-blue-50' },
  { label: 'לאישור', value: 'ממתין לאישור', color: 'text-orange-600', dot: 'bg-orange-400', activeBorder: 'border-orange-400', bg: 'bg-orange-50' },
  { label: 'סגורות', value: 'סגור', color: 'text-green-600', dot: 'bg-green-400', activeBorder: 'border-green-400', bg: 'bg-green-50' },
];

const SORT_OPTIONS = [
  { value: 'worker', label: 'לפי עובד' },
  { value: 'priority', label: 'לפי דחיפות' },
  { value: 'category', label: 'לפי קטגוריה' },
  { value: 'date_desc', label: 'תאריך: חדש לישן' },
  { value: 'date_asc', label: 'תאריך: ישן לחדש' },
];

const PRIORITY_ORDER = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2, 'לא מוגדר': 3 };

export default function CampusFaults() {
  const { onDataReady } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('ממתין');
  const [sortBy, setSortBy] = useState('date_desc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  const { data: faults, isLoading } = useQuery({
    queryKey: ['faults'],
    queryFn: () => base44.entities.Fault.list('-created_date'),
    initialData: [],
  });

  useEffect(() => {
    if (!isLoading && onDataReady) onDataReady();
  }, [isLoading]);

  useEffect(() => {
    const unsubscribe = base44.entities.Fault.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: users } = useQuery({
    queryKey: ['all-users-campus'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageUsers', { action: 'list' });
      return res.data.users || [];
    },
    initialData: [],
  });

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const statusFaults = useMemo(() => {
    const base = faults.filter(f => f.status === activeStatus);
    if (activeStatus === 'סגור') {
      return base.filter(f => new Date(f.updated_date) >= startOfCurrentMonth);
    }
    return base;
  }, [faults, activeStatus]);

  const groupedFaults = useMemo(() => {
    const sorted = [...statusFaults];

    if (sortBy === 'priority') {
      sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));
      const groups = {};
      sorted.forEach(f => {
        const key = f.priority || 'לא מוגדר';
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });
      return Object.entries(groups).map(([key, items]) => ({ key, label: key, items }));
    }

    if (sortBy === 'worker') {
      const groups = {};
      sorted.sort((a, b) => {
        const aUser = users.find(u => u.id === a.assignedTo);
        const bUser = users.find(u => u.id === b.assignedTo);
        return (aUser?.full_name || 'תתת').localeCompare(bUser?.full_name || 'תתת', 'he');
      });
      sorted.forEach(f => {
        const worker = users.find(u => u.id === f.assignedTo);
        const key = f.assignedTo || '__unassigned__';
        if (!groups[key]) groups[key] = { label: worker?.full_name || 'לא משויך', worker, items: [] };
        groups[key].items.push(f);
      });
      return Object.values(groups).map(g => ({ key: g.label, label: g.label, worker: g.worker, items: g.items }));
    }

    if (sortBy === 'category') {
      sorted.sort((a, b) => (a.faultType || '').localeCompare(b.faultType || '', 'he'));
      const groups = {};
      sorted.forEach(f => {
        const key = f.faultType || 'ללא קטגוריה';
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });
      return Object.entries(groups).map(([key, items]) => ({ key, label: key, items }));
    }

    if (sortBy === 'date_desc' || sortBy === 'date_asc') {
      sorted.sort((a, b) => {
        const diff = new Date(b.created_date) - new Date(a.created_date);
        return sortBy === 'date_asc' ? -diff : diff;
      });
      const groups = {};
      sorted.forEach(f => {
        const key = format(new Date(f.created_date), 'MMMM yyyy', { locale: he });
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });
      return Object.entries(groups).map(([key, items]) => ({ key, label: key, items }));
    }

    return [{ key: 'all', label: null, items: sorted }];
  }, [statusFaults, sortBy, users]);

  const stats = {
    'ממתין': faults.filter(f => f.status === 'ממתין').length,
    'בטיפול': faults.filter(f => f.status === 'בטיפול').length,
    'ממתין לאישור': faults.filter(f => f.status === 'ממתין לאישור').length,
    'סגור': faults.filter(f => f.status === 'סגור').length,
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || '';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <PageHeader icon={Wrench} title="קריאות טכניות" subtitle="סקירת כל התקלות במוסד" />

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 pb-1">
        {STATUS_TABS.map((tab, i) => {
          const count = stats[tab.value] ?? 0;
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={`w-[calc(50%-0.25rem)] md:w-auto flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all whitespace-nowrap ${
                isActive ? `${tab.bg} ${tab.activeBorder} ${tab.color}` : 'bg-card border-transparent text-muted-foreground hover:border-border'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Sort control */}
      <div className="flex justify-end mb-4 relative">
        <button
          onClick={() => setSortMenuOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border bg-card hover:bg-muted transition-colors"
        >
          {currentSortLabel}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {sortMenuOpen && (
          <div className="absolute top-9 left-0 z-50 bg-card border rounded-xl shadow-lg py-1 min-w-[160px]">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setSortMenuOpen(false); }}
                className={`w-full text-right px-4 py-2 text-sm hover:bg-muted transition-colors ${sortBy === opt.value ? 'font-semibold text-primary' : 'text-foreground'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fault List */}
      {!isLoading ? (
        statusFaults.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{activeStatus === 'סגור' ? 'אין תקלות סגורות החודש' : 'הרשימה ריקה'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedFaults.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <div className="flex items-center gap-2 mb-2">
                    {sortBy === 'worker' && (
                      <Avatar className="h-6 w-6">
                        {group.worker?.profileImage && <AvatarImage src={group.worker.profileImage} />}
                        <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                          {group.label === 'לא משויך' ? '—' : group.label.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <h2 className="text-sm font-semibold text-foreground">
                      {group.label}
                      <span className="mr-1.5 text-xs font-normal text-muted-foreground">· {group.items.length}</span>
                    </h2>
                  </div>
                )}
                <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                  {group.items.map((fault) => {
                    const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                    const reportedUser = users.find(u => u.email === fault.reportedBy);
                    return (
                      <FaultCard
                        key={fault.id}
                        fault={fault}
                        assignedUser={assignedUser}
                        reportedUser={reportedUser}
                        isMaintenanceManager={false}
                        isMadrich={false}
                        users={users}
                        currentUser={user}
                        onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {activeStatus === 'סגור' && faults.filter(f => f.status === 'סגור' && new Date(f.updated_date) < startOfCurrentMonth).length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-muted/30">
                📦 {faults.filter(f => f.status === 'סגור' && new Date(f.updated_date) < startOfCurrentMonth).length} תקלות ישנות נמצאות בארכיון ואינן מוצגות
              </div>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}