import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { CheckCircle2, Clock, TrendingUp, Zap } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, differenceInHours } from 'date-fns';
import { he } from 'date-fns/locale';

export default function WorkerPerformance({ user }) {
  const { data: faults = [] } = useQuery({
    queryKey: ['worker-faults', user?.id],
    queryFn: () => base44.entities.Fault.filter({ assignedTo: user?.id || '' }),
  });

  const stats = useMemo(() => {
    const closed = faults.filter(f => f.status === 'סגור');
    const now = new Date();

    // Average time to resolve (in hours)
    const avgHours = closed.length > 0
      ? Math.round(
          closed.reduce((sum, f) => {
            return sum + differenceInHours(new Date(f.updated_date), new Date(f.created_date));
          }, 0) / closed.length
        )
      : 0;

    const avgDisplay = avgHours >= 24
      ? `${Math.round(avgHours / 24)} ימים`
      : `${avgHours} שעות`;

    // Monthly data for the last 6 months
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

    // Completion rate (closed / total assigned)
    const completionRate = faults.length > 0
      ? Math.round((closed.length / faults.length) * 100)
      : 0;

    // Average per month (last 6)
    const totalClosedLast6 = monthlyData.reduce((sum, m) => sum + m['תקלות'], 0);
    const avgPerMonth = Math.round(totalClosedLast6 / 6);

    // Best month
    const bestMonth = [...monthlyData].sort((a, b) => b['תקלות'] - a['תקלות'])[0];

    return { closed: closed.length, total: faults.length, avgHours, avgDisplay, completionRate, monthlyData, avgPerMonth, bestMonth };
  }, [faults]);

  const summaryCards = [
    {
      label: 'תקלות שנפתרו',
      value: stats.closed,
      sub: `מתוך ${stats.total} שהוקצו`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'זמן פתרון ממוצע',
      value: stats.avgDisplay,
      sub: 'לתקלה סגורה',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'ממוצע חודשי',
      value: stats.avgPerMonth,
      sub: 'תקלות ב-6 חודשים אחרונים',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'אחוז ביצוע',
      value: `${stats.completionRate}%`,
      sub: 'מסך כל הקצאות',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div dir="rtl" className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הביצועים שלי</h1>
        <p className="text-muted-foreground text-sm mt-1">סקירת ביצועים אישית לפי נתוני תקלות</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Resolved Bar Chart */}
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">תקלות שנפתרו לפי חודש</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [v, 'תקלות שנפתרו']}
              />
              <Bar dataKey="תקלות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Avg Resolution Time Line Chart */}
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">זמן פתרון ממוצע לפי חודש (שעות)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [`${v} שעות`, 'זמן ממוצע לפתרון']}
              />
              <Line
                type="monotone"
                dataKey="זמן ממוצע (שעות)"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}