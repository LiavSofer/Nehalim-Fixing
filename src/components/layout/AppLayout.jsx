import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { base44 } from '@/api/base44Client';

function getGreeting(firstName) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `בוקר טוב, ${firstName} 😊☀️`;
  if (hour >= 12 && hour < 17) return `צהריים טובים, ${firstName} 😊`;
  if (hour >= 17 && hour < 21) return `ערב טוב, ${firstName} 😊🌆`;
  return `לילה טוב, ${firstName} 😊🌙`;
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

  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      {needsProfile && <ProfileSetupModal onComplete={handleProfileComplete} />}
      <Sidebar user={currentUser} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="md:mr-64 min-h-screen pb-20 md:pb-0">
        {firstName && (
          <div className="px-6 pt-5 pb-1">
            <p className="text-lg font-semibold text-foreground">{getGreeting(firstName)}</p>
          </div>
        )}
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
      <BottomNav user={currentUser} />
    </div>
  );
}