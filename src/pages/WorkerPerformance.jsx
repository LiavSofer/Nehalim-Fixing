import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { CheckCircle2, Clock, TrendingUp, Zap, ChevronDown, TrendingUp as TrendIcon } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { format, subMonths, startOfMonth, endOfMonth, differenceInHours } from 'date-fns';
import { he } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function WorkerStats({ workerId }) {
  const { data: faults = [] } = useQuery({
    queryKey: ['worker-faults', workerId],
    queryFn: () => base44.entities.Fault.filter({ assignedTo: workerId }),
    enabled: !!workerId,
  });

  const stats = useMemo(() => {
    const closed = faults.filter(f => f.status === 'סגור');
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
        ? Math.round(monthClosed.reduce((sum, f) =>
            sum + differenceInHours(new Date(f.updated_date), new Date(f.created_date)), 0
          ) / monthClosed.length)
        : 0;
      return {
        month: format(monthDate, 'MMM', { locale: he }),
        תקלות: monthClosed.length,
        'זמן ממוצע (שעות)': monthAvgHours,
      };
    });

    const completionRate = faults.length > 0
      ? Math.round((closed.length / faults.length) * 100) : 0;
    const totalClosedLast6 = monthlyData.reduce((sum, m) => sum + m['תקלות'], 0);
    const avgPerMonth = Math.round(totalClosedLast6 / 6);

    return { closed: closed.length, total: faults.length, avgDisplay, completionRate, monthlyData, avgPerMonth };
  }, [faults]);

  const avgDailyResolved = stats.closed > 0 ? (stats.closed / 180).toFixed(1) : '0';

  const summaryCards = [
    { label: 'ממוצע תקלות יומי', value: avgDailyResolved, sub: 'על בסיס 180 ימים אחרונים', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'זמן פתרון ממוצע', value: stats.avgDisplay, sub: 'לתקלה סגורה', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'ממוצע חודשי', value: stats.avgPerMonth, sub: 'תקלות ב-6 חודשים אחרונים', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'אחוז ביצוע', value: `${stats.completionRate}%`, sub: 'מסך כל הקצאות', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
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
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v) => [v, 'תקלות שנפתרו']} />
              <Bar dataKey="תקלות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} formatter={(v) => [`${v} שעות`, 'זמן ממוצע לפתרון']} />
              <Line type="monotone" dataKey="זמן ממוצע (שעות)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkerPerformance({ user }) {
  const isManager = user?.role === 'מנהל אחזקה';
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: workers = [] } = useQuery({
    queryKey: ['workers-list'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageUsers', { action: 'getWorkers' });
      return res.data.users || [];
    },
    enabled: isManager,
  });

  // For non-managers (אב בית), show their own stats
  if (!isManager) {
    return (
      <div dir="rtl" className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <PageHeader icon={TrendIcon} title="הביצועים שלי" subtitle="סקירת ביצועים אישית לפי נתוני תקלות" />
        <WorkerStats workerId={user?.id} />
      </div>
    );
  }

  // For managers: show worker picker
  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || workers[0] || null;
  const displayWorker = selectedWorker;
  const displayId = displayWorker?.id;

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader icon={TrendIcon} title="ביצועי עובדים" subtitle="סקירת ביצועים לפי עובד" />

      {workers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">אין אבות בית מוגדרים במערכת</div>
      ) : (
        <>
          {/* Worker picker */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-muted transition-colors w-full"
            >
              <Avatar className="h-9 w-9">
                {displayWorker?.profileImage && <AvatarImage src={displayWorker.profileImage} />}
                <AvatarFallback className="text-sm bg-primary/15 text-primary">
                  {displayWorker?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium flex-1 text-right">{displayWorker?.full_name || 'בחר עובד'}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-card border rounded-xl shadow-lg py-1">
                {workers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => { setSelectedWorkerId(w.id); setDropdownOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted transition-colors text-right ${w.id === displayId ? 'bg-primary/5 font-semibold text-primary' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      {w.profileImage && <AvatarImage src={w.profileImage} />}
                      <AvatarFallback className="text-xs bg-primary/15 text-primary">
                        {w.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{w.full_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {displayId && <WorkerStats workerId={displayId} />}
          </>
          )}
          </div>
          );
          }