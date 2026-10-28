import pytest
from fastapi import HTTPException
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.clock import clock
from app.audit import verify_chain
from app.models import FDR, Institution, User, FieldClaim
from app.auth import create_access_token
from app.routers.auth_router import login, get_demo_users
from app.routers.institutions_router import list_institutions, get_institution
from app.routers.fdrs_router import (
    list_fdrs,
    get_fdr,
    get_duplicate_summary,
    create_draft_fdr,
    submit_fdr_to_checker,
    checker_review_fdr,
    ro_review_fdr,
    bank_verify_fdr,
    get_decay_watchlist,
)
from app.routers.clock_router import advance_clock, reset_clock
from app.routers.audit_router import simulate_tampering, get_audit_verify
from app.routers.demo_router import reset_demo_state
from app.schemas import (
    LoginRequest,
    ClockAdvanceRequest,
    FDRCreateRequest,
    FDRSubmitRequest,
    FDRCheckerReviewRequest,
    FDRROReviewRequest,
    FDRBankVerifyRequest,
)


@pytest.fixture(autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()


def get_user_by_username(db, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    assert user is not None, f"User {username} must exist"
    return user


def test_auth_login_and_token(setup_db):
    db = setup_db
    # 1. List demo users
    demo_users = get_demo_users(db=db)
    assert len(demo_users) == 10
    roles = {u.role for u in demo_users}
    assert "INSTITUTION_MAKER" in roles
    assert "INSTITUTION_CHECKER" in roles
    assert "REGIONAL_OFFICER" in roles
    assert "SCRUTINY_OFFICER" in roles
    assert "BANK_VERIFIER" in roles
    assert "AICTE_ADMIN" in roles

    # 2. Login as Maker
    login_res = login(req=LoginRequest(username="maker_apex"), db=db)
    assert login_res.access_token is not None
    assert login_res.user.role == "INSTITUTION_MAKER"
    assert login_res.user.institution_id == "INST-001"

    # 3. Login as RO
    ro_login = login(req=LoginRequest(username="ro_north"), db=db)
    assert ro_login.user.role == "REGIONAL_OFFICER"
    assert ro_login.user.region == "Northern Region"


def test_maker_checker_segregation_and_workflow(setup_db):
    db = setup_db
    maker = get_user_by_username(db, "maker_apex")
    checker = get_user_by_username(db, "checker_apex")
    ro = get_user_by_username(db, "ro_north")

    # 1. Maker creates draft claim
    create_req = FDRCreateRequest(
        receipt_no="SBI-DEL-TEST-0099",
        bank="State Bank of India",
        branch="Main Branch New Delhi",
        ifsc="SBIN0000691",
        principal=500000.0,
        issue_date="2026-04-01",
        maturity_date="2034-04-01",
        lien_clause_ok=True,
    )
    new_fdr = create_draft_fdr(req=create_req, current_user=maker, db=db)
    assert new_fdr.workflow_status == "DRAFT"
    assert new_fdr.created_by == maker.id

    # 2. Maker submits to Checker
    submitted_fdr = submit_fdr_to_checker(
        id=new_fdr.id,
        req=FDRSubmitRequest(notes="Forwarded for semester renewal"),
        current_user=maker,
        db=db,
    )
    assert submitted_fdr.workflow_status == "SUBMITTED"

    # 3. Maker CANNOT approve their own submission (maker != checker enforcement)
    with pytest.raises(HTTPException) as exc:
        checker_review_fdr(
            id=new_fdr.id,
            req=FDRCheckerReviewRequest(action="approve", remarks="Self approving"),
            current_user=maker,  # Passing maker as reviewer
            db=db,
        )
    # Maker is not INSTITUTION_CHECKER role, so require_roles blocks with 403
    assert exc.value.status_code == 403

    # If maker somehow had checker role, test explicit creator check:
    maker_as_checker = User(
        id=maker.id,
        username="sneaky_user",
        role="INSTITUTION_CHECKER",
        institution_id=maker.institution_id,
        name="Sneaky",
        email="sneaky@test.edu",
    )
    with pytest.raises(HTTPException) as exc2:
        checker_review_fdr(
            id=new_fdr.id,
            req=FDRCheckerReviewRequest(action="approve", remarks="Self approving"),
            current_user=maker_as_checker,
            db=db,
        )
    assert exc2.value.status_code == 400
    assert "Segregation Violation" in exc2.value.detail

    # 4. Independent Checker approves
    approved_by_checker = checker_review_fdr(
        id=new_fdr.id,
        req=FDRCheckerReviewRequest(action="approve", remarks="Verified lien clause documents"),
        current_user=checker,
        db=db,
    )
    assert approved_by_checker.workflow_status == "CHECKER_APPROVED"
    assert approved_by_checker.checked_by == checker.id

    # 5. RO Northern Region reviews and approves
    ro_approved = ro_review_fdr(
        id=new_fdr.id,
        req=FDRROReviewRequest(action="approve", remarks="Final AICTE regional security deposit cleared"),
        current_user=ro,
        db=db,
    )
    assert ro_approved.workflow_status == "RO_APPROVED"
    assert ro_approved.status == "active"
    assert ro_approved.ro_by == ro.id

    # 6. Verify hash chain remained cryptographically intact through all workflow transitions
    chain_status = verify_chain(db)
    assert chain_status["valid"] is True


def test_institution_maker_isolation(setup_db):
    db = setup_db
    maker_apex = get_user_by_username(db, "maker_apex")

    # 1. Sees only own institution
    insts = list_institutions(current_user=maker_apex, db=db)
    assert len(insts) == 1
    assert insts[0].id == "INST-001"

    # 2. Accessing other institution raises 403
    with pytest.raises(HTTPException) as exc:
        get_institution(id="INST-002", current_user=maker_apex, db=db)
    assert exc.value.status_code == 403

    # 3. Duplicate counts are concealed (Honesty rule)
    fdrs = list_fdrs(current_user=maker_apex, db=db)
    assert all(f.duplicate_count == 0 for f in fdrs)

    # 4. Accessing other institution's FDR raises 403
    with pytest.raises(HTTPException) as exc_fdr:
        get_fdr(id="FDR-BHARATI-001", current_user=maker_apex, db=db)
    assert exc_fdr.value.status_code == 403


def test_regional_officer_scoping(setup_db):
    db = setup_db
    ro_north = get_user_by_username(db, "ro_north")

    # 1. RO North sees Northern institutions (Apex INST-001, Zenith INST-003)
    insts = list_institutions(current_user=ro_north, db=db)
    assert len(insts) == 2
    assert all(i.region == "Northern Region" for i in insts)

    # 2. Accessing Western institution raises 403
    with pytest.raises(HTTPException) as exc:
        get_institution(id="INST-002", current_user=ro_north, db=db)
    assert exc.value.status_code == 403

    # 3. Attempting to approve Western FDR raises 403
    with pytest.raises(HTTPException) as exc_ro:
        ro_review_fdr(
            id="FDR-BHARATI-001",
            req=FDRROReviewRequest(action="approve", remarks="Unauthorized cross-region review"),
            current_user=ro_north,
            db=db,
        )
    assert exc_ro.value.status_code == 403


def test_bank_verifier_scoping_and_attestation(setup_db):
    db = setup_db
    bank_sbi = get_user_by_username(db, "bank_sbi")

    # 1. Sees only SBI FDRs
    fdrs = list_fdrs(current_user=bank_sbi, db=db)
    assert len(fdrs) >= 2
    assert all(f.bank == "State Bank of India" for f in fdrs)

    # 2. Cannot view or attest PNB FDR
    with pytest.raises(HTTPException) as exc:
        get_fdr(id="FDR-APEX-002", current_user=bank_sbi, db=db)
    assert exc.value.status_code == 403

    with pytest.raises(HTTPException) as exc_verify:
        bank_verify_fdr(
            id="FDR-APEX-002",
            req=FDRBankVerifyRequest(action="confirm"),
            current_user=bank_sbi,
            db=db,
        )
    assert exc_verify.value.status_code == 403

    # 3. Successfully confirms SBI FDR
    confirmed_fdr = bank_verify_fdr(
        id="FDR-APEX-001",
        req=FDRBankVerifyRequest(action="confirm", notes="Core banking ledger confirmed lien match"),
        current_user=bank_sbi,
        db=db,
    )
    principal_claim = next(c for c in confirmed_fdr.field_claims if c.field == "principal")
    assert principal_claim.trust_level == "bank_confirmed"


def test_scrutiny_officer_privileges(setup_db):
    db = setup_db
    scrutiny = get_user_by_username(db, "scrutiny_officer")
    maker = get_user_by_username(db, "maker_apex")
    ro = get_user_by_username(db, "ro_north")

    # 1. Scrutiny officer views duplicate fingerprint detector
    dup_res = get_duplicate_summary(current_user=scrutiny, db=db)
    assert dup_res["total_duplicates_found"] >= 1
    assert dup_res["duplicates"][0]["severity"] == "CRITICAL_COLLUSION_RISK"
    assert dup_res["duplicates"][0]["distinct_institutions_count"] == 2

    # 2. Institution Maker is blocked with 403
    with pytest.raises(HTTPException) as exc_maker:
        get_duplicate_summary(current_user=maker, db=db)
    assert exc_maker.value.status_code == 403

    # 3. Regional Officer is blocked from cross-region collusion tool with 403
    with pytest.raises(HTTPException) as exc_ro:
        get_duplicate_summary(current_user=ro, db=db)
    assert exc_ro.value.status_code == 403


def test_aicte_admin_demo_controls(setup_db):
    db = setup_db
    admin = get_user_by_username(db, "aicte_admin")
    maker = get_user_by_username(db, "maker_apex")
    ro = get_user_by_username(db, "ro_north")

    # 1. Admin advances clock
    adv = advance_clock(req=ClockAdvanceRequest(days=30), current_user=admin, db=db)
    assert adv.days_elapsed == 30

    # 2. Non-admin is blocked from advancing clock
    with pytest.raises(HTTPException) as exc_adv:
        advance_clock(req=ClockAdvanceRequest(days=30), current_user=maker, db=db)
    assert exc_adv.value.status_code == 403

    # 3. Admin resets clock
    rst = reset_clock(current_user=admin, db=db)
    assert rst.days_elapsed == 0

    # 4. Admin triggers cryptographic tamper demo
    tamper_res = simulate_tampering(event_id=1, current_user=admin, db=db)
    assert tamper_res["status"] == "tampered"
    audit_verify = get_audit_verify(current_user=admin, db=db)
    assert audit_verify.valid is False
    assert audit_verify.broken_index == 1

    # 5. Non-admin is blocked from tamper demo
    with pytest.raises(HTTPException) as exc_tamper:
        simulate_tampering(event_id=1, current_user=ro, db=db)
    assert exc_tamper.value.status_code == 403

    # 6. Admin resets demo state
    demo_reset = reset_demo_state(current_user=admin, db=db)
    assert demo_reset["status"] == "success"
    # Chain is healed
    restored_verify = get_audit_verify(current_user=admin, db=db)
    assert restored_verify.valid is True
