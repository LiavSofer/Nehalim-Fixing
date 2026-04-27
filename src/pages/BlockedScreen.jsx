import React from 'react';
import { ShieldAlert, Phone, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function BlockedScreen({ user }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8"
        >
          <ShieldAlert className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          ברוך הבא, {user?.full_name || 'משתמש'}
        </h1>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm mb-6">
          <p className="text-muted-foreground leading-relaxed text-base">
            עליך לפנות למנהל האחזקה לפתיחת הרשאות מתאימות.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground/80">
            <Phone className="w-4 h-4" />
            <span>צור קשר עם מנהל המערכת</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => base44.auth.logout('/')}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          התנתקות
        </Button>
      </motion.div>
    </div>
  );
}