import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { CheckCircle2, Clock, TrendingUp, Zap } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, differenceInHours } from 'date-fns';
import { he } from 'date-fns/locale';

export default function WorkerPerformanceDialog({ open, onOpenChange, worker, faults = [] }) {
  const stats = useMemo(() => {
    if (!worker) return null;
    const workerFaults = faults.filter(f => f.assignedTo === worker.id);
    const closed = workerFaults.filter(f => f.status === 'סגור');
    const now = new Date();

    const avgHours = closed.length > 0
      ? Math.round(
          closed.reduce((sum, f) =>
            sum + differenceInHours(new Date(f.updated_date), new Date(f.created_date)), 0
          ) / closed.length
        )
      : 0;

    const avgDisplay = avgHours >= 24 ? `${Math.round(avgHours / 24)} ימים` : `${avgHours} שעות`;

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthClosed = closed.filter(f => {
        const d = new Date(f.updated_date);
        return d >= start && d <= end;
      });
      const monthAvgHours = monthClosed.length > 0
        ? Math.round(
            monthClosed.reduce((sum, f) =>
              sum + differenceInHours(new Date(f.updated_date), new Date(f.created_date)), 0
            ) / monthClosed.length
          )
        : 0;
      return {
        month: format(monthDate, 'MMM', { locale: he }),
        תקלות: monthClosed.length,
        'זמן ממוצע (שעות)': monthAvgHours,
      };
    });

    const completionRate = workerFaults.length > 0
      ? Math.round((closed.length / workerFaults.length) * 100)
      : 0;

    const totalClosedLast6 = monthlyData.reduce((sum, m) => sum + m['תקלות'], 0);
    const avgPerMonth = Math.round(totalClosedLast6 / 6);

    return { closed: closed.length, total: workerFaults.length, avgDisplay, completionRate, monthlyData, avgPerMonth };
  }, [worker, faults]);

  const summaryCards = stats ? [
    { label: 'תקלות שנפתרו', value: stats.closed, sub: `מתוך ${stats.total} שהוקצו`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'זמן פתרון ממוצע', value: stats.avgDisplay, sub: 'לתקלה סגורה', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'ממוצע חודשי', value: stats.avgPerMonth, sub: '6 חודשים אחרונים', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'אחוז ביצוע', value: `${stats.completionRate}%`, sub: 'מסך כל ההקצאות', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ביצועי {worker?.full_name}</DialogTitle>
        </DialogHeader>

        {stats && (
          <div className="space-y-5 mt-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              {summaryCards.map(card => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="border">
                    <CardContent className="p-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.bg}`}>
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{card.label}</p>
                      <p className="text-xs text-muted-foreground">{card.sub}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Monthly Resolved */}
            <Card className="border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">תקלות שנפתרו לפי חודש</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.monthlyData} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v, 'תקלות שנפתרו']} />
                    <Bar dataKey="תקלות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Avg Resolution Time */}
            <Card className="border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">זמן פתרון ממוצע לפי חודש (שעות)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} שעות`, 'זמן ממוצע']} />
                    <Line type="monotone" dataKey="זמן ממוצע (שעות)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}