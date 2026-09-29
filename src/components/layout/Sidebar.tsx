import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Truck, CalendarCheck, Smartphone,
  Users, DollarSign, BarChart3, Binary, QrCode, MessageSquare,
  Printer, ShieldCheck, Settings, Database, RefreshCw, Clock, Wrench,
  LogOut, Lock
} from 'lucide-react';
import { storage } from '../../db/storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export type MainTab = 
  | 'dashboard'
  | 'sales'
  | 'repairs'
  | 'purchases'
  | 'installments'
  | 'inventory'
  | 'parties'
  | 'expenses'
  | 'reports'
  | 'imei'
  | 'barcode'
  | 'whatsapp'
  | 'thermal'
  | 'users'
  | 'settings'
  | 'backup'
  | 'returns'
  | 'closing';

interface SidebarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
}) => {
  const db = storage.getDatabase();
  const settings = db.settings;
  const { currentUser, logout, lockTerminal } = useAuth();
  const { t, direction } = useLanguage();

  const activeInstallmentsCount = db.installments.filter(i => i.status === 'Active').length;
  const lowStockCount = db.items.filter(i => i.currentStock <= i.reorderLevel).length;
  const pendingRepairsCount = (db.repairs || []).filter(
    r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable'
  ).length;

  const menuItems: Array<{
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'sales', label: t('nav.sales'), icon: ShoppingCart },
    { 
      id: 'repairs', 
      label: t('nav.repairs'), 
      icon: Wrench, 
      badge: pendingRepairsCount > 0 ? `${pendingRepairsCount}` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
    },
    { id: 'purchases', label: t('nav.purchases'), icon: Truck },
    { 
      id: 'installments', 
      label: t('nav.installments'), 
      icon: CalendarCheck, 
      badge: activeInstallmentsCount > 0 ? activeInstallmentsCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    { 
      id: 'inventory', 
      label: t('nav.inventory'), 
      icon: Smartphone,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    { id: 'parties', label: t('nav.parties'), icon: Users },
    { id: 'expenses', label: t('nav.expenses'), icon: DollarSign },
    { id: 'imei', label: t('nav.imei'), icon: Binary },
    { id: 'returns', label: t('nav.returns'), icon: RefreshCw },
    { id: 'closing', label: t('nav.closing'), icon: Clock },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
    { id: 'barcode', label: t('nav.barcode'), icon: QrCode },
    { 
      id: 'whatsapp', 
      label: t('nav.whatsapp'), 
      icon: MessageSquare,
      badge: settings.whatsapp.isConnected ? 'Active' : 'Offline',
      badgeColor: settings.whatsapp.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
    },
    { id: 'thermal', label: t('nav.thermal'), icon: Printer },
    { id: 'users', label: t('nav.users'), icon: ShieldCheck },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
    { id: 'backup', label: t('nav.backup'), icon: Database },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-30 shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-950 shrink-0">
          M
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-100 truncate tracking-tight">
              {settings.businessName}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium truncate">
              {t('header.active_terminal')}
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shared PC Logged-In User Card with Logout */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/70 shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate leading-tight">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{currentUser.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => lockTerminal()}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                title={t('header.lock_screen')}
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                title={t('header.logout')}
              >
                <LogOut className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => logout()}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
              title={`${t('header.logout')} (${currentUser.name})`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
