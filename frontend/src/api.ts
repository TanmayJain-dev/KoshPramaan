import { 
  AuditVerify, 
  AuditEvent, 
  ClockState, 
  DemoStatus, 
  Institution, 
  FDR, 
  RuleItem, 
  User, 
  DemoUser, 
  LoginResponse,
  FDRCreateData,
  DuplicateSummary
} from './types';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const TOKEN_KEY = 'koshpramaan_auth_token';

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  // Auth & Personas
  getDemoUsers(): Promise<DemoUser[]> {
    return this.fetchWithAuth('/auth/demo-users');
  },

  async login(username: string): Promise<LoginResponse> {
    const res: LoginResponse = await this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  },

  getMe(): Promise<User> {
    return this.fetchWithAuth('/auth/me');
  },

  // Clock (Admin only for mutations)
  getClock(): Promise<ClockState> {
    return this.fetchWithAuth('/clock');
  },

  advanceClock(days: number): Promise<ClockState> {
    return this.fetchWithAuth('/clock/advance', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },

  resetClock(): Promise<ClockState> {
    return this.fetchWithAuth('/clock/reset', {
      method: 'POST',
    });
  },

  // Audit
  verifyAudit(): Promise<AuditVerify> {
    return this.fetchWithAuth('/audit/verify');
  },

  getEvents(limit: number = 40): Promise<AuditEvent[]> {
    return this.fetchWithAuth(`/audit/events?limit=${limit}`);
  },

  simulateTamper(eventId: number): Promise<any> {
    return this.fetchWithAuth(`/audit/tamper-demo?event_id=${eventId}`, {
      method: 'POST',
    });
  },

  // Institutions
  getInstitutions(institutionId?: string): Promise<Institution[]> {
    const query = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : '';
    return this.fetchWithAuth(`/institutions${query}`);
  },

  getInstitution(id: string): Promise<Institution> {
    return this.fetchWithAuth(`/institutions/${id}`);
  },

  // FDRs & Workflows
  getFDRs(institutionId?: string): Promise<FDR[]> {
    const query = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : '';
    return this.fetchWithAuth(`/fdrs${query}`);
  },

  getFDR(id: string): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}`);
  },

  createDraftFDR(data: FDRCreateData): Promise<FDR> {
    return this.fetchWithAuth('/fdrs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDraftFDR(id: string, data: Partial<FDRCreateData>): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  submitFDRToChecker(id: string, notes?: string): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  checkerReviewFDR(id: string, action: 'approve' | 'return', remarks: string): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}/checker-review`, {
      method: 'POST',
      body: JSON.stringify({ action, remarks }),
    });
  },

  roReviewFDR(id: string, action: 'approve' | 'reject' | 'clarify', remarks: string): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}/ro-review`, {
      method: 'POST',
      body: JSON.stringify({ action, remarks }),
    });
  },

  bankVerifyFDR(id: string, action: 'confirm' | 'flag_mismatch', bankValue?: string, notes?: string): Promise<FDR> {
    return this.fetchWithAuth(`/fdrs/${id}/bank-verify`, {
      method: 'POST',
      body: JSON.stringify({ action, bank_value: bankValue, notes }),
    });
  },

  getDecayWatchlist(): Promise<FDR[]> {
    return this.fetchWithAuth('/fdrs/watchlist/decay');
  },

  getDuplicateSummary(): Promise<DuplicateSummary> {
    return this.fetchWithAuth('/fdrs/duplicates/summary');
  },

  // Rules
  getRules(): Promise<RuleItem[]> {
    return this.fetchWithAuth('/rules');
  },

  // Demo status & Reset
  getDemoStatus(): Promise<DemoStatus> {
    return this.fetchWithAuth('/demo/status');
  },

  resetDemo(): Promise<any> {
    return this.fetchWithAuth('/demo/reset', {
      method: 'POST',
    });
  },
};
