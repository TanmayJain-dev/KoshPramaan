# KoshPramaan (कोष-प्रमाण)
**AICTE Security Deposit & Living FDR Verification Portal**  
*Smart India Hackathon 2026 Prototype*

> **Core Philosophy**: A scanned FDR is a claim, not a proof. KoshPramaan treats each deposit as a living **Proof Object**: claimed by the institution, confirmed by the bank, re-verified over time, with a proof score that decays unless re-proven.  
> **Lifecycle Loop**: `PROVE` &rarr; `WATCH` &rarr; `ACT`

---

## 1. Compliance, Grounding & Honesty Rules

- **Mocked Integrations**: All banking systems, Core Banking System (CBS) connectors, vigilance databases, and eSign providers are safely mocked behind strict adapter contracts.
- **Permanent Honesty Badge**: A permanent *"Demo data, mocked integrations"* footer is displayed on every page, including the login and authentication screens.
- **Signal Language, Not Automated Verdicts**: Automated forensics and duplicate detectors produce **evidentiary risk signals** for human officer review, never automated legal or regulatory verdicts.
- **Zero Hardcoding**: All amounts, deposit schedules, half-life decay rates, penalties, and approval chain SLAs are stored in a versioned `rules` database table.
- **Maker-Checker Segregation Safeguard**: An institution Maker cannot verify or approve their own draft claim, even if the user holds dual roles. Violations strictly return `HTTP 403 Forbidden`.

---

## 2. Ten Personas & Scoped Workspaces

Each role in KoshPramaan experiences a tailored workspace with distinct data isolation boundaries, permissions, and workflow capabilities. All 10 users seeded in the database are fully functional:

| Username | Persona Name | Role Code | Scoping Boundary | Workspace & Capabilities |
|---|---|---|---|---|
| `maker_apex` | **Aakash Verma** | `INSTITUTION_MAKER` | `INST-001` (Apex Institute) | Creates draft FDR claims, uploads scan, computes client-side SHA-256 hash, submits to Checker. Strictly isolated from other colleges. |
| `checker_apex` | **Dr. Sunita Rao** | `INSTITUTION_CHECKER` | `INST-001` (Apex Institute) | Reviews Maker submissions, verifies tripartite lien clause. Enforces strict `maker != checker` segregation (`HTTP 403 Forbidden` on self-approval). |
| `maker_bharati` | **Ramesh Pawar** | `INSTITUTION_MAKER` | `INST-002` (Bharati Polytechnic) | Maker workspace for Western region college. Isolated from Northern Region records. |
| `ro_north` | **Dr. Vikram Seth** | `REGIONAL_OFFICER` | Northern Region | Statutory regional oversight: sanctions claims, requests clarification, or rejects. Proof-Score Decay Watchlist. Isolated from Western Region. |
| `ro_west` | **Kavita Deshmukh** | `REGIONAL_OFFICER` | Western Region | Regional oversight for Western Region colleges (Bharati Polytechnic). Cannot access Northern Region claims. |
| `scrutiny_officer` | **Arjun Nair** | `SCRUTINY_OFFICER` | National Vigilance Desk | Cross-institution duplicate fingerprint detector (`FDR-APEX-001` vs `FDR-BHARATI-001`), Grievances & Liabilities Registry (`LIAB-001`), and SHA-256 audit ledger. |
| `bank_sbi` | **Rajiv Sharma** | `BANK_VERIFIER` | State Bank of India | CBS Attestation Desk (`VER-001`): confirms match or flags discrepancy (triggers Discrepancy Lock). Isolated from other banks. |
| `bank_pnb` | **Priya Patel** | `BANK_VERIFIER` | Punjab National Bank | CBS Attestation Desk (`VER-002`): manages PNB deposit reconciliations and attestation queue. |
| `bank_bob` | **Amit Verma** | `BANK_VERIFIER` | Bank of Baroda | CBS Attestation Desk (`VER-003`): manages Bank of Baroda deposits. |
| `aicte_admin` | **Prof. Anil Sahasrabudhe** | `AICTE_ADMIN` | National Headquarters | National command: Time Machine controls (`+7d`, `+30d`, `+90d`, reset), cryptographic tamper demonstration, and deterministic Day 0 database reset. |

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TanStack Query (React Query v5).
- **Backend**: FastAPI (Python 3.13), SQLAlchemy, SQLite (`koshpramaan.db`), PostgreSQL-ready.
- **Clock Machine**: Dedicated `ClockService` powering deterministic simulation (`clock.now()`, never system wall clock).
- **Integrity**: Append-only SHA-256 hash-chained audit ledger with real-time tamper detection.
- **Testing**: `pytest` (90 tests covering RBAC, data scoping, token security, and `maker != checker`), Playwright (automated browser e2e with 13 full-page screenshots).

---

## 4. Security & Environment Configuration

Authentication is powered strictly by valid cryptographic JWT tokens (`Authorization: Bearer <token>`). Debug headers such as `X-User-Role` have been eliminated; any request without a valid token, or with an expired/tampered token, returns `HTTP 401 Unauthorized`. If `JWT_SECRET` is unset in the environment, the application prints a loud startup warning confirming demo defaults.

The backend reads configuration from environment variables with safe defaults:

| Variable | Default Value | Description |
|---|---|---|
| `JWT_SECRET` | `koshpramaan-sih-2026-secret-key-salt` | Secret key used to sign and verify HMAC-SHA256 JWT tokens |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Token validity duration in hours |
| `DATABASE_URL` | `sqlite:///./koshpramaan.db` | Database connection URI (SQLite for demo, PostgreSQL for production) |

---

## 5. Quickstart

### Option 1: Make (Linux / macOS)
```bash
# 1. Install dependencies
make install

# 2. Seed Day 0 baseline database
make seed

# 3. Start full stack (FastAPI on :8000 + Vite on :5173)
make dev
```

### Option 2: PowerShell (Windows)
```powershell
.\dev.ps1
```

### Option 3: Docker Compose
```bash
docker compose up --build
```

### Option 4: Manual Startup
```bash
# Terminal 1: Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Visit:
- **Web Portal**: [http://localhost:5173](http://localhost:5173)
- **Interactive OpenAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 6. Endpoints & RBAC Matrix

All endpoints support both `/api/*` and root `/*` routing. All endpoints require authentication except `/auth/demo-users`, `/auth/login`, and `/health`.

| Method | Endpoint | Required Role(s) | Data Scoping Boundary |
|---|---|---|---|
| `GET` | `/auth/demo-users` | *Public* | Returns all 10 demo personas for quick-login |
| `POST` | `/auth/login` | *Public* | Returns JWT token for chosen username |
| `GET` | `/auth/me` | Authenticated | Returns current user profile, role, and scoping IDs |
| `GET` | `/health` | *Public* | Service liveness probe |
| `GET` | `/institutions` | Authenticated | Maker/Checker: own college; RO: regional colleges; HQ: all |
| `GET` | `/fdrs` | Authenticated | Maker/Checker: own college; RO: regional; Bank: own bank; HQ: all |
| `POST` | `/fdrs` | `INSTITUTION_MAKER`, `AICTE_ADMIN` | Scoped to Maker's college (`INST-001`) |
| `POST` | `/fdrs/{id}/submit-to-checker` | `INSTITUTION_MAKER`, `AICTE_ADMIN` | Advances claim from `DRAFT` to `UNDER_CHECKER_REVIEW` |
| `POST` | `/fdrs/{id}/checker-review` | `INSTITUTION_CHECKER`, `AICTE_ADMIN` | Enforces `maker != checker` segregation (`HTTP 403 Forbidden` on self-approval) |
| `POST` | `/fdrs/{id}/ro-review` | `REGIONAL_OFFICER`, `AICTE_ADMIN` | Sanctions or clarifies claim within RO's region |
| `POST` | `/fdrs/{id}/bank-verify` | `BANK_VERIFIER`, `AICTE_ADMIN` | Scoped strictly to verifier's assigned bank |
| `GET` | `/fdrs/duplicates/summary` | `SCRUTINY_OFFICER`, `AICTE_ADMIN` | Cross-institution duplicate fingerprint detector |
| `GET` | `/fdrs/watchlist/decay` | `REGIONAL_OFFICER`, `SCRUTINY_OFFICER`, `AICTE_ADMIN` | Proof-score decay watchlist |
| `GET` | `/clock` | Authenticated | Current simulated date and elapsed days |
| `POST` | `/clock/advance` | `AICTE_ADMIN` | Advances simulated time (+7d, +30d, +90d) |
| `POST` | `/clock/reset` | `AICTE_ADMIN` | Resets clock to Day 0 (2026-04-01) |
| `GET` | `/audit/verify` | `REGIONAL_OFFICER`, `SCRUTINY_OFFICER`, `AICTE_ADMIN` | SHA-256 hash chain verification |
| `GET` | `/audit/events` | `REGIONAL_OFFICER`, `SCRUTINY_OFFICER`, `AICTE_ADMIN` | Immutable append-only audit event stream |
| `POST` | `/audit/tamper-demo` | `AICTE_ADMIN` | Demonstrates SHA-256 tamper detection |
| `POST` | `/demo/reset` | `AICTE_ADMIN` | Deterministically re-seeds database to Day 0 |

---

## 7. Verification & Automated Test Suites

### Backend Pytest Suite (90/90 Passing)
```bash
make test
```
- `tests/test_phase1.py` (5 tests): Seed integrity, clock machine, SHA-256 chain, MockBank adapter.
- `tests/test_rbac_and_workflow.py` (7 tests): Workflow lifecycle transitions, Maker-Checker segregation enforcement (`HTTP 403 Forbidden`).
- `tests/test_rbac_matrix.py` (76 tests): Comprehensive 6 roles $\times$ all endpoints RBAC matrix, data scoping isolation (Maker, RO, Bank Verifier), and self-approval block (`HTTP 403 Forbidden`).
- `tests/test_auth_security.py` (2 tests): Rejection of header bypass (`X-User-Role` alone returns `HTTP 401 Unauthorized`), rejection of expired or tampered JWTs (`HTTP 401 Unauthorized`).

### Frontend Browser Verification (Playwright E2E)
```bash
python scripts/verify_frontend_e2e.py
```
- Fully strict assertion suite: zero `if element.is_visible()` skips.
- Visits all 6 primary persona types across 10 seeded users at desktop resolution (`1366x768`).
- Captures full-page screenshots in `screenshots/` (`page_login.png`, `role_*.png`, `demo_*.png`).
- Executes the full end-to-end multi-role demo sequence.
- Executes the Day 200 regulatory lifecycle scenario: early closure detection (`FDR-APEX-003`), proof-score decay, discrepancy locking (`FDR-APEX-002`), and institutional isolation.
- Verifies 0 console errors and 0 HTTP API failures across 3 consecutive runs from a clean reset.
