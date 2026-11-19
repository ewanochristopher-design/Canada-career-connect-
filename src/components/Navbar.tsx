import React, { useState } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  X,
} from 'lucide-react';
import type { PublicUser } from '../types.ts';
import { MapleLeafIcon } from './HeroArtwork.tsx';

interface NavbarProps {
  user: PublicUser | null;
  onNavigate: (view: 'home' | 'dashboard', sectionId?: string) => void;
  onFocusSearch: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNavigate,
  onFocusSearch,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'resources' | 'programs' | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Brand Lockup matching picture */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex shrink-0 items-center gap-2.5 text-left whitespace-nowrap"
        >
          <MapleLeafIcon className="h-9 w-9 text-[#D62839]" />
          <div className="font-display text-[17px] font-extrabold leading-[1.08] tracking-tight text-[#0A1D3D]">
            <div>Canada</div>
            <div>Career Connect</div>
          </div>
        </button>

        {/* Center Navigation Links matching picture */}
        <nav className="relative hidden items-center gap-6 text-[13px] font-semibold text-[#0A1D3D] lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-5 py-1.5 text-white shadow-sm transition hover:opacity-95 whitespace-nowrap shrink-0"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home', 'jobs-section')}
            className="hover:text-[#D62839] transition-colors whitespace-nowrap shrink-0"
          >
            Jobs
          </button>

          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('resources')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate('home', 'guides-section');
              }}
              className="inline-flex items-center gap-1 hover:text-[#D62839] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Career Resources</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'resources' && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onNavigate('home', 'guides-section');
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#0A1D3D] hover:bg-slate-50"
                >
                  Canadian CV &amp; ATS Guides
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onNavigate('home', 'relocation-desk');
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#0A1D3D] hover:bg-slate-50"
                >
                  Anti-Scam &amp; Relocation Desk
                </button>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('programs')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                onNavigate('home', 'services-section');
              }}
              className="inline-flex items-center gap-1 hover:text-[#D62839] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Programs</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {openDropdown === 'programs' && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onNavigate('home', 'services-section');
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#0A1D3D] hover:bg-slate-50"
                >
                  CV Rewrite &amp; Consultations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onNavigate('home', 'sectors-section');
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#0A1D3D] hover:bg-slate-50"
                >
                  High-Demand Canadian Sectors
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home', 'relocation-desk')}
            className="hover:text-[#D62839] transition-colors whitespace-nowrap shrink-0"
          >
            About
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home', 'faq-section')}
            className="hover:text-[#D62839] transition-colors whitespace-nowrap shrink-0"
          >
            Support
          </button>
        </nav>

        {/* Right Actions matching picture */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onFocusSearch}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-[#0A1D3D] transition hover:bg-slate-100 sm:inline-flex"
            aria-label="Search jobs"
          >
            <Search className="h-4 w-4" />
          </button>

          <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />

          {user ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95 whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#D62839]"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-full border border-slate-200/90 bg-slate-50/90 px-5 py-2 text-xs font-bold text-[#0A1D3D] shadow-xs transition hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-95 whitespace-nowrap shrink-0"
              >
                Get Started
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenu((v) => !v)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1.5 text-sm font-semibold text-[#0A1D3D]">
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home');
              }}
              className="rounded-xl bg-[#D62839]/10 px-3 py-2 text-left text-[#D62839]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'jobs-section');
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              Jobs
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'guides-section');
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              Career Resources
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'services-section');
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              Programs
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'relocation-desk');
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                onNavigate('home', 'faq-section');
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              Support
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
