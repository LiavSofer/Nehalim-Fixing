import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Faults from '@/pages/Faults';
import UserManagement from '@/pages/UserManagement';
import WorkerManagement from '@/pages/WorkerManagement';
import MyTasks from '@/pages/MyTasks';
import BlockedScreen from '@/pages/BlockedScreen';
import WorkerPerformance from '@/pages/WorkerPerformance';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings) {
      if (authError) {
        setLoadingUser(false);
      } else {
        base44.auth.me().then(u => {
          setUser(u);
          setLoadingUser(false);
        }).catch(() => setLoadingUser(false));
      }
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError]);

  if (isLoadingPublicSettings || isLoadingAuth || loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const userRole = user?.role || 'ללא הרשאה';

  // Blocked users see the blocked screen
  if (userRole === 'ללא הרשאה') {
    return <BlockedScreen user={user} />;
  }

  return (
    <Routes>
      <Route element={<AppLayout user={user} />}>
        <Route path="/" element={userRole === 'אב בית' ? <MyTasks /> : ['מדריך', 'מנהל אחזקה', 'מפתח'].includes(userRole) ? <Faults /> : <Home />} />
        {userRole === 'אב בית' && (
          <>
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/all-faults" element={<Faults />} />
            <Route path="/performance" element={<WorkerPerformance user={user} />} />
          </>
        )}
        {userRole === 'מנהל אחזקה' && (
          <Route path="/workers" element={<WorkerManagement />} />
        )}
        {userRole === 'מפתח' && (
          <Route path="/users" element={<UserManagement />} />
        )}
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App