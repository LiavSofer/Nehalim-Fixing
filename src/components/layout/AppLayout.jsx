import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      <Sidebar user={user} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="md:mr-64 min-h-screen pb-20 md:pb-0">
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </main>
      <BottomNav user={user} />
    </div>
  );
}