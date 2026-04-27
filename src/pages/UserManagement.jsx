import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import UserRoleEditor from '@/components/users/UserRoleEditor';

const ROLE_COLORS = {
  'ללא הרשאה': 'bg-muted text-muted-foreground',
  'מדריך': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'אב בית': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'מנהל אחזקה': 'bg-primary/10 text-primary border-primary/20',
  'מפתח': 'bg-chart-5/10 text-chart-5 border-chart-5/20',
};

export default function UserManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">ניהול משתמשים</h1>
        </div>
        <p className="text-muted-foreground">ניהול תפקידים והרשאות משתמשים במערכת</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {['ללא הרשאה', 'מדריך', 'אב בית', 'מנהל אחזקה', 'מפתח'].map(role => (
          <Card key={role} className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => (u.role || 'ללא הרשאה') === role).length}
              </p>
              <Badge variant="outline" className={`mt-1 text-xs ${ROLE_COLORS[role]}`}>
                {role}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User list */}
      <Card className="border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">רשימת משתמשים</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {user.full_name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.full_name || 'ללא שם'}</p>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <UserRoleEditor user={user} onUpdate={handleUpdate} />
                </motion.div>
              ))}
              {users.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">אין משתמשים רשומים</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}