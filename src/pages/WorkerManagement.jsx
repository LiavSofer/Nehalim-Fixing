import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wrench, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

export default function WorkerManagement() {
  const { data: faults, isLoading: faultsLoading } = useQuery({
    queryKey: ['faults'],
    queryFn: () => base44.entities.Fault.list('-created_date'),
    initialData: [],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  // Calculate worker stats
    const getWorkerStats = () => {
      const workers = users.filter(u => u.role === 'אב בית');
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const lastWeekStart = subDays(weekStart, 7);
    
    return workers.map(worker => {
      const assignedFaults = faults.filter(f => f.assignedTo === worker.id);
      const openFaults = assignedFaults.filter(f => f.status !== 'סגור');
      const closedToday = assignedFaults.filter(f => 
        f.status === 'סגור' && 
        new Date(f.updated_date) >= todayStart && 
        new Date(f.updated_date) <= todayEnd
      );
      const closedThisWeek = assignedFaults.filter(f => 
        f.status === 'סגור' && 
        new Date(f.updated_date) >= weekStart && 
        new Date(f.updated_date) <= weekEnd
      );
      const closedLastWeek = assignedFaults.filter(f => 
        f.status === 'סגור' && 
        new Date(f.updated_date) >= lastWeekStart && 
        new Date(f.updated_date) < weekStart
      );
      
      const avgWeekly = Math.round((closedThisWeek.length + closedLastWeek.length) / 2);
      
      // Calculate average time to resolve faults
      const closedFaults = assignedFaults.filter(f => f.status === 'סגור');
      const avgTimeToResolve = closedFaults.length > 0 
        ? Math.round(
            closedFaults.reduce((sum, f) => {
              const created = new Date(f.created_date);
              const closed = new Date(f.updated_date);
              return sum + (closed - created) / (1000 * 60 * 60); // Convert to hours
            }, 0) / closedFaults.length
          )
        : 0;
      
      return {
        id: worker.id,
        name: worker.full_name,
        email: worker.email,
        openTasks: openFaults.length,
        closedToday: closedToday.length,
        closedThisWeek: closedThisWeek.length,
        avgWeekly,
        avgTimeToResolve
      };
    });
  };

  const workerStats = getWorkerStats();
  const isLoading = faultsLoading || usersLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkerTasks, setSelectedWorkerTasks] = useState({ worker: null, type: null, tasks: [] });

  const PRIORITY_COLORS = {
    'גבוהה': 'text-red-600',
    'בינונית': 'text-amber-600',
    'נמוכה': 'text-blue-600',
    'לא מוגדר': 'text-gray-600',
  };

  const handleOpenTasks = (worker) => {
    const assignedFaults = faults.filter(f => f.assignedTo === worker.id && f.status !== 'סגור');
    setSelectedWorkerTasks({ worker, type: 'open', tasks: assignedFaults });
    setDialogOpen(true);
  };

  const handleClosedTodayTasks = (worker) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const assignedFaults = faults.filter(f => 
      f.assignedTo === worker.id && 
      f.status === 'סגור' && 
      new Date(f.updated_date) >= todayStart && 
      new Date(f.updated_date) <= todayEnd
    );
    setSelectedWorkerTasks({ worker, type: 'closedToday', tasks: assignedFaults });
    setDialogOpen(true);
  };

  const handleClosedThisWeekTasks = (worker) => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const assignedFaults = faults.filter(f => 
      f.assignedTo === worker.id && 
      f.status === 'סגור' && 
      new Date(f.updated_date) >= weekStart && 
      new Date(f.updated_date) <= weekEnd
    );
    setSelectedWorkerTasks({ worker, type: 'closedThisWeek', tasks: assignedFaults });
    setDialogOpen(true);
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">ניהול עובדים</h1>
        </div>
        <p className="text-muted-foreground">בקרה על ביצועי עובדי התחזוקה ותוכנית עבודתם</p>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סך עובדים', value: workerStats.length },
          { label: 'משימות פתוחות', value: workerStats.reduce((sum, w) => sum + w.openTasks, 0) },
          { label: 'סגורות היום', value: workerStats.reduce((sum, w) => sum + w.closedToday, 0) },
          { label: 'סגורות השבוע', value: workerStats.reduce((sum, w) => sum + w.closedThisWeek, 0) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs mt-1 text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Workers Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : workerStats.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">אין עובדים במערכת</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {workerStats.map((worker, idx) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-base">{worker.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{worker.email}</p>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap justify-between gap-y-3 gap-x-2">
                     {/* Open Tasks */}
                     <button onClick={() => handleOpenTasks(worker)} className="text-center hover:opacity-70 transition-opacity flex-1 min-w-fit">
                       <div className="flex items-center justify-center gap-1 mb-2">
                         <Wrench className="w-3 h-3 text-amber-600 flex-shrink-0" />
                         <span className="text-xs font-medium text-muted-foreground">פתוחות</span>
                       </div>
                       <p className="text-lg font-bold text-amber-600">{worker.openTasks}</p>
                     </button>

                     {/* Closed Today */}
                     <button onClick={() => handleClosedTodayTasks(worker)} className="text-center hover:opacity-70 transition-opacity flex-1 min-w-fit">
                       <div className="flex items-center justify-center gap-1 mb-2">
                         <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                         <span className="text-xs font-medium text-muted-foreground">נפתרו היום</span>
                       </div>
                       <p className="text-lg font-bold text-green-600">{worker.closedToday}</p>
                     </button>

                     {/* This Week */}
                     <button onClick={() => handleClosedThisWeekTasks(worker)} className="text-center hover:opacity-70 transition-opacity flex-1 min-w-fit">
                       <div className="flex items-center justify-center gap-1 mb-2">
                         <CheckCircle2 className="w-3 h-3 text-blue-600 flex-shrink-0" />
                         <span className="text-xs font-medium text-muted-foreground">השבוע</span>
                       </div>
                       <p className="text-lg font-bold text-blue-600">{worker.closedThisWeek}</p>
                     </button>

                     {/* Average Time to Resolve */}
                     <div className="text-center flex-1 min-w-fit">
                       <div className="flex items-center justify-center gap-1 mb-2">
                         <TrendingUp className="w-3 h-3 text-primary flex-shrink-0" />
                         <span className="text-xs font-medium text-muted-foreground">זמן ממוצע</span>
                       </div>
                       <p className="text-lg font-bold text-primary">{worker.avgTimeToResolve}h</p>
                     </div>

                     {/* Efficiency Score */}
                     <div className="text-center flex-1 min-w-fit">
                       <div className="flex items-center justify-center gap-1 mb-2">
                         <TrendingUp className="w-3 h-3 text-primary flex-shrink-0" />
                         <span className="text-xs font-medium text-muted-foreground">ביצועים</span>
                       </div>
                       <Badge 
                         variant="outline" 
                         className="text-xs py-1"
                       >
                         {worker.avgWeekly >= 5 ? '⭐ מעולה' :
                          worker.avgWeekly >= 3 ? '⚠️ טוב' :
                          '❌ נמוך'}
                       </Badge>
                     </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dialog for viewing tasks */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="space-y-1">
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedWorkerTasks.type === 'open' && 'משימות פתוחות'}
                  {selectedWorkerTasks.type === 'closedToday' && 'משימות שהושלמו היום'}
                  {selectedWorkerTasks.type === 'closedThisWeek' && 'משימות שהושלמו השבוע'}
                </p>
                <p className="text-lg font-bold">{selectedWorkerTasks.worker?.name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkerTasks.tasks.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">אין משימות בקטגוריה זו</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedWorkerTasks.tasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{task.faultType}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{task.location}</p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || 'text-gray-600'}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}