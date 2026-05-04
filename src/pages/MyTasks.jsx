import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import FaultCard from '@/components/faults/FaultCard';
import PageHeader from '@/components/layout/PageHeader';
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

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.Fault.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Filter tasks assigned to current user — exclude closed faults
  const myTasks = faults.filter(fault => fault.assignedTo === user?.id && fault.status !== 'סגור');

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
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={CheckCircle2} title="המשימות שלי" subtitle="התקלות המשויכות אליך" />



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
        <div className="bg-card rounded-lg overflow-hidden border divide-y divide-border/50">
          {sortedTasks.map((fault, index) => {
            const reportedUser = users.find(u => u.email === fault.reportedBy);
            return (
              <FaultCard
                key={fault.id}
                fault={fault}
                reportedUser={reportedUser}
                isMaintenanceManager={false}
                isWorkerView={true}
                users={users}
                onAssignmentChange={() => queryClient.invalidateQueries({ queryKey: ['faults'] })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}