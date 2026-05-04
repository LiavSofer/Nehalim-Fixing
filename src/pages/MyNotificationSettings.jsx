import React from 'react';
import { Bell } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';
import NotificationSettings from '@/components/notifications/NotificationSettings';

export default function MyNotificationSettings({ user }) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto" dir="rtl">
      <PageHeader icon={Bell} title="התראות" subtitle="הגדר אילו התראות תקבל" />
      <NotificationSettings user={user} />
    </div>
  );
}