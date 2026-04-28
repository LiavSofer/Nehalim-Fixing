import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Users, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav({ user }) {
  const location = useLocation();
  const userRole = user?.role || 'ללא הרשאה';

  const navItems = [
    {
      path: '/',
      label: 'המשימות שלי',
      icon: ClipboardList,
      show: userRole === 'אב בית'
    },
    {
      path: '/performance',
      label: 'הביצועים שלי',
      icon: BarChart2,
      show: userRole === 'אב בית'
    },
    {
      path: '/',
      label: 'בית',
      icon: Home,
      show: userRole !== 'אב בית'
    },
    {
      path: '/workers',
      label: 'עובדים',
      icon: Users,
      show: userRole === 'מנהל אחזקה'
    },
    {
      path: '/users',
      label: 'משתמשים',
      icon: Users,
      show: userRole === 'מפתח'
    }
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border md:hidden z-40">
      <div className="flex justify-around">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-4 flex-1 transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}