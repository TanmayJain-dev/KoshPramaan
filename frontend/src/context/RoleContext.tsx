import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '../types';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  institutionId: string;
  setInstitutionId: (id: string) => void;
  roleDisplayName: string;
}

const roleNames: Record<UserRole, string> = {
  INSTITUTION: 'Institution (College)',
  SCRUTINY_OFFICER: 'Scrutiny Officer (Maker)',
  ASSISTANT_DIRECTOR: 'Assistant Director (Checker)',
  REGIONAL_OFFICER: 'Regional Officer (RO)',
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('SCRUTINY_OFFICER');
  const [institutionId, setInstitutionId] = useState<string>('INST-001');

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        institutionId,
        setInstitutionId,
        roleDisplayName: roleNames[role],
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
