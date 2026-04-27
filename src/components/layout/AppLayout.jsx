import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout({ user }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background font-heebo">
      <Sidebar user={user} />
      <main className="mr-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}