import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import FaultCard from '@/components/faults/FaultCard';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const priorityOrder = {
  'גבוהה': 0,
  'בינונית': 1,
  'נמוכה': 2,
  'לא מוגדר': 3,
};

export default function MyTasks() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  const queryClient = useQueryClient();

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

  // Filter tasks assigned to current user
  const myTasks = faults.filter(fault => fault.assignedTo === user?.id);

  // Sort by priority (high to low) and then by date (old to new)
  const sortedTasks = [...myTasks].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by created_date (ascending = old to new)
    return new Date(a.created_date) - new Date(b.created_date);
  });

  const stats = {
    total: myTasks.length,
    inProgress: myTasks.filter(f => f.status === 'בטיפול').length,
    waitingApproval: myTasks.filter(f => f.status === 'ממתין לאישור').length,
    closed: myTasks.filter(f => f.status === 'סגור').length,
  };

  if (!user) return null;

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle2 className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">המשימות שלי</h1>
        </div>
        <p className="text-muted-foreground">התקלות המושויכות אליך</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'משויכות אליי', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'ממתינות לאישור', value: stats.waitingApproval, color: 'text-orange-600' },
          { label: 'השלמתי בהצלחה', value: stats.closed, color: 'text-green-600' },
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

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">אין לך משימות כרגע</p>
        </div>
      ) : (
        <div className="border bg-card rounded-lg overflow-hidden">
          {sortedTasks.map((fault, index) => {
            const reportedUser = users.find(u => u.email === fault.reportedBy);
            return (
              <motion.div
                key={fault.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                  {/* Image */}
                  {fault.image && (
                    <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-muted">
                      <img src={fault.image} alt={fault.faultType} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center text-center">
                    {/* סוג התקלה */}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">סוג</p>
                      <p className="font-semibold text-foreground text-sm truncate">{fault.faultType}</p>
                    </div>

                    {/* מיקום */}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">מיקום</p>
                      <p className="text-sm text-foreground truncate">{fault.location}</p>
                    </div>

                    {/* דחיפות */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">דחיפות</p>
                      <p className="text-sm text-foreground font-medium">{fault.priority}</p>
                    </div>

                    {/* סטטוס */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">סטטוס</p>
                      <p className="text-sm text-foreground font-medium">{fault.status}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  {fault.status === 'בטיפול' && (
                    <button
                      onClick={() => {
                        const dialog = document.querySelector('[data-fault-id="' + fault.id + '"]');
                        dialog?.click();
                      }}
                      className="flex-shrink-0 px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded transition-colors"
                    >
                      סימון כטופל
                    </button>
                  )}
                </div>

                {/* Dialogs */}
                <FaultCard
                  fault={fault}
                  reportedUser={reportedUser}
                  isMaintenanceManager={false}
                  isWorkerView={true}
                  users={users}
                  onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}