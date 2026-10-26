import { 
  AuditVerify, 
  AuditEvent, 
  ClockState, 
  DemoStatus, 
  Institution, 
  FDR, 
  RuleItem, 
  UserRole 
} from './types';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const apiClient = {

  async fetchWithRole(url: string, role: UserRole, institutionId: string = 'INST-001', options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': role,
      'X-Institution-Id': institutionId,
      'X-User-Actor': `${role}_USER`,
      ...(options.headers || {}),
    };
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  // Clock
  getClock(role: UserRole): Promise<ClockState> {
    return this.fetchWithRole('/clock', role);
  },
  advanceClock(days: number, role: UserRole): Promise<ClockState> {
    return this.fetchWithRole('/clock/advance', role, 'INST-001', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },
  resetClock(role: UserRole): Promise<ClockState> {
    return this.fetchWithRole('/clock/reset', role, 'INST-001', {
      method: 'POST',
    });
  },

  // Audit
  verifyAudit(role: UserRole): Promise<AuditVerify> {
    return this.fetchWithRole('/audit/verify', role);
  },
  getEvents(limit: number = 30, role: UserRole): Promise<AuditEvent[]> {
    return this.fetchWithRole(`/audit/events?limit=${limit}`, role);
  },
  simulateTamper(eventId: number, role: UserRole): Promise<any> {
    return this.fetchWithRole(`/audit/tamper-demo?event_id=${eventId}`, role, 'INST-001', {
      method: 'POST',
    });
  },

  // Institutions
  getInstitutions(role: UserRole, institutionId?: string): Promise<Institution[]> {
    return this.fetchWithRole('/institutions', role, institutionId);
  },

  // FDRs
  getFDRs(role: UserRole, institutionId?: string): Promise<FDR[]> {
    return this.fetchWithRole('/fdrs', role, institutionId);
  },
  getDuplicateSummary(role: UserRole): Promise<any> {
    return this.fetchWithRole('/fdrs/duplicates/summary', role);
  },

  // Rules
  getRules(role: UserRole): Promise<RuleItem[]> {
    return this.fetchWithRole('/rules', role);
  },

  // Demo status and reset
  getDemoStatus(role: UserRole): Promise<DemoStatus> {
    return this.fetchWithRole('/demo/status', role);
  },
  resetDemo(role: UserRole): Promise<any> {
    return this.fetchWithRole('/demo/reset', role, 'INST-001', {
      method: 'POST',
    });
  },
};
