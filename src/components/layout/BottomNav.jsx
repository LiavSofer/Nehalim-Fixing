import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Users, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav({ user }) {
  const location = useLocation();
  const userRole = user?.userType || 'ללא הרשאה';

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
      label: 'הקריאות שלי',
      icon: ClipboardList,
      show: userRole === 'צוות מדווח'
    },
    {
      path: '/',
      label: 'בית',
      icon: Home,
      show: userRole !== 'אב בית' && userRole !== 'צוות מדווח'
    },
    {
      path: '/workers',
      label: 'ביצועי עובדים',
      icon: Users,
      show: userRole === 'מנהל אחזקה'
    },
    {
      path: '/users',
      label: 'משתמשים',
      icon: Users,
      show: userRole === 'מפתח' || userRole === 'מנהל אחזקה'
    }
  ];

  const visibleItems = navItems.filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background md:hidden z-40">
      <div className="flex justify-around">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-4 py-4 flex flex-col items-center justify-center flex-1 transition-all",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <Icon className={cn("mb-1 w-6 h-6", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}