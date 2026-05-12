import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wrench, Plus, CheckCircle2, ChevronDown } from 'lucide-react';
import FaultForm from '@/components/faults/FaultForm';
import FaultCard from '@/components/faults/FaultCard';
import CloseFaultDialog from '@/components/faults/CloseFaultDialog';
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

export default function Faults() {
  const { onDataReady } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('ממתין');
  const [sortBy, setSortBy] = useState('date_desc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFault, setEditingFault] = useState(null);
  const [closeFaultOpen, setCloseFaultOpen] = useState(false);
  const [faultToClose, setFaultToClose] = useState(null);
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

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.Fault.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageUsers', { action: 'list' });
      return res.data.users || [];
    },
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ['faultCategories'],
    queryFn: () => base44.entities.FaultCategory.list('order'),
    initialData: [],
  });

  const isMaintenanceManager = user?.userType === 'מנהל אחזקה';
  const isMadrich = user?.userType === 'צוות מדווח';

  const visibleFaults = isMadrich ? faults.filter(f => f.reportedBy === user?.email) : faults;

  const statusFaults = useMemo(() => {
    if (isMadrich && activeStatus === 'בטיפול') {
      return visibleFaults.filter(f => f.status === 'בטיפול' || f.status === 'ממתין לאישור');
    }
    return visibleFaults.filter(f => f.status === activeStatus);
  }, [visibleFaults, activeStatus, isMadrich]);

  // Group and sort logic
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
        const aName = aUser?.displayName || aUser?.full_name || 'תתת';
        const bName = bUser?.displayName || bUser?.full_name || 'תתת';
        return aName.localeCompare(bName, 'he');
      });
      sorted.forEach(f => {
        const worker = users.find(u => u.id === f.assignedTo);
        const key = f.assignedTo || '__unassigned__';
        if (!groups[key]) groups[key] = { label: (worker?.displayName || worker?.full_name) || 'לא משויך', worker, items: [] };
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
    pending: visibleFaults.filter(f => f.status === 'ממתין').length,
    inProgress: isMadrich
      ? visibleFaults.filter(f => f.status === 'בטיפול' || f.status === 'ממתין לאישור').length
      : visibleFaults.filter(f => f.status === 'בטיפול').length,
    awaitingApproval: visibleFaults.filter(f => f.status === 'ממתין לאישור').length,
    closed: visibleFaults.filter(f => f.status === 'סגור').length,
  };

  const statsByTab = { 'ממתין': stats.pending, 'בטיפול': stats.inProgress, 'ממתין לאישור': stats.awaitingApproval, 'סגור': stats.closed };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['faults'] });
    setDialogOpen(false);
    setEditingFault(null);
  };

  const handleEdit = (fault) => { setEditingFault(fault); setDialogOpen(true); };
  const handleCloseFault = (fault) => { setFaultToClose(fault); setCloseFaultOpen(true); };

  const visibleTabs = isMadrich
    ? STATUS_TABS.filter(t => t.value !== 'ממתין לאישור')
    : STATUS_TABS;

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || '';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader icon={Wrench} title="קריאות טכניות" subtitle="ניהול ודיווח על תקלות" />

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 pb-1">
        {visibleTabs.map((tab, i) => {
          const count = statsByTab[tab.value] ?? 0;
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
      {!isMadrich && (
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
      )}

      {/* Dialog for new/edit fault */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingFault(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFault ? 'עריכת תקלה' : 'תקלה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FaultForm
              users={users}
              onSuccess={handleSuccess}
              editingFault={editingFault}
              showAdvancedFields={isMaintenanceManager}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Add Button */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-24 left-6 md:bottom-8 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
        title="תקלה חדשה"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Close Fault Dialog */}
      <CloseFaultDialog
        open={closeFaultOpen}
        onOpenChange={setCloseFaultOpen}
        fault={faultToClose}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
      />

      {/* Fault List */}
      {!isLoading ? (
        statusFaults.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">הרשימה ריקה</p>
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
                     <div key={fault.id}>
                        <FaultCard
                         fault={fault}
                         assignedUser={assignedUser}
                         reportedUser={reportedUser}
                         isMaintenanceManager={isMaintenanceManager}
                         isMadrich={isMadrich}
                         onEdit={handleEdit}
                         users={users}
                         currentUser={user}
                         onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                        />

                        </div>
                    );
                  })}
                </div>
              </div>
            ))}
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