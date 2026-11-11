import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, KioskLayout } from '../layouts/index.ts';
import { LoginPage } from '../pages/auth/LoginPage.tsx';
import { RegisterStudentPage } from '../pages/registrar/RegisterStudentPage.tsx';
import { StudentsDirectoryPage } from '../pages/registrar/StudentsDirectoryPage.tsx';
import { PromissoryRequestPage } from '../pages/registrar/PromissoryRequestPage.tsx';
import { BalanceManagementPage } from '../pages/accounting/BalanceManagementPage.tsx';
import { PromissoryAccountingPage } from '../pages/accounting/PromissoryAccountingPage.tsx';
import { ReprintPaymentsPage } from '../pages/accounting/ReprintPaymentsPage.tsx';
import { PaymentHistoryPage } from '../pages/accounting/PaymentHistoryPage.tsx';
import { KioskPage } from '../pages/kiosk/KioskPage.tsx';
import { PermitPrintPage } from '../pages/kiosk/PermitPrintPage.tsx';
import { ROUTES } from '../lib/constants.ts';
import { useAuth } from '../store/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  element: React.ReactElement;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, element }) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const currentRole = (role?.toUpperCase() || 'REGISTRAR') as UserRole;
  if (!allowedRoles.includes(currentRole)) {
    // If user attempts to access an unauthorized portal, redirect to their role's authorized home
    const fallbackPath = currentRole === 'ACCOUNTING' ? ROUTES.ACCOUNTING.BALANCES : ROUTES.REGISTRAR.STUDENTS;
    return <Navigate to={fallbackPath} replace />;
  }

  return element;
};

export const AppRoutes: React.FC = () => {
  const { role } = useAuth();
  const defaultHome = role?.toUpperCase() === 'ACCOUNTING' ? ROUTES.ACCOUNTING.BALANCES : ROUTES.REGISTRAR.STUDENTS;

  return (
    <Routes>
      {/* 1. Public Staff Login */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* 2. Standalone Fullscreen Student Touchscreen Kiosk */}
      <Route element={<KioskLayout />}>
        <Route path={ROUTES.KIOSK} element={<KioskPage />} />
      </Route>

      {/* Clean Printable Permit Document */}
      <Route path="/print/permit/:id" element={<PermitPrintPage />} />

      {/* 3 & 4. Staff Portals (Protected by Role-Based Access Control) */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to={defaultHome} replace />} />
        <Route path="/dashboard" element={<Navigate to={defaultHome} replace />} />

        {/* Registrar Operations - STRICTLY REGISTRAR ONLY */}
        <Route
          path={ROUTES.REGISTRAR.STUDENTS}
          element={<RoleRoute allowedRoles={['REGISTRAR']} element={<StudentsDirectoryPage />} />}
        />
        <Route
          path={ROUTES.REGISTRAR.REGISTER}
          element={<RoleRoute allowedRoles={['REGISTRAR']} element={<RegisterStudentPage />} />}
        />
        <Route
          path={ROUTES.REGISTRAR.PROMISSORY}
          element={<RoleRoute allowedRoles={['REGISTRAR']} element={<PromissoryRequestPage />} />}
        />

        {/* Accounting Operations - STRICTLY ACCOUNTING ONLY */}
        <Route
          path={ROUTES.ACCOUNTING.BALANCES}
          element={<RoleRoute allowedRoles={['ACCOUNTING']} element={<BalanceManagementPage />} />}
        />
        <Route
          path={ROUTES.ACCOUNTING.PROMISSORY}
          element={<RoleRoute allowedRoles={['ACCOUNTING']} element={<PromissoryAccountingPage />} />}
        />
        <Route
          path={ROUTES.ACCOUNTING.REPRINTS}
          element={<RoleRoute allowedRoles={['ACCOUNTING']} element={<ReprintPaymentsPage />} />}
        />
        <Route
          path={ROUTES.ACCOUNTING.HISTORY}
          element={<RoleRoute allowedRoles={['ACCOUNTING']} element={<PaymentHistoryPage />} />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultHome} replace />} />
    </Routes>
  );
};
