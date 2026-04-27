import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, LogOut, Shield, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'דף הבית', path: '/', icon: Home, roles: ['מדריך', 'אב בית', 'מנהל אחזקה', 'מפתח'] },
  { label: 'ניהול משתמשים', path: '/users', icon: Users, roles: ['מפתח'] },
];

export default function Sidebar({ user }) {
  const location = useLocation();
  const userRole = user?.role || 'ללא הרשאה';

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50 border-l border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ניהול אחזקה</h1>
            <p className="text-xs text-sidebar-foreground/60">מערכת ניהול</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-bold text-sidebar-accent-foreground">
              {user?.full_name?.[0] || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'משתמש'}</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-sidebar-primary" />
              <p className="text-xs text-sidebar-foreground/60">{userRole}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  );
}