# KoshPramaan (कोष-प्रमाण)
**AICTE Security Deposit &amp; FDR Portal**  
*Smart India Hackathon 2026 Problem Solution*

> **Core Philosophy**: A scanned FDR is a claim, not a proof. The app treats each deposit as a living **Proof Object**: claimed by the institution, confirmed by the bank, re-verified over time, with a proof score that decays unless re-proven.  
> **Lifecycle Loop**: `PROVE` &rarr; `WATCH` &rarr; `ACT`

---

## Honesty Rules & Compliance
- **Mocked Integrations**: All banking systems, AICTE feeds, Grievance/Vigilance databases, and eSign providers are safely mocked behind strict adapter contracts.
- **Clear Badging**: A permanent *"Demo data, mocked integrations"* badge is displayed in the footer.
- **Accurate Claims**: We never claim live SFMS, Account Aggregator, or e-BG integrations; integrations are explicitly stated as `"bank API connector (mocked)"`.
- **Signals, Not Verdicts**: Forensics and mismatch flags serve as risk signals for scrutiny officers, not automated rejections.
- **Zero Hardcoding**: All amounts, deposit schedules, half-life decay rates, penalties, and approval chain SLAs are stored in a versioned `rules` database table.

---

## Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TanStack Query, Recharts.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite (`koshpramaan.db`), PostgreSQL-ready via `DATABASE_URL`.
- **Clock**: Dedicated `ClockService` powering deterministic simulation (`clock.now()`, never system time).
- **Integrity**: Append-only SHA-256 hash-chained audit ledger with tamper detection.

---

## Quickstart (One Command)

### Option 1: PowerShell Script (Windows)
```powershell
.\dev.ps1
```

### Option 2: Make
```bash
make dev
```

### Option 3: Docker Compose
```bash
docker-compose up --build
```

### Option 4: Manual Startup
**Backend**:
```bash
cd backend
uv venv
uv pip install -e .
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Visit:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Seed Data Baseline (Day 0)

1. **3 Institutions across 2 Regions**:
   - `INST-001`: **Apex Institute of Technology** (*Hero institution*, Northern Region, Engineering, 420 seats)
   - `INST-002`: **Bharati Polytechnic** (Western Region, Diploma, 240 seats)
   - `INST-003`: **Zenith Business School** (Northern Region, Management, 180 seats)

2. **5 Scripted Living FDRs**:
   - `FDR-APEX-001`: Clean, ₹35,00,000, State Bank of India, AICTE lien valid, Bank Confirmed.
   - `FDR-APEX-002`: Claimed amount mismatch (Claimed ₹25,00,000, Core Banking ledger records ₹2,50,000 &mdash; **Discrepancy Lock**).
   - `FDR-APEX-003`: Early-closure trigger (₹15,00,000 at PNB; MockBank script automatically closes deposit prematurely at simulated Day 200).
   - `FDR-BHARATI-001`: Injected duplicate fingerprint matching `FDR-APEX-001` (flagged confidentially for officers).
   - `FDR-ZENITH-001`: Clean ₹20,00,000 deposit at Bank of Baroda.

3. **Liabilities & Grievances**:
   - `LIAB-001`: ₹4,00,000 faculty salary arrears grievance registered against Apex Institute.

4. **Verifiers**:
   - 3 bank verifiers with historical reliability scores (`0.94`, `0.74`, `0.58`).

---

## Key Endpoints (Phase 1)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/clock` | Returns current simulated time, elapsed days, and base ISO. |
| `POST` | `/clock/advance` | Advances simulated time by `{ days }` and logs audit event. |
| `POST` | `/clock/reset` | Resets simulated time to baseline Day 0 (`2026-04-01`). |
| `GET` | `/audit/verify` | Validates entire SHA-256 chain from genesis, returns broken index if tampered. |
| `GET` | `/audit/events` | Lists append-only immutable events log. |
| `POST` | `/audit/tamper-demo` | Mutates a record's payload to demo cryptographic tamper detection. |
| `GET` | `/rules` | Retrieves all dynamic versioned governance rules. |
| `GET` | `/institutions` | Role-filtered institution registry and FDR proof objects. |
| `GET` | `/fdrs/duplicates/summary` | Confidential cross-institution duplicate fingerprint detector (Officer only). |
| `POST` | `/demo/reset` | Deterministically resets database to initial Day 0 baseline. |

---

## Testing

Run unit and integration tests:
```bash
cd backend
.venv\Scripts\python.exe -m pytest tests -v
```
All 5 test suites cover:
1. Seed integrity & hero institution configuration
2. Clock service time machine advance and reset
3. SHA-256 hash chain verification and tamper detection
4. MockBank scripted behavior (clean, 10x mismatch, Day 200 closure)
5. Router endpoints and role-based access isolation
