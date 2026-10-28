import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DemoUser, UserRole } from '../types';
import { apiClient } from '../api';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  INSTITUTION_MAKER: 'Institution Maker (College Staff)',
  INSTITUTION_CHECKER: 'Institution Checker (College Authority)',
  REGIONAL_OFFICER: 'Regional Officer (RO)',
  SCRUTINY_OFFICER: 'Scrutiny Officer (Vigilance HQ)',
  BANK_VERIFIER: 'Bank Verifier (CBS Reconciliation)',
  AICTE_ADMIN: 'AICTE HQ Administrator',
};

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  demoUsers: DemoUser[];
  loginAsUsername: (username: string) => Promise<void>;
  logout: () => void;
  switchPersonaModalOpen: boolean;
  setSwitchPersonaModalOpen: (open: boolean) => void;
  roleDisplayName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [switchPersonaModalOpen, setSwitchPersonaModalOpen] = useState<boolean>(false);

  // Load demo users list and current user session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const users = await apiClient.getDemoUsers();
        if (isMounted) setDemoUsers(users);

        const storedToken = apiClient.getToken();
        if (storedToken) {
          try {
            const me = await apiClient.getMe();
            if (isMounted) {
              setUser(me);
              setToken(storedToken);
            }
          } catch (e) {
            apiClient.clearToken();
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => { isMounted = false; };
  }, []);

  const loginAsUsername = async (username: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(username);
      setUser(res.user);
      setToken(res.access_token);
      setSwitchPersonaModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    setToken(null);
  };

  const activeRole: UserRole = user?.role || 'INSTITUTION_MAKER';
  const roleDisplayName = ROLE_DISPLAY_NAMES[activeRole] || activeRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole,
        token,
        isLoading,
        demoUsers,
        loginAsUsername,
        logout,
        switchPersonaModalOpen,
        setSwitchPersonaModalOpen,
        roleDisplayName,
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

// Backwards-compatible hook
export const useRole = () => {
  const auth = useAuth();
  return {
    role: auth.role,
    setRole: (newRole: UserRole) => {
      // Find a demo user with this role
      const match = auth.demoUsers.find((u) => u.role === newRole);
      if (match) {
        auth.loginAsUsername(match.username);
      }
    },
    institutionId: auth.user?.institution_id || 'INST-001',
    setInstitutionId: () => {},
    roleDisplayName: auth.roleDisplayName,
  };
};
