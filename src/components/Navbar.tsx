import React, { useState } from 'react';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { NotificationRecord, PublicUser } from '../types.ts';

interface NavbarProps {
  user: PublicUser | null;
  currency: 'CAD' | 'KES';
  onToggleCurrency: () => void;
  notifications: NotificationRecord[];
  onMarkNotificationRead: (id: string) => void;
  activeView: 'home' | 'dashboard';
  onNavigate: (view: 'home' | 'dashboard', sectionId?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currency,
  onToggleCurrency,
  notifications,
  onMarkNotificationRead,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="bg-[#071B33] px-4 py-1.5 text-center text-[11px] font-medium text-slate-200">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D62839]" />
          Independent Recruitment Discovery &amp; Relocation Guidance Platform · Job discovery is free · Not an IRCC government agency
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071B33] text-white shadow-sm">
            <Briefcase className="h-5 w-5 text-[#D62839]" />
          </div>
          <div>
            <div className="font-display text-base font-extrabold tracking-tight text-[#071B33] sm:text-lg">
              Canada Career Connect
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Your Career. Your Future. Your Canada.
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <button
            type="button"
            onClick={() => onNavigate('home', 'jobs-section')}
            className="hover:text-[#071B33]"
          >
            Jobs Marketplace
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home', 'services-section')}
            className="hover:text-[#071B33]"
          >
            CV &amp; Advisory
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home', 'relocation-desk')}
            className="hover:text-[#071B33]"
          >
            Relocation Desk
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home', 'guides-section')}
            className="hover:text-[#071B33]"
          >
            Guides &amp; FAQ
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleCurrency}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-[#071B33] hover:bg-slate-100"
            title="Switch displayed currency between CAD and KES"
          >
            {currency === 'CAD' ? 'CAD $' : 'KES'}
          </button>

          {user ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-[#071B33]"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D62839] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Notifications
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => onMarkNotificationRead(n.id)}
                            className={`cursor-pointer rounded-lg border p-2.5 text-xs transition ${
                              n.read
                                ? 'border-slate-100 bg-white text-slate-500'
                                : 'border-[#D62839]/20 bg-[#D62839]/5 text-[#071B33]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 font-semibold">
                              <span>{n.title}</span>
                              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D62839]" />}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onNavigate(activeView === 'dashboard' ? 'home' : 'dashboard')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#071B33] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0D2C54]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {activeView === 'dashboard' ? 'Browse Site' : `${user.role.toUpperCase()} Portal`}
                </span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-[#D62839]"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#071B33] hover:bg-slate-50"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D62839] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#B81F2E]"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Join Free</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenu((v) => !v)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2 text-sm font-semibold text-[#071B33]">
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'jobs-section');
              }}
              className="rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
            >
              Jobs Marketplace
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'services-section');
              }}
              className="rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
            >
              CV &amp; Advisory Services
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'relocation-desk');
              }}
              className="rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
            >
              Relocation Desk
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'guides-section');
              }}
              className="rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
            >
              Guides &amp; FAQ
            </button>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenu(false);
                  onNavigate('dashboard');
                }}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[#071B33] px-3 py-2 text-white"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Open {user.role.toUpperCase()} Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
