import React from 'react';
import {
  BarChart3,
  Bus,
  CalendarClock,
  Compass,
  LayoutDashboard,
  Lock,
  MapPin,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { NavTabId, UserRole } from '../types/dolandarjo';
import { PWAInstallButton } from './PWAInstallButton';
import { PesonaDeltaLogo } from './PesonaDeltaLogo';
import { SidoarjoBatikPattern } from './SidoarjoBatikPattern';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  pendingCount: number;
  openTicketCount: number;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  activeRole,
  onChangeRole,
  pendingCount,
  openTicketCount,
}) => {
  const isExecutiveRole =
    activeRole === 'Super Admin (Pranata Komputer)' ||
    activeRole === 'Approver (Pimpinan Disporapar)';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'peminjaman', label: 'Peminjaman Bus', icon: CalendarClock, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'rute-odl', label: 'Rute ODL (One Day Loop)', icon: MapPin },
    { id: 'peta-webar', label: 'Peta WebAR & Destinasi Sidoarjo', icon: Compass },
    { id: 'mitra', label: 'Manajemen Mitra/Komunitas', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: openTicketCount > 0 ? openTicketCount : undefined },
    { id: 'analytics', label: 'Analytics & Management Brief', icon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const handleNavClick = (id: NavTabId) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B1F3A] text-slate-100 select-none">
      {/* Motif Batik Jetis Sidoarjo Top Ribbon */}
      <SidoarjoBatikPattern variant="ribbon" className="shrink-0" />

      {/* Institutional Brand Lockup with Pesona Delta Emblem */}
      <div className="relative overflow-hidden flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <SidoarjoBatikPattern variant="hero" className="absolute inset-0 opacity-20" />
        <div className="relative z-10 flex items-center gap-3 min-w-0">
          <PesonaDeltaLogo variant="compact" />
          <div className="min-w-0">
            <div className="font-display text-base font-extrabold tracking-tight text-white truncate">
              DOLAN <span className="text-lime-300">DARJO</span>
            </div>
            <div className="text-[11px] font-medium text-cyan-200/90 truncate">
              Pesona Delta · Disporapar
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="relative z-10 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Tutup menu navigasi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu Utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 to-lime-400/15 text-white border border-cyan-400/45'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-lime-300' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'analytics' && !isExecutiveRole && (
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label="Khusus Admin & Pimpinan" />
              )}
              {item.badge !== undefined && (
                <span
                  className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${
                    item.id === 'maintenance' ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Institutional Context & PWA Action */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
          <label htmlFor="sidebar-role-select" className="block text-[11px] text-slate-400">
            Peran Akses Aktif (RBAC)
          </label>
          <select
            id="sidebar-role-select"
            value={activeRole}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="mt-1 w-full rounded bg-[#07162B] border border-white/15 px-2 py-1 text-xs font-medium text-white focus:border-sky-400 focus:outline-none"
          >
            <option value="Super Admin (Pranata Komputer)">Super Admin (Admin Disporapar)</option>
            <option value="Approver (Pimpinan Disporapar)">Approver (Pimpinan Disporapar)</option>
            <option value="Operator / Verifikator">Operator / Verifikator</option>
            <option value="Kru / Pengemudi Bus">Kru / Pengemudi Bus</option>
            <option value="Pemohon Masyarakat">Pemohon Masyarakat</option>
          </select>
        </div>
        <PWAInstallButton variant="sidebar" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-68 border-r border-slate-200">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
