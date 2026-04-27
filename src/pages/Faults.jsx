import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Filter, Plus } from 'lucide-react';
import FaultForm from '@/components/faults/FaultForm';
import FaultCard from '@/components/faults/FaultCard';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Faults() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

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
  };

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סה"כ קריאות', value: stats.total },
          { label: 'ממתינות', value: stats.pending, color: 'text-yellow-600' },
          { label: 'בטיפול', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'סגורות', value: stats.closed, color: 'text-green-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.color || 'text-muted-foreground'}`}>{stat.label}</p>
          </motion.div>
        ))}
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

      {/* Dialog for new fault */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>תקלה חדשה</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FaultForm users={users} onSuccess={handleSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-card border border-border rounded-lg">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="ממתין">ממתין</SelectItem>
            <SelectItem value="בטיפול">בטיפול</SelectItem>
            <SelectItem value="ממתין לאישור">ממתין לאישור</SelectItem>
            <SelectItem value="סגור">סגור</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value="גבוהה">גבוהה</SelectItem>
            <SelectItem value="בינונית">בינונית</SelectItem>
            <SelectItem value="לא מוגדר">לא מוגדר</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || priorityFilter !== 'all') && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
            className="text-xs text-primary hover:underline ml-auto"
          >
            אפס סינונים
          </button>
        )}
      </div>

      {/* Faults Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredFaults.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">אין קריאות תואמות</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredFaults.map((fault) => {
            const assignedUser = fault.assignedTo ? users.find(u => u.id === fault.assignedTo) : null;
            const reportedUser = users.find(u => u.email === fault.reportedBy);
            return (
              <FaultCard
                key={fault.id}
                fault={fault}
                assignedUser={assignedUser}
                reportedUser={reportedUser}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}