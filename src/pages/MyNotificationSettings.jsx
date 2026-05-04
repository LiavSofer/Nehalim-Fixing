import React from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationSettings from '@/components/notifications/NotificationSettings';

export default function MyNotificationSettings({ user }) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">התראות</h1>
            <p className="text-xs text-muted-foreground">הגדר אילו התראות תקבל</p>
          </div>
        </div>
      </motion.div>

      <NotificationSettings user={user} />
    </div>
  );
}