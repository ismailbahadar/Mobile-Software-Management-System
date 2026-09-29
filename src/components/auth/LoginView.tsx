import React, { useState } from 'react';
import { 
  Lock, Key, UserCheck, ShieldCheck, Smartphone, Check, 
  Delete, RefreshCw, AlertCircle, ArrowRight, User as UserIcon, Globe,
  LogOut, Unlock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';
import { storage } from '../../db/storage';
import { User } from '../../types';

export const LoginView: React.FC = () => {
  const { users, login, currentUser, isLocked, unlockTerminal, logout } = useAuth();
  const { t, language, direction } = useLanguage();
  const settings = storage.getSettings();

  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return currentUser?.id || users[0]?.id || '';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick_select' | 'username'>('quick_select');
  const [usernameInput, setUsernameInput] = useState('');
  const [unlockOverride, setUnlockOverride] = useState(false); // To allow switching user even if locked

  const isTerminalLocked = isLocked && !unlockOverride;
  const targetUser = isTerminalLocked 
    ? currentUser 
    : (users.find(u => u.id === selectedUserId) || users[0]);

  const handleNumpadPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      // Auto-submit if PIN length matches 4
      if (nextPin.length === 4) {
        if (isTerminalLocked) {
          attemptUnlock(nextPin);
        } else {
          attemptLogin(selectedUserId, nextPin);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const attemptUnlock = (targetPin: string) => {
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const res = unlockTerminal(targetPin);
      if (!res.success) {
        setError(res.message || t('auth.invalid_pin'));
        setPin('');
      }
      setIsSubmitting(false);
    }, 200);
  };

  const attemptLogin = (targetIdOrUsername: string, targetPin: string) => {
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const result = login(targetIdOrUsername, targetPin);
      if (!result.success) {
        setError(result.message || t('auth.invalid_pin'));
        setPin('');
      }
      setIsSubmitting(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError(t('auth.enter_pin'));
      return;
    }

    if (isTerminalLocked) {
      attemptUnlock(pin);
    } else if (activeTab === 'quick_select') {
      attemptLogin(selectedUserId, pin);
    } else {
      if (!usernameInput.trim()) {
        setError('Please enter your username');
        return;
      }
      attemptLogin(usernameInput.trim(), pin);
    }
  };

  const handleQuickDemoFill = (user: User) => {
    if (isTerminalLocked) {
      setPin(user.pin || '1234');
      setError('');
      attemptUnlock(user.pin || '1234');
    } else {
      setSelectedUserId(user.id);
      setPin(user.pin || '1234');
      setError('');
      attemptLogin(user.id, user.pin || '1234');
    }
  };

  return (
    <div 
      dir={direction} 
      className={`min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto select-none ${direction === 'rtl' ? 'rtl-layout' : ''}`}
    >
      
      {/* Top Bar with Language Toggle & Shop Name */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-950 shrink-0">
            M
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-100 tracking-tight leading-tight">
              {settings.businessName}
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium">
              {isTerminalLocked ? t('auth.terminal_locked') : t('auth.multi_user_notice')}
            </p>
          </div>
        </div>

        {/* Prominent Language Switcher Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('header.language')}:</span>
          </span>
          <LanguageToggle variant="pill" />
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 my-auto">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto shadow-md ${
              isTerminalLocked 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {isTerminalLocked ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
            </div>

            <h2 className="text-xl font-black text-slate-100">
              {isTerminalLocked ? t('auth.terminal_locked') : t('auth.select_user')}
            </h2>
            <p className="text-xs text-slate-400">
              {isTerminalLocked 
                ? t('auth.enter_pin_to_unlock')
                : 'One shared PC terminal for cashiers, managers, technicians & staff'}
            </p>

            {/* If terminal locked, show quick option to switch user */}
            {isTerminalLocked ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockOverride(true);
                    setPin('');
                    setError('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors"
                >
                  {t('auth.switch_another_user')} →
                </button>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <div className="inline-flex bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('quick_select');
                      setError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                      activeTab === 'quick_select'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Staff Accounts Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('username');
                      setError('');
                    }}
                    className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                      activeTab === 'username'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Manual Username
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* If terminal is locked, display active user profile card */}
            {isTerminalLocked ? (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    {targetUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">{targetUser.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {targetUser.role}
                      </span>
                      <span>@{targetUser.username}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setUnlockOverride(true);
                  }}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title={t('header.logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('header.logout')}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Quick Staff Selection Cards */}
                {activeTab === 'quick_select' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {users.map(u => {
                        const isSelected = selectedUserId === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setPin('');
                              setError('');
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center relative ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </div>
                            )}
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm mb-2 shadow">
                              {u.name.charAt(0)}
                            </div>
                            <div className="font-bold text-xs truncate max-w-full">
                              {u.name.split(' ')[0]}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${
                              u.role === 'Admin'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : u.role === 'Manager'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {u.role}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {targetUser && (
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">{t('auth.logged_in_as')}:</span>
                          <span className="font-bold text-slate-200 text-sm">{targetUser.name}</span>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <span>{t('auth.role')}: <strong className="text-emerald-400">{targetUser.role}</strong></span>
                          {targetUser.lastLogin && (
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              Last: {targetUser.lastLogin}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Username Input Tab */}
                {activeTab === 'username' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Username / Staff ID
                      </label>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        placeholder="e.g. admin or cashier"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PIN Dots Display */}
            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold text-slate-300">
                {t('auth.enter_pin')}
              </label>
              
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      pin.length > idx
                        ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  />
                ))}
              </div>

              {/* Physical Input Fallback for Accessibility */}
              <input
                type="password"
                maxLength={6}
                value={pin}
                autoFocus
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  setError('');
                  if (val.length === 4) {
                    if (isTerminalLocked) {
                      attemptUnlock(val);
                    } else {
                      attemptLogin(activeTab === 'quick_select' ? selectedUserId : usernameInput, val);
                    }
                  }
                }}
                placeholder={t('auth.pin_placeholder')}
                className="w-full text-center tracking-[0.5em] px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-lg font-mono font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* On-Screen Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num)}
                  className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-lg font-bold font-mono text-slate-100 transition-all flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
              >
                {t('auth.clear')}
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-lg font-bold font-mono text-slate-100 transition-all flex items-center justify-center shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Authenticating...' 
                  : isTerminalLocked 
                  ? t('auth.unlock_btn') 
                  : t('auth.unlock')}
              </span>
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-center">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
              {t('auth.quick_demo_pin')}
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoFill(u)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <span className="font-semibold text-slate-200">{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">PIN: {u.pin || '1234'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-800/80 text-center text-xs text-slate-500 bg-slate-950 shrink-0">
        Apex POS & Installments Engine • Hafeez Centre, Lahore • Shared PC Multi-User Terminal
      </footer>
    </div>
  );
};
