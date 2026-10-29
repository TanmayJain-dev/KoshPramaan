# KoshPramaan (कोष-प्रमाण) — 2-Minute Lightning Pitch & UI Demo Script

**Target Duration**: Exactly 120 Seconds (2:00 Minutes)  
**Audience**: SIH Technical Judges, AICTE Ministry Evaluators, Regulatory Audit Officers  
**Pacing**: 135–145 words per minute (~280 words total). Crisp, authoritative, zero conversational filler.  
**Pre-Demo State**: Services running locally at `http://localhost:5173`. Database at Day 0 baseline (`make seed`).

---

## Quick Reference Timeline (120-Second Flight Plan)

| Time | Persona & Role | UI Actions to Execute | Spoken Script (Say This Aloud) |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:30** | `maker_apex`<br>*(Aakash Verma)* | 1. Land on Apex Dashboard.<br>2. Point to **Discrepancy Lock** & **Trust Ladder**.<br>3. Click **"+ New FDR Claim"** & drop file (SHA-256). | *"Today, AICTE verifies crores in security deposits through static PDFs—unverified paper claims that can be photoshopped or prematurely encashed. KoshPramaan replaces paper trust with a Dual-Truth living proof: tracking every field on a Trust Ladder from Claimed to Bank-Confirmed with client-side SHA-256 hashing and automated lien-clause validation."* |
| **0:30 – 1:00** | `checker_apex` → `bank_sbi`<br>*(Dr. Sunita Rao → Rajiv Sharma)* | 1. Switch to `checker_apex` → Point to green **Segregation Passed** badge.<br>2. Switch to `bank_sbi` (CBS Desk).<br>3. Click **"Confirm Match (CBS)"** on `FDR-APEX-002`. | *"Maker-Checker segregation strictly blocks institutional self-approval at the API layer. Then, issuing banks attest deposits via direct CBS connector or single-use signed nodal links—no complex bank API needed. Blind confirmation and canary requests verify the verifier, scoring bank reliability."* |
| **1:00 – 1:30** | `scrutiny_officer`<br>*(Arjun Nair)* | 1. Switch to `scrutiny_officer`.<br>2. Highlight **Duplicate Risk Signal** card (`FDR-APEX-001` vs `FDR-BHARATI-001`).<br>3. Click **Liabilities Ledger** tab (`LIAB-001`). | *"At central vigilance, our cross-institution duplicate fingerprint flags when one FDR receipt is pledged across multiple states. Notice our statutory invariant: AI produces evidentiary risk signals, never automated legal verdicts. Our Protection Gap links deposits to real liabilities—like ₹4.5L in faculty salary arrears encashable under Section 10(p)."* |
| **1:30 – 2:00** | `aicte_admin`<br>*(Prof. Anil Sahasrabudhe)* | 1. Switch to `aicte_admin`.<br>2. Click **"+200 Days"** (Proof Score decays).<br>3. Click **"Simulate Malicious Tampering"** (Red chain break!).<br>4. Click **"Reset Database"**. | *"Proofs don't live forever: our mathematical proof score decays exponentially over time, demanding periodic heartbeats. And if an insider tampers with the database directly—watch—the SHA-256 audit chain breaks instantly. Proofs that decay, collusion caught cross-state, and cryptographic certainty. That is KoshPramaan."* |

---

## Detailed Step-by-Step Execution Guide

### Act 1: The Dual-Truth Ledger & Proof Intake [0:00 – 0:30]
* **User**: `Aakash Verma — Institution Maker (Apex Institute of Technology, North)`
* **Starting URL**: `http://localhost:5173`

1. **Screen View**: 
   - Point to the **Statutory Banner**: `ATTENTION: Bank Discrepancy Lock Active (FDR-APEX-002 flagged by State Bank of India)`.
   - Point to the **Trust Ladder badges** on the table: `Claimed → Document-Checked → Bank-Confirmed`.
2. **Click**: Click the blue **"+ New FDR Claim"** button (`new-fdr-claim-btn`).
3. **Drop Document**: Drop any sample PDF into the dropzone.
4. **Point to Screen**: Show the live **Client-Side SHA-256 Checksum** generated via WebCrypto API before upload, and point out the **Tripartite Lien Clause** checkbox (*"in favour of Member Secretary, AICTE"*).
5. **Click**: Click **"Save Draft Claim"** -> Click **"Submit to Checker"** (`SUBMITTED`).

---

### Act 2: Segregation of Duties & Bank Attestation [0:30 – 1:00]
* **Switch 1**: Click **"Switch Role"** -> Select **"Dr. Sunita Rao — Institution Checker"** (`checker_apex`).
1. **Screen View**: Open the pending submission.
2. **Point to Screen**: Highlight the green indicator:
   ```
   ✓ Segregation Check Passed: You are an independent Checker authorized to verify this submission.
   ```
   *(Mention aloud: A Maker attempting to self-approve triggers an instant HTTP 403 Forbidden).*
3. **Click**: Click **"Approve Submission"** (`approve-submission-btn`). Status transitions to `CHECKER_APPROVED`.

* **Switch 2**: Click **"Switch Role"** -> Select **"Rajiv Sharma — Bank Verifier (SBI)"** (`bank_sbi`).
1. **Screen View**: Look at the **SBI CBS Attestation Desk** showing `Bank Reliability Score: 98.4%`.
2. **Click**: Locate `FDR-APEX-002` and click **"Confirm Match (CBS)"** (`cbs-confirm-btn-2`).
3. **Point to Screen**: Status immediately locks to `CBS Confirmed`. Mention the Tiered Connector architecture: direct CBS connector or signed single-use Nodal Officer links with eSign for branches without APIs.

---

### Act 3: Collusion Radar & The Protection Gap [1:00 – 1:30]
* **Switch**: Click **"Switch Role"** -> Select **"Arjun Nair — Scrutiny Officer"** (`scrutiny_officer`).

1. **Screen View**: The **Possible Duplicate Detector** card is prominent on screen:
   - **Alert**: `POSSIBLE_DUPLICATE_RISK_SIGNAL`
   - **Collusion Evidence**: 
     - College 1: **Apex Institute of Technology** (Northern Region, Chandigarh) — `FDR-APEX-001`
     - College 2: **Bharati Polytechnic** (Western Region, Mumbai) — `FDR-BHARATI-001`
     - Pledged Receipt: `SBI-DEL-2024-8841` (Pledged in two different states!).
2. **Point to Banner**:
   ```
   Risk signal, needs officer review: Automated systems produce evidentiary risk signals for officer review, not automated verdicts.
   ```
3. **Click**: Click the **"Grievance & Liabilities Ledger"** tab (`liabilities-ledger-tab`).
4. **Point to Screen**: Show `LIAB-001` (₹4,50,000 unpaid faculty salary arrears). Explain the **Protection Gap**: security deposits are liquid shields encashable under AICTE Section 10(p) to protect student and faculty money if an institute shuts down.

---

### Act 4: Mathematical Decay & Tamper-Evident Chain Break [1:30 – 2:00]
* **Switch**: Click **"Switch Role"** -> Select **"Prof. Anil Sahasrabudhe — AICTE Administrator"** (`aicte_admin`).

1. **Click Time Machine**: In the Admin panel header, click the **"+200 Days"** button.
   - Point to the **Decay Watchlist**: Proof scores calculated via exponential half-life formula ($S(t) = S_0 \cdot 2^{-t/\lambda}$) decay from `92.0` down to `<50.0`, triggering the Heartbeat re-verification alert.
2. **Click Tamper Simulator**: Point to the top green audit badge (`Audit Chain Intact`), then click the red button:
   - **"Simulate Malicious Tampering"** (`simulate-tamper-btn`).
3. **The Climax Visual**:
   - The top banner flashes into **Loud Crimson**:
     ```
     TAMPER DETECTED!
     Audit Chain Compromised at Block #1!
     Expected Hash: c8f3... != Computed Block Hash: 9b2a...
     ```
   - Explain: *"Even if a rogue database administrator alters a single value in SQL directly, the SHA-256 block chain breaks instantly and locks all approvals."*
4. **Click Reset**: Click **"Reset Entire Demo Database"** (`reset-database-btn`). Chain instantly restores to green (`✓ Cryptographic Chain Verified`).

---

## 3 Pillars Mapped to Script Features

```
          KOSH-PRAMAAN 3-PHASE GOVERNANCE
  ┌─────────────────────────────────────────────────┐
  │ 1. PROVE (0:00 - 0:30)                          │
  │    • Dual-Truth Ledger (Claimed vs Attested)    │
  │    • Trust Ladder (Claimed → Bank-Confirmed)   │
  │    • Client-Side SHA-256 & Lien Clause Check    │
  ├─────────────────────────────────────────────────┤
  │ 2. WATCH (0:30 - 1:00)                          │
  │    • Maker != Checker Segregation of Duties     │
  │    • CBS Attestation & Nodal Bank Signed Links  │
  │    • Exponential Proof-Score Decay & Heartbeat  │
  ├─────────────────────────────────────────────────┤
  │ 3. ACT & BASE (1:00 - 2:00)                     │
  │    • Cross-State Duplicate Collusion Radar      │
  │    • Protection Gap & Section 10(p) Liabilities │
  │    • Live Tamper-Evident Hash Chain Break       │
  └─────────────────────────────────────────────────┘
```

---

## Pro-Tips for Presenting Under 2 Minutes
1. **Never wait on animations**: Keep mouse hovering over the "Switch Role" button before finishing your line so role transitions take under 1 second.
2. **Don't read numbers verbatim**: Say *"notice the ₹10 Lakh duplicate receipt"* rather than reading the full account number.
3. **Hit the punchline on 1:55**: Conclude cleanly at 1:55 to leave 5 seconds of silence before the judges speak.
