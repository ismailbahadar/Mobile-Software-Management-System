import React, { useState } from 'react';
import {
  Menu, Search, Bell, Plus, CalendarCheck, Clock,
  ChevronDown, CheckCircle2, User as UserIcon, LogOut, Lock, Globe,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import { storage } from '../../db/storage';
import { MainTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../i18n/translations';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onNavigate: (tab: MainTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onNavigate,
}) => {
  const db = storage.getDatabase();
  const { currentUser, logout, lockTerminal, switchUser } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const notifications = db.notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSwitchUser = (userId: string) => {
    switchUser(userId);
    setShowUserDropdown(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setShowUserDropdown(false);
    logout();
  };

  const languages: Array<{ code: Language; label: string; flag: string; nativeName: string }> = [
    { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'EN' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰', nativeName: 'اردو' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  ];

  return (
    <>
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0 select-none">
        
        {/* Left Side: Sidebar Toggle & Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 text-sm transition-all w-52 md:w-72 lg:w-80 group text-left"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {t('header.search_placeholder')}
            </span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center / Right: Language Toggle, Action Shortcuts & Auth controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* PROMINENT TOGGLE BUTTON FOR URDU, ENGLISH, AND ARABIC */}
          <div 
            className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-700/80 shadow-inner"
            title={t('header.language')}
          >
            {languages.map(l => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                  title={l.label}
                >
                  <span className="text-[12px]">{l.flag}</span>
                  <span className="text-[11px] font-semibold">{l.nativeName}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Action POS shortcuts */}
          <button
            onClick={() => onNavigate('sales')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('header.new_sale')}</span>
          </button>

          <button
            onClick={() => onNavigate('closing')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-medium transition-all"
            title={t('header.daily_closing')}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('header.daily_closing')}</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
              title={t('header.notifications')}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">{t('header.stock_alerts')}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500/20 text-rose-300">
                      {unreadCount} Unread
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => storage.markAllNotificationsRead()}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 mt-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      All inventory levels and payments are optimal. No alerts!
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`py-2.5 px-2 rounded-lg transition-colors space-y-1 ${
                          n.read ? 'opacity-60 bg-transparent' : 'bg-slate-800/40 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {n.type === 'Low Stock' ? (
                              <span className={`w-2 h-2 rounded-full ${n.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                            )}
                            <span className="text-xs font-bold text-slate-200">{n.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 shrink-0 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                        
                        <div className="flex items-center justify-between pt-1">
                          {!n.read && (
                            <button
                              onClick={() => storage.markNotificationRead(n.id)}
                              className="text-[10px] text-slate-400 hover:text-white"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Lock Terminal Button */}
          <button
            onClick={() => lockTerminal()}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-colors border border-slate-700/50"
            title={t('header.lock_screen')}
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span>{currentUser.role}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in`}>
                {/* Active user details */}
                <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-950/40 rounded-xl mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">@{currentUser.username}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{t('header.active_terminal')}</span>
                  </p>
                </div>

                {/* Switch user options */}
                <div className="py-1">
                  <div className="flex items-center justify-between px-3 py-1">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {t('header.switch_account')}
                    </p>
                    <span className="text-[10px] text-slate-400">1-PC Multi-User</span>
                  </div>

                  <div className="space-y-0.5">
                    {db.users.map(u => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleSwitchUser(u.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                            isCurrent
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-white font-semibold'
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <span className="block truncate font-medium">{u.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">PIN: {u.pin || '1234'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {u.role}
                            </span>
                            {isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions: Lock Terminal & Logout */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      lockTerminal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 rounded-xl font-medium transition-colors"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>{t('header.lock_screen')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigate('users');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('header.manage_users')}</span>
                  </button>

                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DEDICATED PROMINENT LOGOUT BUTTON */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-500/30 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title={t('header.logout')}
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            <span className="hidden sm:inline">{t('header.logout')}</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                {t('header.logout')}
              </h3>
              <p className="text-xs text-slate-400">
                Log out <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role}) from this shared PC terminal?
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Other staff can immediately log in with their PIN or credentials.</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                {t('action.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-950"
              >
                {t('header.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
