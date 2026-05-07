import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

function getGreeting(firstName) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: `בוקר טוב, ${firstName}`, emoji: '☀️', sub: 'יום עבודה מוצלח!' };
  if (hour >= 12 && hour < 17) return { text: `צהריים טובים, ${firstName}`, emoji: '🌤️', sub: 'המשך יום פורה' };
  if (hour >= 17 && hour < 21) return { text: `ערב טוב, ${firstName}`, emoji: '🌆', sub: 'סיום יום מוצלח' };
  return { text: `לילה טוב, ${firstName}`, emoji: '🌙', sub: 'מנוחה טובה' };
}

export default function AppLayout({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showGreeting, setShowGreeting] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const needsProfile = currentUser && !currentUser.profileCompleted;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Hide greeting only when both min time passed AND data is ready
  const greetingVisible = showGreeting && !(minTimePassed && dataReady);

  useEffect(() => {
    if (minTimePassed && dataReady) {
      setShowGreeting(false);
    }
  }, [minTimePassed, dataReady]);

  const handleProfileComplete = async () => {
    const updated = await base44.auth.me();
    setCurrentUser(updated);
  };

  const displayName = currentUser?.displayName || currentUser?.full_name || '';
  const firstName = displayName.split(' ')[0];
  const greeting = firstName ? getGreeting(firstName) : null;

  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      {needsProfile && <ProfileSetupModal onComplete={handleProfileComplete} />}

      {/* Greeting Splash */}
      <AnimatePresence>
        {greetingVisible && greeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="text-6xl">{greeting.emoji}</div>
              <h2 className="text-3xl font-bold text-foreground">{greeting.text}</h2>
              <p className="text-muted-foreground">{greeting.sub}</p>
              <div className="mt-2 flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar user={currentUser} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="md:mr-64 min-h-screen pb-20 md:pb-0">
        <Outlet context={{ sidebarOpen, setSidebarOpen, onDataReady: () => setDataReady(true) }} />
      </main>
      <BottomNav user={currentUser} />
    </div>
  );
}