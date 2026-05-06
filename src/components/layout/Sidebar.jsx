import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, LogOut, Shield, Wrench, CheckCircle2, Settings, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

const NAV_ITEMS = [
  { label: 'המשימות שלי', path: '/', icon: CheckCircle2, roles: ['אב בית'] },
  { label: 'הביצועים שלי', path: '/performance', icon: Wrench, roles: ['אב בית'] },
  { label: 'דף הבית', path: '/', icon: Home, roles: ['צוות מדווח', 'מנהל אחזקה', 'מפתח'] },
  { label: 'ביצועי עובדים', path: '/workers', icon: Users, roles: ['מנהל אחזקה'] },
  { label: 'ניהול משתמשים', path: '/users', icon: Users, roles: ['מנהל אחזקה', 'מפתח'] },
  { label: 'הגדרות', path: '/settings', icon: Settings, roles: ['מנהל אחזקה'] },
  { label: 'התראות', path: '/notification-settings', icon: Bell, roles: ['אב בית', 'צוות מדווח', 'מנהל אחזקה', 'מפתח'] },
];

export default function Sidebar({ user, open = false, onOpenChange }) {
  const location = useLocation();
  const userRole = user?.role || 'ללא הרשאה';

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => onOpenChange?.(!open)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary text-primary-foreground"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => onOpenChange?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-40 border-l border-sidebar-border transition-transform duration-300 pb-16 md:pb-0",
        open ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
      {/* Logo */}
      <div className="relative p-5 border-b border-sidebar-border overflow-hidden">
        {/* Background logo watermark */}
        <img
          src="https://media.base44.com/images/public/69ef559b90d9349a2e6ed053/963997086_image.png"
          alt=""
          aria-hidden="true"
          className="absolute -left-4 -top-4 w-32 h-32 object-contain opacity-[0.06] pointer-events-none select-none invert"
        />
        <div className="relative flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69ef559b90d9349a2e6ed053/963997086_image.png"
            alt="לוגו ישיבת נחלים"
            className="w-10 h-10 object-contain opacity-90 invert"
          />
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">ישיבת נחלים</h1>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">מערכת ניהול אחזקה</p>
            <p className="text-xs text-sidebar-foreground/25 mt-1">v{APP_VERSION}</p>
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
              onClick={() => onOpenChange?.(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isActive ? "bg-white/20" : "bg-sidebar-accent"
              )}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-sidebar-accent/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sidebar-primary to-blue-400 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-white">
              {user?.full_name?.[0] || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.full_name || 'משתמש'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3 text-sidebar-primary" />
              <p className="text-xs text-sidebar-foreground/50">{userRole === 'ללא הרשאה' ? 'ממתין לאישור' : userRole}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
    </>
  );
}