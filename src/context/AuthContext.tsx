import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../db/storage';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isLocked: boolean;
  users: User[];
  login: (userIdOrUsername: string, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  lockTerminal: () => void;
  unlockTerminal: (pin: string) => { success: boolean; message?: string };
  switchUser: (userId: string, pin?: string) => { success: boolean; message?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STATUS_KEY = 'apex_pos_is_authenticated';
const LOCKED_STATUS_KEY = 'apex_pos_is_locked';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => storage.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTH_STATUS_KEY);
    // Default to true on initial open so app starts ready, but if explicitly logged out, keep false
    return saved !== 'false';
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem(LOCKED_STATUS_KEY) === 'true';
  });

  const db = storage.getDatabase();
  const users = db.users || [];

  // Sync state if currentUser changes in storage
  useEffect(() => {
    const unsub = storage.subscribe(() => {
      const u = storage.getCurrentUser();
      setCurrentUserState(u);
    });
    return unsub;
  }, []);

  const login = (userIdOrUsername: string, pin: string): { success: boolean; message?: string } => {
    const target = users.find(u => 
      u.id === userIdOrUsername || 
      u.username.toLowerCase() === userIdOrUsername.toLowerCase().trim()
    );

    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    if (!target.active) {
      return { success: false, message: 'This staff account is deactivated.' };
    }

    // Verify PIN
    if (target.pin && target.pin !== pin.trim()) {
      return { success: false, message: 'Incorrect PIN. Please try again.' };
    }

    // Update login timestamp
    target.lastLogin = new Date().toLocaleString('en-GB');
    storage.setCurrentUser(target);
    setCurrentUserState(target);
    setIsAuthenticated(true);
    setIsLocked(false);
    localStorage.setItem(AUTH_STATUS_KEY, 'true');
    localStorage.setItem(LOCKED_STATUS_KEY, 'false');

    storage.logAudit('USER_LOGIN', 'Security', target.id, `User ${target.name} logged into shared terminal.`);

    return { success: true };
  };

  const logout = () => {
    const user = currentUser;
    storage.logAudit('USER_LOGOUT', 'Security', user.id, `User ${user.name} logged out from shared terminal.`);
    setIsAuthenticated(false);
    setIsLocked(false);
    localStorage.setItem(AUTH_STATUS_KEY, 'false');
    localStorage.setItem(LOCKED_STATUS_KEY, 'false');
  };

  const lockTerminal = () => {
    setIsLocked(true);
    localStorage.setItem(LOCKED_STATUS_KEY, 'true');
  };

  const unlockTerminal = (pin: string): { success: boolean; message?: string } => {
    if (currentUser.pin && currentUser.pin !== pin.trim()) {
      return { success: false, message: 'Incorrect PIN to unlock terminal.' };
    }
    setIsLocked(false);
    localStorage.setItem(LOCKED_STATUS_KEY, 'false');
    return { success: true };
  };

  const switchUser = (userId: string, pin?: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'User not found' };

    if (pin && target.pin && target.pin !== pin.trim()) {
      return { success: false, message: 'Incorrect PIN.' };
    }

    target.lastLogin = new Date().toLocaleString('en-GB');
    storage.setCurrentUser(target);
    setCurrentUserState(target);
    setIsAuthenticated(true);
    setIsLocked(false);
    localStorage.setItem(AUTH_STATUS_KEY, 'true');
    localStorage.setItem(LOCKED_STATUS_KEY, 'false');

    storage.logAudit('USER_SWITCH', 'Security', target.id, `Switched terminal session to ${target.name} (${target.role}).`);

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLocked,
        users,
        login,
        logout,
        lockTerminal,
        unlockTerminal,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
