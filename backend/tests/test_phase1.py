import pytest
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.clock import clock
from app.audit import record_event, verify_chain
from app.adapters import mock_bank, mock_grievance, mock_vigilance, mock_esign
from app.models import FDR, Institution, Liability, Verifier, Event
from app.schemas import ClockAdvanceRequest
from app.routers.clock_router import get_clock, advance_clock, reset_clock
from app.routers.audit_router import get_audit_verify, list_events
from app.routers.rules_router import list_rules, get_rule
from app.routers.institutions_router import list_institutions, get_institution
from app.routers.fdrs_router import list_fdrs, get_fdr, get_duplicate_summary
from app.routers.demo_router import reset_demo_state, get_demo_status
from fastapi import HTTPException


@pytest.fixture(autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()


def test_seed_integrity(setup_db):
    db = setup_db
    # 3 institutions across 2 regions
    institutions = db.query(Institution).all()
    assert len(institutions) == 3
    regions = {inst.region for inst in institutions}
    assert len(regions) == 2
    assert "Northern Region" in regions
    assert "Western Region" in regions

    # Hero institution check
    hero = db.query(Institution).filter(Institution.id == "INST-001").first()
    assert hero is not None
    assert hero.name == "Apex Institute of Technology"
    assert len(hero.fdrs) == 4

    # FDR 1: Clean
    fdr1 = db.query(FDR).filter(FDR.id == "FDR-APEX-001").first()
    assert fdr1 is not None
    assert fdr1.principal == 3500000.0
    assert fdr1.status == "active"

    # FDR 2: Claimed amount mismatch
    fdr2 = db.query(FDR).filter(FDR.id == "FDR-APEX-002").first()
    assert fdr2 is not None
    assert fdr2.principal == 2500000.0
    assert fdr2.status == "discrepancy_locked"

    # FDR 3: Closes early at day 200
    fdr3 = db.query(FDR).filter(FDR.id == "FDR-APEX-003").first()
    assert fdr3 is not None
    assert fdr3.principal == 1500000.0

    # Duplicate fingerprint check: FDR-BHARATI-001 in INST-002 shares fdr1's fingerprint
    fdr4 = db.query(FDR).filter(FDR.id == "FDR-BHARATI-001").first()
    assert fdr4 is not None
    assert fdr4.institution_id == "INST-002"
    assert fdr4.fingerprint == fdr1.fingerprint
    assert fdr4.status == "duplicate_flagged"

    # Grievance check: Rs 4,00,000 faculty arrears on hero
    hero_liabilities = db.query(Liability).filter(Liability.institution_id == "INST-001").all()
    assert len(hero_liabilities) == 1
    assert hero_liabilities[0].amount == 400000.0
    assert hero_liabilities[0].kind == "arrears"

    # 3 Verifiers with reliability scores
    verifiers = db.query(Verifier).all()
    assert len(verifiers) == 3
    assert all(0.0 <= v.reliability_score <= 1.0 for v in verifiers)


def test_clock_service(setup_db):
    db = setup_db
    # Initial state
    state = clock.get_state(db)
    assert state["days_elapsed"] == 0
    assert state["current_time_iso"].startswith("2026-04-01")

    # Advance clock by 30 days
    adv_state = clock.advance(db, 30)
    assert adv_state["days_elapsed"] == 30
    assert "2026-05-01" in adv_state["current_time_iso"]

    # Advance clock by another 170 days (total 200)
    adv_state2 = clock.advance(db, 170)
    assert adv_state2["days_elapsed"] == 200

    # Reset clock
    reset_state = clock.reset(db)
    assert reset_state["days_elapsed"] == 0
    assert reset_state["current_time_iso"].startswith("2026-04-01")


def test_audit_hash_chain_and_tamper_detection(setup_db):
    db = setup_db
    # Initial chain is valid
    res = verify_chain(db)
    assert res["valid"] is True
    assert res["broken_index"] is None
    assert res["total_events"] >= 2

    # Append an event
    ev = record_event(
        db=db,
        actor="TEST_USER",
        role="SCRUTINY_OFFICER",
        action="TEST_ACTION",
        payload={"note": "Testing append-only chain"},
    )
    assert ev.prev_hash == res["latest_hash"]

    # Verify chain remains valid
    res_after = verify_chain(db)
    assert res_after["valid"] is True
    assert res_after["total_events"] == res["total_events"] + 1

    # Simulate tampering on the first event
    first_ev = db.query(Event).order_by(Event.id.asc()).first()
    first_ev.payload = '{"malicious": "injected_tamper"}'
    db.commit()

    # Chain must detect the tampering at that exact broken_index
    tampered_res = verify_chain(db)
    assert tampered_res["valid"] is False
    assert tampered_res["broken_index"] == first_ev.id


def test_mock_bank_behavior():
    # Clean FDR
    q1 = mock_bank.query_fdr("FDR-APEX-001", "SBI-DEL-2024-8891", "State Bank of India", "Main Branch New Delhi", days_elapsed=0)
    assert q1["status"] == "active"
    assert q1["principal"] == 3500000.0

    # Wrong amount FDR (Bank records 10x lower: 2,50,000)
    q2 = mock_bank.query_fdr("FDR-APEX-002", "PNB-DEL-2024-4412", "Punjab National Bank", "Connaught Place Delhi", days_elapsed=0)
    assert q2["principal"] == 250000.0

    # Early closure FDR at day 100: still active
    q3_early = mock_bank.query_fdr("FDR-APEX-003", "PNB-DEL-2024-7731", "Punjab National Bank", "Karol Bagh Delhi", days_elapsed=100)
    assert q3_early["status"] == "active"
    assert q3_early["principal"] == 1500000.0

    # Early closure FDR at day 200: CLOSED EARLY!
    q3_closed = mock_bank.query_fdr("FDR-APEX-003", "PNB-DEL-2024-7731", "Punjab National Bank", "Karol Bagh Delhi", days_elapsed=200)
    assert q3_closed["status"] == "closed_early"
    assert q3_closed["principal"] == 0.0


def test_api_routers_direct(setup_db):
    db = setup_db

    # 1. Clock Router
    c = get_clock(db=db)
    assert c.days_elapsed == 0

    c_adv = advance_clock(req=ClockAdvanceRequest(days=15), db=db)
    assert c_adv.days_elapsed == 15

    c_reset = reset_clock(db=db)
    assert c_reset.days_elapsed == 0

    # 2. Audit Router
    audit_res = get_audit_verify(db=db)
    assert audit_res.valid is True
    events = list_events(limit=10, db=db)
    assert len(events) >= 2

    # 3. Rules Router
    rules = list_rules(db=db)
    assert len(rules) >= 4
    rule_keys = [r.key for r in rules]
    assert "proof_score_parameters" in rule_keys
    assert "protection_gap_factors" in rule_keys

    rule_param = get_rule(key="proof_score_parameters", db=db)
    assert "half_life_days" in rule_param.value

    # 4. Institutions Router
    institutions = list_institutions(x_user_role="SCRUTINY_OFFICER", db=db)
    assert len(institutions) == 3

    # Institution role sees only own institution if requested
    inst_filtered = list_institutions(x_user_role="INSTITUTION", x_institution_id="INST-001", db=db)
    assert len(inst_filtered) == 1
    assert inst_filtered[0].id == "INST-001"
    # Institution role does NOT see cross-institution duplicate warnings
    assert all(f.duplicate_count == 0 for f in inst_filtered[0].fdrs)

    # 5. FDRs Router
    fdrs = list_fdrs(x_user_role="SCRUTINY_OFFICER", db=db)
    assert len(fdrs) == 6

    # Officer sees duplicate summary
    dup_summary = get_duplicate_summary(x_user_role="SCRUTINY_OFFICER", db=db)
    assert dup_summary["total_duplicates_found"] >= 1

    # Institution role forbidden from duplicate summary
    with pytest.raises(HTTPException) as exc_info:
        get_duplicate_summary(x_user_role="INSTITUTION", db=db)
    assert exc_info.value.status_code == 403

    # 6. Demo Status & Reset
    status = get_demo_status(db=db)
    assert status["system"] == "KoshPramaan (कोष-प्रमाण)"
    assert status["honesty_badge"] == "Demo data, mocked integrations"
    assert status["counts"]["institutions"] == 3

    reset_res = reset_demo_state(db=db)
    assert reset_res["status"] == "success"
