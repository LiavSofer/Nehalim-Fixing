import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

function getGreeting(firstName) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `בוקר טוב, ${firstName} 😊☀️`;
  if (hour >= 12 && hour < 17) return `צהריים טובים, ${firstName} 😊`;
  if (hour >= 17 && hour < 21) return `ערב טוב, ${firstName} 😊🌆`;
  return `לילה טוב, ${firstName} 😊🌙`;
}

export default function AppLayout({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      <Sidebar user={user} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="md:mr-64 min-h-screen pb-20 md:pb-0">
        {firstName && (
          <div className="px-6 pt-5 pb-1">
            <p className="text-lg font-semibold text-foreground">{getGreeting(firstName)}</p>
          </div>
        )}
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
      <BottomNav user={user} />
    </div>
  );
}