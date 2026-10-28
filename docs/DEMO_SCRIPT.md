# KoshPramaan (कोष-प्रमाण) — 5-Minute SIH 2026 Judge Presentation Script

**Project**: AICTE Security Deposit & Living Fixed Deposit Receipt (FDR) Verification Portal  
**Problem Statement**: SIH 2026 — Automated, Tamper-Evident Security Deposit Verification & Multi-Institution Collusion Detection  
**Target Duration**: Exactly 5 Minutes  
**Audience**: SIH Technical Judges, AICTE Ministry Evaluators & Industry Experts  

---

## Pre-Demo Checklist (30 seconds before presentation)
1. Ensure services are running locally via `make dev` (Backend: `http://127.0.0.1:8000`, Frontend: `http://127.0.0.1:5173`).
2. If state was modified earlier, run `make seed` or click **Reset Entire Demo Database** in the Admin panel.
3. Open browser at `http://localhost:5173`. You will land on the **Maker Workspace** or **Demo Login Screen**.

### Seeded Persona Credentials (All 10 Users)

| Username | Persona Name | Role Code | Institution / Scope |
|---|---|---|---|
| `maker_apex` | **Aakash Verma** | `INSTITUTION_MAKER` | Apex Institute of Technology (`INST-001`, North) |
| `checker_apex` | **Dr. Sunita Rao** | `INSTITUTION_CHECKER` | Apex Institute of Technology (`INST-001`, North) |
| `maker_bharati` | **Ramesh Pawar** | `INSTITUTION_MAKER` | Bharati Polytechnic (`INST-002`, West) |
| `ro_north` | **Dr. Vikram Seth** | `REGIONAL_OFFICER` | Northern Regional Office, Chandigarh |
| `ro_west` | **Kavita Deshmukh** | `REGIONAL_OFFICER` | Western Regional Office, Mumbai |
| `scrutiny_officer` | **Arjun Nair** | `SCRUTINY_OFFICER` | AICTE Vigilance & Legal Scrutiny Cell |
| `bank_sbi` | **Rajiv Sharma** | `BANK_VERIFIER` | State Bank of India (`VER-001`) |
| `bank_pnb` | **Priya Patel** | `BANK_VERIFIER` | Punjab National Bank (`VER-002`) |
| `bank_bob` | **Amit Verma** | `BANK_VERIFIER` | Bank of Baroda (`VER-003`) |
| `aicte_admin` | **Prof. Anil Sahasrabudhe** | `AICTE_ADMIN` | AICTE Headquarters, New Delhi |

---

## Minute-by-Minute Presentation Timeline

### Minute 0:00 – 1:00 | The Grounding Truth & Problem Statement
* **Persona**: `Aakash Verma — Institution Maker (Apex Institute of Technology, North)`
* **URL**: `http://localhost:5173`

#### What to Say:
> *"Respected Judges, when an engineering college applies for AICTE approval, it pledges crores of rupees in Fixed Deposit Receipts as security deposits. Today, this process relies on static scanned PDFs. 
> 
> A scanned PDF is merely a claim, not a proof. Institutions can Photoshop receipts, premature-encash deposits without notifying AICTE, or worse—pledge the exact same FDR receipt number across multiple regional jurisdictions. 
> 
> We built **KoshPramaan (कोष-प्रमाण)**. It shifts security deposits from static PDFs into **Living Proof Objects** governed by a 3-phase verification loop: **PROVE**, **WATCH**, and **ACT**. Every single action is cryptographically linked in a tamper-evident SHA-256 chained audit ledger. Let me walk you through the end-to-end lifecycle."*

#### What to Show on Screen:
* Point out the **Header Badge**: `Aakash Verma (INSTITUTION_MAKER)` • `Apex Institute of Technology (Northern Region)`.
* Emphasize **Data Isolation**: Notice that Aakash sees *only* Apex Institute claims—no data from other colleges or other regions is leaked.

---

### Minute 1:00 – 2:00 | Maker Creates Draft Claim & Cryptographic Hash
* **Persona**: `Aakash Verma — Institution Maker`
* **Action**: Create draft FDR and forward to internal Checker.

#### What to Click:
1. Click the green **"+ New FDR Claim"** button in the top right.
2. The draft modal opens with pre-filled compliant defaults:
   * **Receipt Number**: `SBI-DEL-2026-9999`
   * **Bank**: `State Bank of India`
   * **Principal**: `₹5,00,000`
   * **Maturity Date**: `2034-04-01`
   * **Tripartite Lien Clause**: Checkbox marked (joint lien in favor of AICTE).
3. Select any sample file in the **Document Upload Dropzone**.
4. Watch the client-side SHA-256 calculation display:
   `SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855...`
5. Click **"Save Draft Claim"**.
6. On the table row for `SBI-DEL-2026-9999`, click **"Submit to Checker"**.

#### What to Say:
> *"As the College Maker, I create the draft claim. Notice the file upload dropzone computes a client-side SHA-256 cryptographic digest before the file even leaves the browser. 
> 
> Once submitted, the state changes to `SUBMITTED`. The Maker cannot publish directly to AICTE—statutory Maker-Checker segregation is strictly enforced by our FastAPI state machine."*

#### What the Screen Shows:
* Table row updates with badge: `Under Checker Review`.
* Toast notification: *"Claim submitted to Institution Checker for internal verification."*

---

### Minute 2:00 – 3:00 | Checker Verification & Segregation Safeguard (Maker != Checker)
* **Persona Switch**: Click **"Switch Role"** in the top nav -> Select **"Dr. Sunita Rao — Institution Checker"**.

#### What to Click:
1. In the header, click the **"Switch Role"** button.
2. Select card: **"Dr. Sunita Rao — Institution Checker (Apex Institute, North)"**.
3. You immediately enter the **Checker Authority Desk**.
4. Notice the **Pending Verification Inbox** shows the claim submitted by Aakash Verma (`SBI-DEL-2026-9999`).
5. Click **"Review & Verify"**.
6. The side-by-side verification modal opens showing:
   * Claimed principal vs Tripartite Lien status vs Cryptographic Document Digest.
   * Green indicator: `Segregation Check Passed: You are an independent Checker authorized to verify this submission.`
7. (Optional Judge Test): Explain that if Aakash Verma attempts to self-approve his own claim, the system triggers `Maker-Checker Segregation Safeguard` and disables the Approve button, returning `HTTP 403 Forbidden`.
8. Type remarks: *"Verified lien clause and bank certificate."*
9. Click **"Approve Submission"**.

#### What to Say:
> *"Now I switch to Dr. Sunita Rao, the College Checker. Notice the system automatically verifies Maker != Checker segregation. An institution authority can never approve a draft they created themselves. 
> 
> Upon her verification, the claim transitions to `CHECKER_APPROVED` and is forwarded to AICTE's Northern Regional Office."*

#### What the Screen Shows:
* Modal confirms approval.
* Toast notification: *"FDR claim approved and forwarded to Regional Officer (RO Northern Region)."*

---

### Minute 3:00 – 3:45 | Regional Officer (RO) Sanction & Bank Reconciliation
* **Persona Switch 1**: Click **"Switch Role"** -> Select **"Dr. Vikram Seth — Regional Officer (North)"**.

#### What to Click:
1. In the top nav, click **"Switch Role"** -> Select **"Dr. Vikram Seth — Regional Officer (Northern Region)"**.
2. Notice the **Jurisdiction Scope**: Dr. Seth sees *only* Northern Region colleges (Apex Institute). Bharati Polytechnic (Western Region) is completely filtered out at the SQL database layer.
3. In the **RO Review Queue**, look at the SLA countdown timer:
   * Badge: `36h SLA (Amber)` or `>48h Remaining (Green)`.
4. Click **"Sanction"** -> Click **"Confirm Decision"**.
5. Claim is now `RO_APPROVED`!
6. Click the **"Proof-Score Decay Watchlist"** tab:
   * Explain: *"A certificate verified today is not trusted forever. Our mathematical proof-score formula applies exponential half-life decay. When a score falls below 60.0, the RO is alerted to issue a re-verification notice."*

#### Persona Switch 2: Bank Verifier (CBS Reconciliation)
* Click **"Switch Role"** -> Select **"Rajiv Sharma — Bank Verifier (SBI)"**.
1. Screen shifts to **SBI CBS Reconciliation Desk**.
2. Shows bank reliability score: `98.4% (Tier-1 Scheduled Bank)`.
3. Locate `FDR-APEX-002`. Click **"Confirm Match (CBS)"**.
4. The principal claim upgrades immediately to `CBS Confirmed`.
5. Point out the **"Flag Mismatch"** option:
   * *"If the college encashed early or lied about the principal balance, the bank verifier clicks 'Flag Mismatch'. The system instantly locks the FDR into `discrepancy_locked` state and freezes institutional compliance."*

---

### Minute 3:45 – 4:30 | Central Scrutiny Officer: Possible Duplicate Detector & Grievances
* **Persona Switch**: Click **"Switch Role"** -> Select **"Arjun Nair — Scrutiny Officer"**.

#### What to Show on Screen:
1. In the top nav, click **"Switch Role"** -> Select **"Arjun Nair — Scrutiny Officer"**.
2. The screen displays the critical **Possible Duplicate Detector** banner:
   * **Severity**: `POSSIBLE_DUPLICATE_RISK_SIGNAL`
   * **Signal**: Multi-Institution Duplicate Fingerprint detected!
   * Shows side-by-side cards:
     * **College 1**: Apex Institute of Technology (Northern Region) — FDR `FDR-APEX-001`
     * **College 2**: Bharati Polytechnic (Western Region) — FDR `FDR-BHARATI-001`
     * **Pledged Receipt**: `SBI-DEL-2024-8841` (State Bank of India, Main Branch New Delhi)
3. Point out the **Statutory Regulatory Banner**:
   > *"Risk signal, needs officer review: Automated systems produce evidentiary risk signals for officer review, not automated verdicts."*
4. Click the **"Grievance & Liabilities Ledger"** tab:
   * Shows `LIAB-001`: ₹4,50,000 unpaid faculty salary arrears against Apex Institute.
   * Explain: *"Under AICTE Section 10(p), security deposits are dynamically encashable to satisfy faculty salary grievances or student fee refund liabilities."*

---

### Minute 4:30 – 5:00 | AICTE HQ Admin: Tamper-Evident Hash Chain Live Break
* **Persona Switch**: Click **"Switch Role"** -> Select **"AICTE HQ Administrator"**.

#### What to Show on Screen:
1. Click **"Switch Role"** -> Select **"AICTE HQ Administrator"**.
2. Point out:
   * **National Overview**: Aggregates all colleges, total security deposits (₹82.5 Lakhs), compliance rates.
   * **Versioned Rules Table**: Regulatory parameters (half-life, thresholds, penalties) are versioned in database tables rather than hardcoded in code.
3. Scroll to the **EXCLUSIVE DEMO CONTROLS PANEL**:
   * Note: *"These controls are strictly restricted to the AICTE Admin. They do not appear on any other user's screen."*
4. Click **"Simulate Malicious Tampering"**:
   * A simulated insider maliciously modifies the payload of Event #1 in the database directly.
5. In the top header or Scrutiny audit ledger, the chain indicator flips immediately from green to red:
   * **TAMPER DETECTED IN LEDGER!**
   * Message: `Chain broken at Event #1! Cryptographic SHA-256 hash does not match stored block hash.`
6. Click **"Reset Entire Demo Database"**:
   * The database resets instantly to the clean Day 0 baseline. Chain flips back to green: `CRYPTOGRAPHIC CHAIN VERIFIED`.

---

## 30-Second Closing Punchline for Judges
> *"Judges, KoshPramaan replaces paper trust with cryptographic certainty:
> 1. **Role Segregation**: Real JWT authentication isolates college staff, regional officers, and vigilance cells.
> 2. **Living Proofs**: Proof scores decay mathematically over time, demanding continuous bank attestation rather than one-time scans.
> 3. **Tamper Evidence**: Any unauthorized database alteration is caught instantly by SHA-256 block chaining.
> 4. **Duplicate Risk Detection**: Cross-institution duplicate fingerprinting prevents the exact same FDR from being pledged in multiple states.
> 
> Thank you, and we are ready for your questions!"*

---

## Quick Reference Table for Presenter

| Minute | Role / Persona | Key Click | Highlight to Judges |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | `maker_apex` | View Apex Dashboard | Data isolation; only own college data visible |
| **1:00 - 2:00** | `maker_apex` | "+ New FDR Claim" -> "Submit to Checker" | Client-side SHA-256 dropzone; state machine transition |
| **2:00 - 3:00** | `checker_apex` | "Review & Verify" -> "Approve" | Maker != Checker segregation rule enforcement |
| **3:00 - 3:45** | `ro_north` & `bank_sbi` | "Sanction" -> "Confirm Match (CBS)" | Regional jurisdiction filter; SLA countdowns; CBS attestation |
| **3:45 - 4:30** | `scrutiny_officer` | View Duplicate Alert & Liabilities | Cross-institution duplicate signal (`FDR-APEX-001` vs `FDR-BHARATI-001`) |
| **4:30 - 5:00** | `aicte_admin` | "Simulate Tampering" -> "Reset Demo" | Exclusive admin controls; SHA-256 hash chain break demo |
