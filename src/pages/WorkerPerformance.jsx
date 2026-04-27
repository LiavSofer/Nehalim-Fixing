import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

export default function WorkerPerformance({ user }) {
  const { data: faults = [] } = useQuery({
    queryKey: ['worker-faults', user?.email],
    queryFn: () => base44.entities.Fault.filter({ assignedTo: user?.email || '' }),
  });

  const stats = useMemo(() => {
    const completed = faults.filter(f => f.status === 'סגור').length;
    const inProgress = faults.filter(f => f.status === 'בטיפול').length;
    const pending = faults.filter(f => f.status === 'ממתין' || f.status === 'ממתין לאישור').length;
    const total = faults.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusData = [
      { name: 'בוצע', value: completed, color: COLORS[0] },
      { name: 'בטיפול', value: inProgress, color: COLORS[1] },
      { name: 'ממתין', value: pending, color: COLORS[2] },
    ].filter(d => d.value > 0);

    const priorityData = {
      high: faults.filter(f => f.priority === 'גבוהה').length,
      medium: faults.filter(f => f.priority === 'בינונית').length,
      low: faults.filter(f => f.priority === 'לא מוגדר').length,
    };

    return { completed, inProgress, pending, total, completionRate, statusData, priorityData };
  }, [faults]);

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">הביצועים שלי</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ משימות</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">בוצעו</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">בטיפול</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">שיעור סיום</p>
                  <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
                </div>
                <Badge className="h-fit">{stats.completionRate}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Distribution */}
          {stats.statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">התפלגות סטטוס</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">משימות לפי דחיפות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">דחיפות גבוהה</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">{stats.priorityData.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">דחיפות בינונית</span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">{stats.priorityData.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ללא דחיפות</span>
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">{stats.priorityData.low}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}