import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, ClipboardList, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'קריאות פתוחות', value: '—', icon: ClipboardList, color: 'bg-primary/10 text-primary' },
  { label: 'תחזוקות החודש', value: '—', icon: Wrench, color: 'bg-chart-4/10 text-chart-4' },
  { label: 'אחוז ביצוע', value: '—', icon: BarChart3, color: 'bg-chart-5/10 text-chart-5' },
  { label: 'זמן ממוצע', value: '—', icon: BarChart3, color: 'bg-chart-2/10 text-chart-2' },
];

export default function Home() {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
        <p className="text-muted-foreground mt-1">סקירה כללית של מערכת ניהול האחזקה</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border border-border hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10"
      >
        <Card className="border border-border">
          <CardContent className="p-12 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">מערכת ניהול האחזקה מוכנה לשימוש</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}