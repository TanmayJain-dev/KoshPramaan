# KoshPramaan (AICTE Security Deposit & FDR Portal) - Architectural & Security Audit

**Date**: 2026-10-28  
**Scope**: Codebase audit of Authentication, Role-Based Access Control (RBAC), Data Scoping, Workflow State Machine, and Frontend/Backend Routing.

---

## 1. Executive Summary

KoshPramaan (कोष-प्रमाण) currently operates as a prototype where **all user roles view the same monolithic dashboard and data**. There is no cryptographically signed session or authentication layer: the backend trusts raw, spoofable HTTP headers (`X-User-Role`, `X-Institution-Id`), while the frontend exposes privileged administrative functions (clock manipulation, demo database wipes, cryptographic tamper simulation) to every user in the UI header and body.

Furthermore, critical workflow operations required for an institutional deposit portal—such as FDR draft creation, maker-checker segregation, regional officer approval pipelines, and bank verification actions—lack backend endpoints and interactive frontend interfaces.

---

## 2. Current Auth & Role Architecture

### 2.1 Backend Role Handling
- **Authentication Scheme**: **None**. There is no login endpoint, password verification, session cookie, or JSON Web Token (JWT) verification.
- **Role & Scope Transport**: Unsigned HTTP headers:
  - `X-User-Role`: defaults to `"SCRUTINY_OFFICER"` or `"SYSTEM"` across endpoints.
  - `X-Institution-Id`: defaults to `""` or `"INST-001"`.
  - `X-User-Actor`: defaults to `"{role}_USER"` or `"SYSTEM_CLOCK"`.
- **Vulnerabilities**:
  - Any external client can forge `X-User-Role: AICTE_ADMIN` or arbitrary `X-Institution-Id` to bypass filtering.
  - No signature, expiry (`exp`), or issue timestamp (`iat`) validation exists.
  - Roles in backend are loosely defined strings (`"INSTITUTION"`, `"SCRUTINY_OFFICER"`, `"ASSISTANT_DIRECTOR"`, `"REGIONAL_OFFICER"`, `"SYSTEM"`) rather than a validated enum.

### 2.2 Frontend Role Handling
- **State Management**: `RoleContext.tsx` holds ephemeral React state:
  ```typescript
  const [role, setRole] = useState<UserRole>('SCRUTINY_OFFICER');
  const [institutionId, setInstitutionId] = useState<string>('INST-001');
  ```
- **Storage**: No `localStorage` or `sessionStorage` persistence. A page refresh resets the role to `SCRUTINY_OFFICER` and institution to `INST-001`.
- **API Client (`api.ts`)**: Injects the unverified headers:
  ```typescript
  'X-User-Role': role,
  'X-Institution-Id': institutionId,
  'X-User-Actor': `${role}_USER`
  ```
- **Routing**: `react-router-dom` is declared as a dependency in `package.json`, but is **completely unused** in `main.tsx` and `App.tsx`. All components are rendered on a single page, regardless of role.

---

## 3. Route, Nav, and Endpoint Scoping Matrix

| Route / Surface | Frontend Component | Backend Endpoint | Current Allowed Roles | Intended Scoped Roles | Current Scope Flaws |
|---|---|---|---|---|---|
| **Health Check** | *(None)* | `GET /health`, `GET /api/health` | Public | Public / Health Probes | None (public) |
| **Clock Status** | Header Time Machine Pill | `GET /api/clock` | All | All (Read-only) | None |
| **Clock Advance** | Header `+7d`, `+30d`, `+90d` | `POST /api/clock/advance` | **All** | **AICTE HQ Admin Only** | Anyone can advance simulation time |
| **Clock Reset** | Header `Reset Clock` icon | `POST /api/clock/reset` | **All** | **AICTE HQ Admin Only** | Anyone can reset clock |
| **Demo State Reset** | Header `Reset Demo` button | `POST /api/demo/reset` | **All** | **AICTE HQ Admin Only** | Anyone can wipe the DB and reseed |
| **Demo Status** | `AdaptersStatus.tsx` | `GET /api/demo/status` | All | AICTE HQ Admin / Scrutiny | Exposes adapter debug internals to colleges |
| **Audit Verify** | `AuditChainStatus.tsx` | `GET /api/audit/verify` | All | Scrutiny Officer, HQ Admin | Validated publicly |
| **Audit Events Log** | `AuditChainStatus.tsx` (Table) | `GET /api/audit/events` | All | Scrutiny Officer, HQ Admin | All events visible to colleges |
| **Tamper Simulation** | `AuditChainStatus.tsx` Button | `POST /api/audit/tamper-demo` | **All** | **AICTE HQ Admin Only** | Any visitor can corrupt DB records |
| **Rules List** | `RulesRegistry.tsx` | `GET /api/rules` | All | HQ Admin (Full), others read-only | Displayed unconditionally on home |
| **Rule Detail** | *(None)* | `GET /api/rules/{key}` | All | HQ Admin | Unscoped |
| **Institutions List** | `InstitutionsRegistry.tsx` (Tabs) | `GET /api/institutions` | Partial (`if role==INSTITUTION`) | **Maker/Checker**: Own Inst<br>**RO**: Own Region<br>**Scrutiny/Admin**: All | If `X-Institution-Id` is empty, INSTITUTION gets all colleges. RO gets all regions. |
| **Institution Detail**| *(None)* | `GET /api/institutions/{id}` | All | Scoped to role permissions | No scope checks |
| **FDRs List** | `InstitutionsRegistry.tsx` (Table) | `GET /api/fdrs` | Partial | **Maker/Checker**: Own Inst<br>**RO**: Own Region<br>**Bank**: Own Bank<br>**Scrutiny/Admin**: All | Hardcodes `INST-001` fallback; ignores region and bank filtering. |
| **FDR Detail** | *(None)* | `GET /api/fdrs/{id}` | All | Scoped to role permissions | No scope checks |
| **Duplicate Summary** | Confidential Alert Banner | `GET /api/fdrs/duplicates/summary` | Non-INSTITUTION | **Scrutiny Officer Only** | RO and HQ Admin can see raw alerts; 403 only checks `INSTITUTION`. |
| **FDR Claim Draft/Submit** | *(Missing)* | *(Missing)* | Nobody | **Institution Maker** | Workflow endpoints not implemented |
| **Checker Review/Approve** | *(Missing)* | *(Missing)* | Nobody | **Institution Checker** | `maker != checker` cannot be enforced |
| **RO Review/Approve/Reject**| *(Missing)* | *(Missing)* | Nobody | **Regional Officer** | RO workflow not implemented |
| **Bank Attestation** | *(Missing)* | *(Missing)* | Nobody | **Bank Verifier** | Verifier confirm/mismatch not implemented |

---

## 4. Hardcoded & Ignored Scoping Invariants

1. **Absence of Maker vs. Checker Distinction**:
   - `RoleContext.tsx` maps `SCRUTINY_OFFICER` to `"Scrutiny Officer (Maker)"` and `ASSISTANT_DIRECTOR` to `"Assistant Director (Checker)"`. These are AICTE roles, not Institution roles.
   - The required roles:
     - `INSTITUTION_MAKER`: College staff who draft and submit FDRs.
     - `INSTITUTION_CHECKER`: College authority who reviews and approves Maker submissions.
     - The rule `maker_id != checker_id` is currently impossible to enforce because there is no submission or verification history recording user IDs.
2. **Missing Regional Officer Boundary**:
   - The backend `Institution` table has a `region` field (`Northern Region`, `Western Region`), but `institutions_router.py` and `fdrs_router.py` never filter by `region` for Regional Officers.
3. **Missing Bank Verifier Role & Boundary**:
   - The `Verifier` model exists in the database and bank adapters, but there is no `BANK_VERIFIER` role in the frontend or API authorization layer. Bank officers cannot log in or view FDRs restricted to their bank (`State Bank of India`, `Punjab National Bank`, `Bank of Baroda`).
4. **Hardcoded IDs in Client Mutations**:
   - In `frontend/src/api.ts`, mutations for `/clock/advance`, `/clock/reset`, `/audit/tamper-demo`, and `/demo/reset` hardcode `institutionId: 'INST-001'`.
   - In `backend/app/routers/fdrs_router.py`:
     ```python
     if role == "INSTITUTION":
         target_id = inst_id or institution_id or "INST-001"
     ```
     If an institution user forgets to send a header, they are silently assigned to `Apex Institute of Technology`.

---

## 5. UI Defects, Dead Interactions & Error Vectors

1. **No Application Layout / Navigation**:
   - The UI lacks a Sidebar, Navigation Header, and Dedicated Views. All widgets (Audit Ledger, Institutions, Rules Table, Mock Adapters) are stacked in a single scrolling page.
2. **Missing Interactive Action Buttons**:
   - FDRs table displays static rows. There is no way for a Maker to add an FDR, for a Checker to approve/send back, for an RO to take action, or for a Bank Verifier to confirm/mismatch.
3. **Exposed Administrative Controls in Header**:
   - Time travel controls (`+7d`, `+30d`, `+90d`, `Reset Clock`) and the destructive `Reset Demo` button are placed in the global header, giving ordinary college makers access to rewrite system state.
4. **Tamper Button Visible to All**:
   - `AuditChainStatus.tsx` exposes the `Simulate Tamper` button to any role, allowing non-admin users to break the SHA-256 chain.
5. **No Visual Role Badging or Profile Switcher**:
   - Role switching is handled via a primitive `<select>` dropdown with incomplete role definitions and no contextual explanation of permissions, organization, or data boundaries.

---

## 6. Target RBAC State Architecture (Step 2 & 3 Roadmap)

### 6.1 The 6 Target Roles
1. **Institution Maker** (`INSTITUTION_MAKER`):
   - Scope: Own institution only (`INST-001`, `INST-002`, or `INST-003`).
   - Permissions: Create draft FDR, edit draft, upload document, submit to Checker. Discrepancy lock visible on own FDRs.
2. **Institution Checker** (`INSTITUTION_CHECKER`):
   - Scope: Own institution only.
   - Permissions: Queue of Maker submissions, approve to RO, send back with remarks. Enforce `maker_id != checker_id`.
3. **Regional Officer** (`REGIONAL_OFFICER`):
   - Scope: Institutions in officer's designated region (e.g., `Northern Region` or `Western Region`).
   - Permissions: Review Checker-approved claims, view bank-confirmation status, SLA timers, approve/reject/request-clarification, regional proof-score decay watchlist.
4. **Scrutiny / Vigilance Officer** (`SCRUTINY_OFFICER`):
   - Scope: Cross-region national visibility.
   - Permissions: Duplicate-fingerprint detector across institutions, forensics risk signals, liabilities & grievances (`LIAB-001`), SHA-256 audit ledger viewer with cryptographic chain verification.
5. **Bank Verifier** (`BANK_VERIFIER`):
   - Scope: FDRs assigned to their specific bank (e.g. `State Bank of India`).
   - Permissions: Core Banking reconciliation, confirm deposit / flag mismatch, view verifier historical reliability score.
6. **AICTE HQ Admin** (`AICTE_ADMIN`):
   - Scope: National overview across all regions.
   - Permissions: Versioned rules table, and **DEMO CONTROLS** (clock advance/reset, demo reset, tamper demo).

### 6.2 Target State Machine
```
[DRAFT] --(Maker Submit)--> [SUBMITTED] 
        --(Checker Approve)--> [CHECKER_APPROVED] 
        --(RO Review)--> [APPROVED] / [REJECTED] / [CLARIFICATION_REQUESTED]
```
*(All transitions write an append-only event to the SHA-256 hash-chained audit ledger using `clock.now()`)*.
