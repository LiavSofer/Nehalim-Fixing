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
  const [groupBy, setGroupBy] = useState('all');
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

  const filteredFaults = faults.filter(fault => {
    const statusMatch = statusFilter === 'all' || fault.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || fault.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Stats
  const stats = {
    total: faults.length,
    pending: faults.filter(f => f.status === 'ממתין').length,
    inProgress: faults.filter(f => f.status === 'בטיפול').length,
    awaitingApproval: faults.filter(f => f.status === 'ממתין לאישור').length,
    closed: faults.filter(f => f.status === 'סגור').length,
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <Wrench className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">קריאות טכניות</h1>
        </div>
        <p className="text-muted-foreground">ניהול ודיווח על תקלות וקריאות טכניות</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'סה"כ קריאות', value: stats.total, groupValue: 'all', color: 'text-muted-foreground', activeBg: 'bg-primary/10 border-primary' },
          { label: 'ממתינות', value: stats.pending, color: 'text-yellow-600', groupValue: 'ממתין', activeBg: 'bg-yellow-100 border-yellow-400' },
          { label: 'בטיפול', value: stats.inProgress, color: 'text-blue-600', groupValue: 'בטיפול', activeBg: 'bg-blue-100 border-blue-400' },
          { label: 'ממתינות לאישור', value: stats.awaitingApproval, color: 'text-orange-600', groupValue: 'ממתין לאישור', activeBg: 'bg-orange-100 border-orange-400' },
          { label: 'סגורות', value: stats.closed, color: 'text-green-600', groupValue: 'סגור', activeBg: 'bg-green-100 border-green-400' },
        ].map((stat, i) => {
          const isActive = groupBy === stat.groupValue;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setGroupBy(stat.groupValue)}
              className={`rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-all border ${
                isActive
                  ? stat.activeBg
                  : 'bg-card border-border'
              }`}
            >
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.color}`}>{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Add new fault button */}
      <div className="mb-8">
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          תקלה חדשה
        </Button>
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
           {groupBy !== 'all' && faults.filter(f => groupBy === 'all' || f.status === groupBy).length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">הרשימה ריקה</p>
            </div>
          ) : (
            <div className="space-y-8">
          {/* Waiting */}
          {(groupBy === 'all' || groupBy === 'ממתין') && faults.filter(f => f.status === 'ממתין').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                ממתינות ({faults.filter(f => f.status === 'ממתין').length})
              </h2>
              <div className="border bg-card rounded-lg overflow-hidden">
                {faults.filter(f => f.status === 'ממתין').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
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
          {(groupBy === 'all' || groupBy === 'בטיפול') && faults.filter(f => f.status === 'בטיפול').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                בטיפול ({faults.filter(f => f.status === 'בטיפול').length})
              </h2>
              <div className="border bg-card rounded-lg overflow-hidden">
                {faults.filter(f => f.status === 'בטיפול').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
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
          {isMaintenanceManager && (groupBy === 'all' || groupBy === 'ממתין לאישור') && faults.filter(f => f.status === 'ממתין לאישור').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                ממתינות לאישור ({faults.filter(f => f.status === 'ממתין לאישור').length})
              </h2>
              <div className="border bg-card rounded-lg overflow-hidden">
                {faults.filter(f => f.status === 'ממתין לאישור').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <div key={fault.id} className="space-y-2 p-3 border-b last:border-b-0">
                      <FaultCard
                        fault={fault}
                        assignedUser={assignedUser}
                        reportedUser={reportedUser}
                        isMaintenanceManager={isMaintenanceManager}
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
          {(groupBy === 'all' || groupBy === 'סגור') && faults.filter(f => f.status === 'סגור').length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                סגורות ({faults.filter(f => f.status === 'סגור').length})
              </h2>
              <div className="border bg-card rounded-lg overflow-hidden">
                {faults.filter(f => f.status === 'סגור').map((fault) => {
                  const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
                  const reportedUser = users.find(u => u.email === fault.reportedBy);
                  return (
                    <FaultCard
                      key={fault.id}
                      fault={fault}
                      assignedUser={assignedUser}
                      reportedUser={reportedUser}
                      isMaintenanceManager={isMaintenanceManager}
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