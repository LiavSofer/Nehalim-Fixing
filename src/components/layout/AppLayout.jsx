import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { base44 } from '@/api/base44Client';

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

  const needsProfile = currentUser && !currentUser.profileCompleted;

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
      <Sidebar user={currentUser} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="md:mr-64 min-h-screen pb-20 md:pb-0">
        {greeting && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
                {greeting.emoji}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{greeting.text}</h2>
                <p className="text-xs text-muted-foreground">{greeting.sub}</p>
              </div>
            </div>
          </div>
        )}
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
      <BottomNav user={currentUser} />
    </div>
  );
}