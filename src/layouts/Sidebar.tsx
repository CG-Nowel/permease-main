import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Banknote,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  FileSignature,
  FileCheck2,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.tsx';
import { useStudentStore } from '../store/studentStore.ts';
import { ROUTES } from '../lib/constants.ts';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { promissoryRequests } = useStudentStore();
  const pendingPromissoryCount = promissoryRequests.filter((p) => p.status === 'PENDING').length;

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
    if (window.innerWidth < 768 && onMobileClose) {
      onMobileClose();
    }
  };

  const renderNavLink = (item: NavItemConfig) => {
    const Icon = item.icon;
    const hasBadge = item.badge !== undefined && item.badge !== 0;
    const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={(e) => handleNavClick(e, item.to)}
        title={collapsed ? item.label : undefined}
        className={
          collapsed
            ? `relative w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 select-none cursor-pointer ${
                isActive
                  ? 'bg-blue-600/30 text-[#D4AF37] ring-1.5 ring-[#D4AF37]/90 shadow-md shadow-blue-900/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`
            : `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 select-none cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 text-white font-semibold border-l-2 border-[#D4AF37] shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
              }`
        }
      >
        <div className="relative shrink-0">
          <Icon
            size={collapsed ? 20 : 18}
            className={`transition-colors ${
              isActive ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {collapsed && hasBadge && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0A1324] animate-pulse" />
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="truncate">{item.label}</span>
            {hasBadge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40 leading-none">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-20 flex flex-col justify-between bg-gradient-to-b from-[#0A1324] via-[#070E1A] to-[#040810] text-white border-r border-white/[0.08] shadow-2xl transition-all duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Top Header & Branding */}
        <div className="flex-1 flex flex-col min-h-0">
          {!collapsed ? (
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/images/logox.jpg"
                  alt="PermEase"
                  className="h-7 sm:h-8 w-auto object-contain select-none shrink-0 rounded-md"
                />
                <div className="min-w-0">
                  <span className="font-serif-brand font-black text-white text-sm sm:text-base tracking-wider block leading-tight truncate">
                    PERM<span className="text-[#D4AF37]">EASE</span>
                  </span>
                  <span className="text-[10px] tracking-wider text-[#D4AF37] uppercase font-semibold block leading-tight">
                    {role?.toUpperCase() === 'ACCOUNTING' ? 'Accounting Portal' : 'Registrar Portal'}
                  </span>
                </div>
              </div>

              {/* Desktop Collapse Fold Button */}
              <button
                type="button"
                onClick={onToggle}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all cursor-pointer border border-white/10 shrink-0"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onMobileClose}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3.5 px-2 border-b border-white/[0.08] gap-2.5 shrink-0">
              {/* Centered Logo */}
              <div className="flex items-center justify-center py-0.5">
                <img
                  src="/images/logox.jpg"
                  alt="PermEase"
                  className="h-7 sm:h-8 w-auto object-contain select-none rounded-md"
                />
              </div>

              {/* Desktop Expand Fold Button */}
              <button
                type="button"
                onClick={onToggle}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 text-slate-400 transition-all duration-150 cursor-pointer border border-white/10 shrink-0 shadow-xs"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Navigation Links List */}
          <nav className="p-3 space-y-4 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
            {/* Registrar Operations - Only visible to REGISTRAR role */}
            {(!role || role.toUpperCase() === 'REGISTRAR') && (
              <div className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/90">
                    Registrar Portal
                  </p>
                ) : (
                  <div className="my-1.5 mx-auto w-6 border-t border-white/10" />
                )}
                {renderNavLink({
                  to: ROUTES.REGISTRAR.STUDENTS,
                  label: 'Student Enrolled',
                  icon: Users,
                })}
                {renderNavLink({
                  to: ROUTES.REGISTRAR.REGISTER,
                  label: 'Register Student',
                  icon: UserPlus,
                })}
                {renderNavLink({
                  to: ROUTES.REGISTRAR.PROMISSORY,
                  label: 'Promissory Request',
                  icon: FileSignature,
                })}
              </div>
            )}

            {/* Accounting Operations - Only visible to ACCOUNTING role */}
            {role?.toUpperCase() === 'ACCOUNTING' && (
              <div className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/90">
                    Accounting Portal
                  </p>
                ) : (
                  <div className="my-1.5 mx-auto w-6 border-t border-white/10" />
                )}
                {renderNavLink({
                  to: ROUTES.ACCOUNTING.BALANCES,
                  label: 'Balance Status',
                  icon: ShieldCheck,
                })}
                {renderNavLink({
                  to: ROUTES.ACCOUNTING.PROMISSORY,
                  label: 'Promissory Notes',
                  icon: FileCheck2,
                  badge: pendingPromissoryCount > 0 ? pendingPromissoryCount : undefined,
                })}
                {renderNavLink({
                  to: ROUTES.ACCOUNTING.REPRINTS,
                  label: 'Reprint Payments',
                  icon: Banknote,
                })}
                {renderNavLink({
                  to: ROUTES.ACCOUNTING.HISTORY,
                  label: 'Payment History',
                  icon: History,
                })}
              </div>
            )}

            {/* Student Kiosk System */}
            <div className="space-y-1">
              {!collapsed ? (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/90">
                  Kiosk System
                </p>
              ) : (
                <div className="my-1.5 mx-auto w-6 border-t border-white/10" />
              )}
              {renderNavLink({
                to: ROUTES.KIOSK,
                label: 'Touchscreen Kiosk',
                icon: Monitor,
              })}
            </div>
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-white/[0.08] bg-black/25 shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/10">
                  {user?.name ? user.name[0].toUpperCase() : 'S'}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0A1324]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.name || 'Staff User'}
                  </p>
                  <span className="inline-block text-[10px] font-semibold text-[#D4AF37] uppercase tracking-wide leading-tight mt-0.5">
                    {role || 'STAFF'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 py-1">
              {/* Collapsed Avatar */}
              <div
                className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/10"
                title={`${user?.name || 'Staff User'} (${role || 'STAFF'})`}
              >
                {user?.name ? user.name[0].toUpperCase() : 'S'}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0A1324]" />
              </div>

              {/* Collapsed Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-white/5 hover:border-rose-500/20"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
