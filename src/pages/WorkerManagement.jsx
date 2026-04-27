import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wrench, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
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
    const workers = users.filter(u => ['מדריך', 'אב בית', 'מנהל אחזקה'].includes(u.role));
    
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
      
      return {
        id: worker.id,
        name: worker.full_name,
        email: worker.email,
        totalAssigned: assignedFaults.length,
        openTasks: openFaults.length,
        closedToday: closedToday.length,
        closedThisWeek: closedThisWeek.length,
        avgWeekly
      };
    });
  };

  const workerStats = getWorkerStats();
  const isLoading = faultsLoading || usersLoading;

  const PRIORITY_COLORS = {
    'גבוהה': 'text-red-600',
    'בינונית': 'text-amber-600',
    'נמוכה': 'text-blue-600',
    'לא מוגדר': 'text-gray-600',
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
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{worker.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{worker.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{worker.totalAssigned}</div>
                      <p className="text-xs text-muted-foreground">משימות בסך הכל</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {/* Open Tasks */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium text-muted-foreground">פתוחות</span>
                      </div>
                      <p className="text-xl font-bold text-amber-600">{worker.openTasks}</p>
                    </div>

                    {/* Closed Today */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-muted-foreground">סיימה היום</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">{worker.closedToday}</p>
                    </div>

                    {/* This Week */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-muted-foreground">השבוע</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{worker.closedThisWeek}</p>
                    </div>

                    {/* Average Weekly */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">ממוצע</span>
                      </div>
                      <p className="text-xl font-bold text-primary">{worker.avgWeekly}</p>
                    </div>

                    {/* Efficiency Score */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">ביצועים</span>
                      <Badge 
                        variant="outline" 
                        className={
                          worker.avgWeekly >= 5 ? 'bg-green-50 text-green-700 border-green-200' :
                          worker.avgWeekly >= 3 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }
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
    </div>
  );
}