import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { AdminHeader } from './AdminHeader.tsx';
import { useAuth } from '../store/AuthContext.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { ROUTES } from '../lib/constants.ts';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onMobileMenuClick={() => setMobileOpen(true)} />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
