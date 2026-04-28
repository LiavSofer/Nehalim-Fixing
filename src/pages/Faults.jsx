import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Filter, Plus, CheckCircle2 } from 'lucide-react';
import FaultForm from '@/components/faults/FaultForm';
import FaultCard from '@/components/faults/FaultCard';
import CloseFaultDialog from '@/components/faults/CloseFaultDialog';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Faults() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('ממתין');
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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['faults'] });
    setDialogOpen(false);
    setEditingFault(null);
  };

  const handleEdit = (fault) => {
    setEditingFault(fault);
    setDialogOpen(true);
  };

  const handleCloseFault = (fault) => {
    setFaultToClose(fault);
    setCloseFaultOpen(true);
  };

  const isMaintenanceManager = user?.role === 'מנהל אחזקה';
  const isMadrich = user?.role === 'מדריך';

  // For מדריך - show only faults they reported
  const visibleFaults = isMadrich
    ? faults.filter(f => f.reportedBy === user?.email)
    : faults;

  const filteredFaults = visibleFaults.filter(fault => {
    const statusMatch = statusFilter === 'all' || fault.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || fault.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Stats - for מדריך: merge 'בטיפול' and 'ממתין לאישור' into one 'בטיפול' count
  const stats = {
    total: visibleFaults.length,
    pending: visibleFaults.filter(f => f.status === 'ממתין').length,
    inProgress: isMadrich
      ? visibleFaults.filter(f => f.status === 'בטיפול' || f.status === 'ממתין לאישור').length
      : visibleFaults.filter(f => f.status === 'בטיפול').length,
    awaitingApproval: visibleFaults.filter(f => f.status === 'ממתין לאישור').length,
    closed: visibleFaults.filter(f => f.status === 'סגור').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">קריאות טכניות</h1>
              <p className="text-xs text-muted-foreground">ניהול ודיווח על תקלות</p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl shadow-sm" size="default">
            <Plus className="w-4 h-4" />
            תקלה חדשה
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'ממתינות', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-400', groupValue: 'ממתין', activeBorder: 'border-yellow-400' },
          { label: 'בטיפול', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-400', groupValue: 'בטיפול', activeBorder: 'border-blue-400' },
          ...(!isMadrich ? [{ label: 'לאישור', value: stats.awaitingApproval, color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-400', groupValue: 'ממתין לאישור', activeBorder: 'border-orange-400' }] : []),
          { label: 'סגורות', value: stats.closed, color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-400', groupValue: 'סגור', activeBorder: 'border-green-400' },
        ].map((stat, i) => {
          const isActive = groupBy === stat.groupValue;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setGroupBy(stat.groupValue)}
              className={`rounded-2xl p-4 cursor-pointer transition-all border-2 ${
                isActive
                  ? `${stat.bg} ${stat.activeBorder} shadow-sm`
                  : 'bg-card border-transparent hover:border-border hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${stat.dot}`}></span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog for new/edit fault */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setEditingFault(null);
      }}>
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

      {/* Close Fault Dialog */}
      <CloseFaultDialog 
        open={closeFaultOpen} 
        onOpenChange={setCloseFaultOpen}
        fault={faultToClose}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
      />

      {/* Grouped View */}
      {!isLoading ? (
        <>
           {groupBy !== 'all' && visibleFaults.filter(f => {
              if (isMadrich && groupBy === 'בטיפול') return f.status === 'בטיפול' || f.status === 'ממתין לאישור';
              return f.status === groupBy;
            }).length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">הרשימה ריקה</p>
            </div>
          ) : (
            <div className="space-y-8">
          {/* Waiting */}
          {(groupBy === 'all' || groupBy === 'ממתין') && visibleFaults.filter(f => f.status === 'ממתין').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                ממתינות · {visibleFaults.filter(f => f.status === 'ממתין').length}
              </h2>
              <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                {visibleFaults.filter(f => f.status === 'ממתין').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
                      isMadrich={isMadrich}
                      onEdit={handleEdit}
                      users={users}
                      onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* In Progress */}
          {(groupBy === 'all' || groupBy === 'בטיפול') && visibleFaults.filter(f => isMadrich ? (f.status === 'בטיפול' || f.status === 'ממתין לאישור') : f.status === 'בטיפול').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                בטיפול · {visibleFaults.filter(f => isMadrich ? (f.status === 'בטיפול' || f.status === 'ממתין לאישור') : f.status === 'בטיפול').length}
              </h2>
              <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                {visibleFaults.filter(f => isMadrich ? (f.status === 'בטיפול' || f.status === 'ממתין לאישור') : f.status === 'בטיפול').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
                      isMadrich={isMadrich}
                      onEdit={handleEdit}
                      users={users}
                      onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Waiting for Approval - Only for Maintenance Manager */}
          {isMaintenanceManager && (groupBy === 'all' || groupBy === 'ממתין לאישור') && visibleFaults.filter(f => f.status === 'ממתין לאישור').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                ממתינות לאישור · {visibleFaults.filter(f => f.status === 'ממתין לאישור').length}
              </h2>
              <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                {visibleFaults.filter(f => f.status === 'ממתין לאישור').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <div key={fault.id} className="space-y-2 p-3 border-b last:border-b-0">
                      <FaultCard
                        fault={fault}
                        assignedUser={assignedUser}
                        reportedUser={reportedUser}
                        isMaintenanceManager={isMaintenanceManager}
                        isMadrich={isMadrich}
                        onEdit={handleEdit}
                        users={users}
                        onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                      />
                      <Button
                        onClick={() => handleCloseFault(fault)}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        אישור סגירה
                      </Button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Closed */}
          {(groupBy === 'all' || groupBy === 'סגור') && visibleFaults.filter(f => f.status === 'סגור').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                סגורות · {visibleFaults.filter(f => f.status === 'סגור').length}
              </h2>
              <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
                {visibleFaults.filter(f => f.status === 'סגור').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
                      isMadrich={isMadrich}
                      onEdit={handleEdit}
                      users={users}
                      onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
            </div>
          )}
        </>
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