import hashlib
import json
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import (
    SystemState,
    Institution,
    FDR,
    FieldClaim,
    Confirmation,
    Verifier,
    Rule,
    Liability,
    Release,
    HeartbeatRun,
    Event,
    User,
)
from .clock import clock, BASE_SIMULATED_TIME
from .audit import record_event, GENESIS_HASH


def compute_fdr_fingerprint(receipt_no: str, bank: str, branch: str) -> str:
    """Computes deterministic duplicate fingerprint:
    SHA256(normalised fdr_no + bank + branch)
    """
    normalized = f"{receipt_no.strip().upper()}:{bank.strip().upper()}:{branch.strip().upper()}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def compute_doc_hash(raw_str: str) -> str:
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


DEFAULT_RULES = [
    {
        "key": "proof_score_parameters",
        "value": {
            "level_bases": {
                "claimed": 20.0,
                "document_checked": 40.0,
                "bank_confirmed": 100.0,
                "reverified": 100.0,
            },
            "half_life_days": 180,
            "penalties": {
                "open_mismatch": 40.0,
                "missed_canary": 30.0,
                "low_verifier_reliability": 25.0,
            },
            "threshold": 60.0,
        },
        "effective_year": 2026,
        "version": 1,
    },
    {
        "key": "protection_gap_factors",
        "value": {
            "refund_factor": 0.15,
            "months_factor": 3.0,
            "formula_description": "max(0, intake*annual_fee*refund_factor + faculty_count*avg_monthly_salary*months_factor + open_liabilities - sum(fresh_proven_principal))",
        },
        "effective_year": 2026,
        "version": 1,
    },
    {
        "key": "category_deposit_requirements",
        "value": {
            "Engineering": {"base_deposit": 3500000.0, "tenure_years": 8},
            "Management": {"base_deposit": 2000000.0, "tenure_years": 8},
            "Diploma": {"base_deposit": 1500000.0, "tenure_years": 5},
            "Pharmacy": {"base_deposit": 2500000.0, "tenure_years": 8},
        },
        "effective_year": 2026,
        "version": 1,
    },
    {
        "key": "approval_chain",
        "value": {
            "chain": ["SCRUTINY_OFFICER", "ASSISTANT_DIRECTOR", "REGIONAL_OFFICER"],
            "sla_days": {
                "SCRUTINY_OFFICER": 7,
                "ASSISTANT_DIRECTOR": 7,
                "REGIONAL_OFFICER": 15,
                "total_sla": 30,
            },
        },
        "effective_year": 2026,
        "version": 1,
    },
    {
        "key": "heartbeat_rules",
        "value": {
            "cycle_days": 180,
            "pre_maturity_alerts_days": [90, 60, 30],
            "canary_rate_pct": 10.0,
        },
        "effective_year": 2026,
        "version": 1,
    },
    {
        "key": "action_queue_weights",
        "value": {
            "early_closure": 50,
            "expiring_30d": 35,
            "duplicate_flagged": 30,
            "bank_reply_overdue": 25,
            "sla_breach": 25,
            "canary_missed": 20,
            "release_pending": 15,
        },
        "effective_year": 2026,
        "version": 1,
    },
]


def seed_database(db: Session = None) -> dict:
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Ensure schema exists
        Base.metadata.create_all(bind=engine)

        # Clear existing rows cleanly (avoids SQLite schema lock deadlocks)
        db.query(User).delete()
        db.query(Confirmation).delete()
        db.query(FieldClaim).delete()
        db.query(Release).delete()
        db.query(Liability).delete()
        db.query(FDR).delete()
        db.query(Institution).delete()
        db.query(Verifier).delete()
        db.query(Rule).delete()
        db.query(Event).delete()
        db.query(HeartbeatRun).delete()
        db.commit()

        # 1. Initialize Clock
        clock.reset(db)

        sim_ts = BASE_SIMULATED_TIME

        # 2. Seed Rules
        for r_data in DEFAULT_RULES:
            rule = Rule(
                key=r_data["key"],
                value_json=json.dumps(r_data["value"]),
                effective_year=r_data["effective_year"],
                version=r_data["version"],
            )
            db.add(rule)
        db.commit()

        # 3. Seed Institutions (3 institutions across 2 regions)
        institutions_data = [
            Institution(
                id="INST-001",
                name="Apex Institute of Technology",
                region="Northern Region",
                category="Engineering",
                intake=420,
                annual_fee=120000.0,
                faculty_count=45,
                avg_monthly_salary=65000.0,
                exempt=False,
                trust_id="TRUST-NORTH-01",
            ),
            Institution(
                id="INST-002",
                name="Bharati Polytechnic",
                region="Western Region",
                category="Diploma",
                intake=240,
                annual_fee=60000.0,
                faculty_count=20,
                avg_monthly_salary=45000.0,
                exempt=False,
                trust_id="TRUST-WEST-02",
            ),
            Institution(
                id="INST-003",
                name="Zenith Business School",
                region="Northern Region",
                category="Management",
                intake=180,
                annual_fee=180000.0,
                faculty_count=18,
                avg_monthly_salary=75000.0,
                exempt=False,
                trust_id="TRUST-NORTH-03",
            ),
        ]
        db.add_all(institutions_data)
        db.commit()

        # 4. Seed Verifiers (3 verifiers with prior reliability scores)
        verifiers_data = [
            Verifier(
                id="VER-001",
                name="Rajiv Sharma",
                bank="State Bank of India",
                branch="Main Branch New Delhi",
                email="rajiv.sharma@sbi.mock",
                reliability_score=0.94,
                catches=19,
                misses=1,
                avg_response_days=1.2,
            ),
            Verifier(
                id="VER-002",
                name="Priya Patel",
                bank="Punjab National Bank",
                branch="Connaught Place Delhi",
                email="priya.patel@pnb.mock",
                reliability_score=0.74,
                catches=14,
                misses=5,
                avg_response_days=3.4,
            ),
            Verifier(
                id="VER-003",
                name="Amit Verma",
                bank="Bank of Baroda",
                branch="Nehru Place Delhi",
                email="amit.verma@bob.mock",
                reliability_score=0.58,
                catches=7,
                misses=5,
                avg_response_days=6.1,
            ),
        ]
        db.add_all(verifiers_data)
        db.commit()

        # 4b. Seed Demo Personas across all 6 roles
        users_data = [
            User(
                id="USR-MAKER-001",
                username="maker_apex",
                name="Aakash Verma",
                email="aakash.verma@apex.edu",
                role="INSTITUTION_MAKER",
                institution_id="INST-001",
                region="Northern Region",
                designation="Accounts Officer",
                org_name="Apex Institute of Technology",
            ),
            User(
                id="USR-CHECKER-001",
                username="checker_apex",
                name="Dr. Sunita Rao",
                email="sunita.rao@apex.edu",
                role="INSTITUTION_CHECKER",
                institution_id="INST-001",
                region="Northern Region",
                designation="Dean of Finance & Registrar",
                org_name="Apex Institute of Technology",
            ),
            User(
                id="USR-MAKER-002",
                username="maker_bharati",
                name="Ramesh Pawar",
                email="ramesh.pawar@bharati.edu",
                role="INSTITUTION_MAKER",
                institution_id="INST-002",
                region="Western Region",
                designation="Admin Superintendent",
                org_name="Bharati Polytechnic",
            ),
            User(
                id="USR-RO-001",
                username="ro_north",
                name="Dr. Vikram Seth",
                email="vikram.seth@aicte-india.org",
                role="REGIONAL_OFFICER",
                region="Northern Region",
                designation="Regional Officer & Director",
                org_name="Northern Regional Office, Chandigarh",
            ),
            User(
                id="USR-RO-002",
                username="ro_west",
                name="Kavita Deshmukh",
                email="kavita.deshmukh@aicte-india.org",
                role="REGIONAL_OFFICER",
                region="Western Region",
                designation="Regional Officer",
                org_name="Western Regional Office, Mumbai",
            ),
            User(
                id="USR-SCRUTINY-001",
                username="scrutiny_officer",
                name="Arjun Nair",
                email="arjun.nair@aicte-india.org",
                role="SCRUTINY_OFFICER",
                designation="Chief Scrutiny & Vigilance Officer",
                org_name="AICTE Vigilance & Legal Scrutiny Cell",
            ),
            User(
                id="USR-BANK-001",
                username="bank_sbi",
                name="Rajiv Sharma",
                email="rajiv.sharma@sbi.mock",
                role="BANK_VERIFIER",
                bank="State Bank of India",
                verifier_id="VER-001",
                designation="Chief Manager (Lien Cell)",
                org_name="State Bank of India",
            ),
            User(
                id="USR-BANK-002",
                username="bank_pnb",
                name="Priya Patel",
                email="priya.patel@pnb.mock",
                role="BANK_VERIFIER",
                bank="Punjab National Bank",
                verifier_id="VER-002",
                designation="Senior Manager (Institutional Dep.)",
                org_name="Punjab National Bank",
            ),
            User(
                id="USR-BANK-003",
                username="bank_bob",
                name="Amit Verma",
                email="amit.verma@bob.mock",
                role="BANK_VERIFIER",
                bank="Bank of Baroda",
                verifier_id="VER-003",
                designation="Branch Manager",
                org_name="Bank of Baroda",
            ),
            User(
                id="USR-ADMIN-001",
                username="aicte_admin",
                name="Prof. Anil Sahasrabudhe",
                email="admin@aicte-india.org",
                role="AICTE_ADMIN",
                designation="Member Secretary & HQ Admin",
                org_name="AICTE Headquarters, New Delhi",
            ),
        ]
        db.add_all(users_data)
        db.commit()

        # 5. Seed FDRs
        # FDR 1: Clean, hero institution
        fp_1 = compute_fdr_fingerprint("SBI-DEL-2024-8891", "State Bank of India", "Main Branch New Delhi")
        fdr_1 = FDR(
            id="FDR-APEX-001",
            institution_id="INST-001",
            receipt_no="SBI-DEL-2024-8891",
            bank="State Bank of India",
            branch="Main Branch New Delhi",
            ifsc="SBIN0000691",
            principal=3500000.0,
            issue_date="2024-04-01",
            maturity_date="2034-04-01",
            lien_clause_ok=True,
            status="active",
            workflow_status="RO_APPROVED",
            created_by="USR-MAKER-001",
            checked_by="USR-CHECKER-001",
            ro_by="USR-RO-001",
            fingerprint=fp_1,
            doc_hash=compute_doc_hash("FDR-APEX-001-SCAN-CLEAN-MOCK"),
        )

        # FDR 2: Claimed amount mismatch (Claimed 25,00,000; bank records 2,50,000)
        fp_2 = compute_fdr_fingerprint("PNB-DEL-2024-4412", "Punjab National Bank", "Connaught Place Delhi")
        fdr_2 = FDR(
            id="FDR-APEX-002",
            institution_id="INST-001",
            receipt_no="PNB-DEL-2024-4412",
            bank="Punjab National Bank",
            branch="Connaught Place Delhi",
            ifsc="PUNB0012300",
            principal=2500000.0,
            issue_date="2024-05-15",
            maturity_date="2032-05-15",
            lien_clause_ok=True,
            status="discrepancy_locked",
            workflow_status="CHECKER_APPROVED",
            created_by="USR-MAKER-001",
            checked_by="USR-CHECKER-001",
            checker_remarks="Approved internally; forwarded for RO scrutiny.",
            fingerprint=fp_2,
            doc_hash=compute_doc_hash("FDR-APEX-002-SCAN-MISMATCH-MOCK"),
        )

        # FDR 3: MockBank closes early at simulated day 200
        fp_3 = compute_fdr_fingerprint("PNB-DEL-2024-7731", "Punjab National Bank", "Karol Bagh Delhi")
        fdr_3 = FDR(
            id="FDR-APEX-003",
            institution_id="INST-001",
            receipt_no="PNB-DEL-2024-7731",
            bank="Punjab National Bank",
            branch="Karol Bagh Delhi",
            ifsc="PUNB0014500",
            principal=1500000.0,
            issue_date="2024-06-01",
            maturity_date="2030-06-01",
            lien_clause_ok=True,
            status="active",
            workflow_status="RO_APPROVED",
            created_by="USR-MAKER-001",
            checked_by="USR-CHECKER-001",
            ro_by="USR-RO-001",
            fingerprint=fp_3,
            doc_hash=compute_doc_hash("FDR-APEX-003-SCAN-DAY200-MOCK"),
        )

        # FDR 4: Second institution (Bharati) sharing the first's fingerprint!
        fdr_4 = FDR(
            id="FDR-BHARATI-001",
            institution_id="INST-002",
            receipt_no="SBI-DEL-2024-8891",  # Same receipt no, bank & branch as FDR-APEX-001
            bank="State Bank of India",
            branch="Main Branch New Delhi",
            ifsc="SBIN0000691",
            principal=3500000.0,
            issue_date="2024-04-01",
            maturity_date="2034-04-01",
            lien_clause_ok=True,
            status="duplicate_flagged",
            workflow_status="RO_APPROVED",
            created_by="USR-MAKER-002",
            fingerprint=fp_1,  # SHARED FINGERPRINT!
            doc_hash=compute_doc_hash("FDR-BHARATI-001-SCAN-DUPLICATE-MOCK"),
        )

        # FDR 5: Zenith Business School
        fp_5 = compute_fdr_fingerprint("BOB-DEL-2025-1102", "Bank of Baroda", "Nehru Place Delhi")
        fdr_5 = FDR(
            id="FDR-ZENITH-001",
            institution_id="INST-003",
            receipt_no="BOB-DEL-2025-1102",
            bank="Bank of Baroda",
            branch="Nehru Place Delhi",
            ifsc="BARB0NEHRUP",
            principal=2000000.0,
            issue_date="2025-01-10",
            maturity_date="2033-01-10",
            lien_clause_ok=True,
            status="active",
            workflow_status="RO_APPROVED",
            fingerprint=fp_5,
            doc_hash=compute_doc_hash("FDR-ZENITH-001-SCAN-MOCK"),
        )

        # FDR 6: Draft Claim for Maker -> Checker Demo
        fp_draft = compute_fdr_fingerprint("SBI-DEL-2026-9901", "State Bank of India", "Main Branch New Delhi")
        fdr_apex_draft = FDR(
            id="FDR-APEX-004",
            institution_id="INST-001",
            receipt_no="SBI-DEL-2026-9901",
            bank="State Bank of India",
            branch="Main Branch New Delhi",
            ifsc="SBIN0000691",
            principal=1000000.0,
            issue_date="2026-04-01",
            maturity_date="2034-04-01",
            lien_clause_ok=True,
            status="active",
            workflow_status="DRAFT",
            created_by="USR-MAKER-001",
            fingerprint=fp_draft,
            doc_hash=compute_doc_hash("FDR-APEX-004-DRAFT-SCAN-MOCK"),
        )

        db.add_all([fdr_1, fdr_2, fdr_3, fdr_4, fdr_5, fdr_apex_draft])
        db.commit()

        # 6. Seed Field Claims
        # Clean FDR 1: fully bank confirmed
        claims_fdr1 = [
            FieldClaim(fdr_id="FDR-APEX-001", field="principal", claimed_value="3500000.0", bank_value="3500000.0", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-001", field="maturity_date", claimed_value="2034-04-01", bank_value="2034-04-01", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-001", field="lien_clause", claimed_value="true", bank_value="true", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
        ]
        # Mismatch FDR 2: Discrepancy!
        claims_fdr2 = [
            FieldClaim(fdr_id="FDR-APEX-002", field="principal", claimed_value="2500000.0", bank_value="250000.0", trust_level="claimed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-002", field="maturity_date", claimed_value="2032-05-15", bank_value="2032-05-15", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-002", field="lien_clause", claimed_value="true", bank_value="true", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
        ]
        # FDR 3: Bank confirmed at start
        claims_fdr3 = [
            FieldClaim(fdr_id="FDR-APEX-003", field="principal", claimed_value="1500000.0", bank_value="1500000.0", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-003", field="maturity_date", claimed_value="2030-06-01", bank_value="2030-06-01", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
            FieldClaim(fdr_id="FDR-APEX-003", field="lien_clause", claimed_value="true", bank_value="true", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
        ]
        # FDR 4: Claimed document checked
        claims_fdr4 = [
            FieldClaim(fdr_id="FDR-BHARATI-001", field="principal", claimed_value="3500000.0", bank_value=None, trust_level="document_checked", verified_at="2026-04-01T09:00:00+05:30", source="ocr_upload"),
            FieldClaim(fdr_id="FDR-BHARATI-001", field="maturity_date", claimed_value="2034-04-01", bank_value=None, trust_level="document_checked", verified_at="2026-04-01T09:00:00+05:30", source="ocr_upload"),
        ]
        # FDR 5: Bank confirmed
        claims_fdr5 = [
            FieldClaim(fdr_id="FDR-ZENITH-001", field="principal", claimed_value="2000000.0", bank_value="2000000.0", trust_level="bank_confirmed", verified_at="2026-04-01T09:00:00+05:30", source="bank_adapter"),
        ]
        # FDR 6: Draft claims
        claims_fdr_draft = [
            FieldClaim(fdr_id="FDR-APEX-004", field="principal", claimed_value="1000000.0", bank_value=None, trust_level="claimed", verified_at="2026-04-01T09:00:00+05:30", source="institution_claim"),
            FieldClaim(fdr_id="FDR-APEX-004", field="maturity_date", claimed_value="2034-04-01", bank_value=None, trust_level="claimed", verified_at="2026-04-01T09:00:00+05:30", source="institution_claim"),
            FieldClaim(fdr_id="FDR-APEX-004", field="lien_clause", claimed_value="true", bank_value=None, trust_level="claimed", verified_at="2026-04-01T09:00:00+05:30", source="institution_claim"),
        ]
        db.add_all(claims_fdr1 + claims_fdr2 + claims_fdr3 + claims_fdr4 + claims_fdr5 + claims_fdr_draft)
        db.commit()

        # 7. Seed Liabilities (Rs 4,00,000 faculty-arrears grievance on hero institution)
        liability = Liability(
            id="LIAB-001",
            institution_id="INST-001",
            kind="arrears",
            amount=400000.0,
            status="open",
        )
        db.add(liability)
        db.commit()

        # 8. Record Genesis and Initial Events in Hash Chain
        record_event(
            db=db,
            actor="SYSTEM_INIT",
            role="SYSTEM",
            action="GENESIS_PORTAL_INITIALIZATION",
            payload={"version": "1.0", "message": "KoshPramaan system genesis state initialized"},
            ts_sim=sim_ts,
        )
        record_event(
            db=db,
            actor="DEMO_SEEDER",
            role="SYSTEM",
            action="SEED_BASELINE_DATA",
            payload={
                "institutions_seeded": 3,
                "fdrs_seeded": 6,
                "verifiers_seeded": 3,
                "users_seeded": 10,
                "liabilities_seeded": 1,
                "duplicate_fingerprints_injected": 1,
            },
            ts_sim=sim_ts,
        )

        return {
            "status": "success",
            "message": "Demo data successfully seeded to Day 0 baseline.",
            "institutions_count": 3,
            "fdrs_count": 6,
            "verifiers_count": 3,
            "users_count": 10,
            "liabilities_count": 1,
            "clock_state": clock.get_state(db),
        }
    finally:
        if should_close:
            db.close()
