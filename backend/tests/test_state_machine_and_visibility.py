import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import FDR, User
from app.seed import seed_database
from app.auth import create_access_token
from app.clock import clock
from app.audit import verify_chain

client = TestClient(app)


def get_token(username: str) -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        assert user is not None, f"User {username} must exist"
        return create_access_token(
            data={
                "sub": user.username,
                "role": user.role,
                "institution_id": user.institution_id,
                "region": user.region,
                "bank": user.bank,
                "verifier_id": user.verifier_id,
            }
        )
    finally:
        db.close()


def test_ro_approve_on_draft_returns_409():
    """RO cannot review claims that have not passed Checker (DRAFT -> 409 Conflict)."""
    maker_token = get_token("maker_apex")
    ro_token = get_token("ro_north")

    # 1. Maker creates a draft FDR
    create_res = client.post(
        "/api/fdrs",
        json={
            "receipt_no": "SBI-DRAFT-TEST-409",
            "bank": "State Bank of India",
            "branch": "Main Branch New Delhi",
            "ifsc": "SBIN0000691",
            "principal": 1200000.0,
            "issue_date": "2026-01-01",
            "maturity_date": "2031-01-01",
            "lien_clause_ok": True,
        },
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert create_res.status_code == 201
    fdr_id = create_res.json()["id"]

    # 2. Regional Officer attempts to review DRAFT claim -> HTTP 409 Conflict
    ro_res = client.post(
        f"/api/fdrs/{fdr_id}/ro-review",
        json={"action": "approve", "remarks": "Premature RO approval"},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_res.status_code == 409
    assert "RO review requires CHECKER_APPROVED state" in ro_res.json()["detail"]


def test_bank_verify_on_draft_returns_409():
    """Bank Verifier cannot attest claims that have not passed Checker (DRAFT -> 409 Conflict)."""
    maker_token = get_token("maker_apex")
    bank_token = get_token("bank_sbi")

    # 1. Maker creates draft FDR
    create_res = client.post(
        "/api/fdrs",
        json={
            "receipt_no": "SBI-DRAFT-BANK-409",
            "bank": "State Bank of India",
            "branch": "Main Branch New Delhi",
            "ifsc": "SBIN0000691",
            "principal": 1500000.0,
            "issue_date": "2026-02-01",
            "maturity_date": "2032-02-01",
            "lien_clause_ok": True,
        },
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert create_res.status_code == 201
    fdr_id = create_res.json()["id"]

    # 2. Bank Verifier attempts attestation on DRAFT claim -> HTTP 409 Conflict
    bank_res = client.post(
        f"/api/fdrs/{fdr_id}/bank-verify",
        json={"action": "confirm", "notes": "Premature bank attestation"},
        headers={"Authorization": f"Bearer {bank_token}"},
    )
    assert bank_res.status_code == 409
    assert "Bank attestation requires claims to have passed Checker review" in bank_res.json()["detail"]


def test_clarification_cycle_happy_path():
    """Full lifecycle: Clarification requested -> Maker edit -> Resubmit -> Checker approve -> RO approve."""
    maker_token = get_token("maker_apex")
    checker_token = get_token("checker_apex")
    ro_token = get_token("ro_north")

    # 1. Maker creates draft FDR
    create_res = client.post(
        "/api/fdrs",
        json={
            "receipt_no": "SBI-CLARIFY-TEST-001",
            "bank": "State Bank of India",
            "branch": "Main Branch New Delhi",
            "ifsc": "SBIN0000691",
            "principal": 1000000.0,
            "issue_date": "2026-03-01",
            "maturity_date": "2033-03-01",
            "lien_clause_ok": True,
        },
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert create_res.status_code == 201
    fdr_id = create_res.json()["id"]
    assert create_res.json()["workflow_status"] == "DRAFT"

    # 2. Maker submits to Checker
    sub_res = client.post(
        f"/api/fdrs/{fdr_id}/submit",
        json={"notes": "Initial deposit submission"},
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["workflow_status"] == "SUBMITTED"

    # 3. Checker approves
    chk_res = client.post(
        f"/api/fdrs/{fdr_id}/checker-review",
        json={"action": "approve", "remarks": "Documents match physical records"},
        headers={"Authorization": f"Bearer {checker_token}"},
    )
    assert chk_res.status_code == 200
    assert chk_res.json()["workflow_status"] == "CHECKER_APPROVED"

    # 4. RO requests clarification
    ro_clarify_res = client.post(
        f"/api/fdrs/{fdr_id}/ro-review",
        json={"action": "clarify", "remarks": "Please update principal amount to match exact sanction order"},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_clarify_res.status_code == 200
    assert ro_clarify_res.json()["workflow_status"] == "CLARIFICATION_REQUESTED"
    assert ro_clarify_res.json()["ro_remarks"] == "Please update principal amount to match exact sanction order"

    # 5. Maker modifies FDR while in CLARIFICATION_REQUESTED
    edit_res = client.put(
        f"/api/fdrs/{fdr_id}",
        json={"principal": 1250000.0},
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["principal"] == 1250000.0

    # 6. Maker resubmits to Checker with response note
    resub_res = client.post(
        f"/api/fdrs/{fdr_id}/submit",
        json={"notes": "Principal corrected per sanction order #AICTE-DEL-44"},
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert resub_res.status_code == 200
    assert resub_res.json()["workflow_status"] == "SUBMITTED"

    # 7. Checker approves again
    chk_res_2 = client.post(
        f"/api/fdrs/{fdr_id}/checker-review",
        json={"action": "approve", "remarks": "Re-verified after clarification adjustment"},
        headers={"Authorization": f"Bearer {checker_token}"},
    )
    assert chk_res_2.status_code == 200
    assert chk_res_2.json()["workflow_status"] == "CHECKER_APPROVED"

    # 8. RO approves
    ro_app_res = client.post(
        f"/api/fdrs/{fdr_id}/ro-review",
        json={"action": "approve", "remarks": "Clarification acceptable. Deposit approved."},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_app_res.status_code == 200
    assert ro_app_res.json()["workflow_status"] == "RO_APPROVED"
    assert ro_app_res.json()["status"] == "active"

    # 9. Verify cryptographic hash chain remained valid
    db = SessionLocal()
    try:
        chain_status = verify_chain(db)
        assert chain_status["valid"] is True
    finally:
        db.close()


def test_maker_cannot_self_approve():
    """Maker cannot approve their own submission even if possessing Checker role."""
    db = SessionLocal()
    try:
        dual_user = db.query(User).filter(User.username == "dual_test_user").first()
        if not dual_user:
            dual_user = User(
                id="USR-DUAL-TEST-001",
                username="dual_test_user",
                name="Dual Test User",
                email="dual@apex.edu",
                role="INSTITUTION_CHECKER",
                institution_id="INST-001",
            )
            db.add(dual_user)
            db.commit()

        fdr = FDR(
            id="FDR-SELF-APPROVE-TEST",
            institution_id="INST-001",
            receipt_no="SBI-SELF-001",
            bank="State Bank of India",
            branch="Main Branch New Delhi",
            ifsc="SBIN0000691",
            principal=700000.0,
            issue_date="2026-01-01",
            maturity_date="2031-01-01",
            lien_clause_ok=True,
            status="active",
            workflow_status="SUBMITTED",
            created_by="USR-DUAL-TEST-001",
            fingerprint="SELF-TEST-FP",
        )
        db.merge(fdr)
        db.commit()
    finally:
        db.close()

    token = create_access_token(
        data={
            "sub": "dual_test_user",
            "role": "INSTITUTION_CHECKER",
            "institution_id": "INST-001",
        }
    )

    res = client.post(
        "/api/fdrs/FDR-SELF-APPROVE-TEST/checker-review",
        json={"action": "approve", "remarks": "Attempting self approval"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "Maker-Checker Segregation Violation" in res.json()["detail"]


def test_ro_and_bank_cannot_see_draft_claims():
    """RO and Bank Verifier cannot see DRAFT claims in list, get by ID, or institution details."""
    maker_token = get_token("maker_apex")
    ro_token = get_token("ro_north")
    bank_token = get_token("bank_sbi")

    # Maker creates draft FDR
    create_res = client.post(
        "/api/fdrs",
        json={
            "receipt_no": "SBI-HIDDEN-DRAFT-001",
            "bank": "State Bank of India",
            "branch": "Main Branch New Delhi",
            "ifsc": "SBIN0000691",
            "principal": 990000.0,
            "issue_date": "2026-01-01",
            "maturity_date": "2031-01-01",
            "lien_clause_ok": True,
        },
        headers={"Authorization": f"Bearer {maker_token}"},
    )
    assert create_res.status_code == 201
    draft_id = create_res.json()["id"]

    # 1. RO list_fdrs excludes DRAFT
    ro_list = client.get("/api/fdrs", headers={"Authorization": f"Bearer {ro_token}"}).json()
    assert not any(f["id"] == draft_id for f in ro_list)

    # 2. RO get_fdr returns 403 Forbidden on DRAFT
    ro_get = client.get(f"/api/fdrs/{draft_id}", headers={"Authorization": f"Bearer {ro_token}"})
    assert ro_get.status_code == 403
    assert "Regional Officers cannot view claims in 'DRAFT' state" in ro_get.json()["detail"]

    # 3. RO institutions list excludes DRAFT
    ro_inst = client.get("/api/institutions/INST-001", headers={"Authorization": f"Bearer {ro_token}"}).json()
    assert not any(f["id"] == draft_id for f in ro_inst["fdrs"])

    # 4. Bank list_fdrs excludes DRAFT
    bank_list = client.get("/api/fdrs", headers={"Authorization": f"Bearer {bank_token}"}).json()
    assert not any(f["id"] == draft_id for f in bank_list)

    # 5. Bank get_fdr returns 403 Forbidden on DRAFT
    bank_get = client.get(f"/api/fdrs/{draft_id}", headers={"Authorization": f"Bearer {bank_token}"})
    assert bank_get.status_code == 403
    assert "Bank Verifiers cannot view claims in 'DRAFT' state" in bank_get.json()["detail"]

    # 6. Bank institutions list excludes DRAFT
    bank_inst = client.get("/api/institutions/INST-001", headers={"Authorization": f"Bearer {bank_token}"}).json()
    assert not any(f["id"] == draft_id for f in bank_inst["fdrs"])


def test_duplicate_count_hidden_from_bank_and_ro():
    """duplicate_count must strictly be 0 for all roles except SCRUTINY_OFFICER and AICTE_ADMIN."""
    maker_token = get_token("maker_apex")
    ro_token = get_token("ro_north")
    bank_token = get_token("bank_sbi")
    scrutiny_token = get_token("scrutiny_officer")
    admin_token = get_token("aicte_admin")

    # FDR-APEX-001 and FDR-BHARATI-001 share a fingerprint (duplicate_count >= 1)
    # Check Maker
    maker_res = client.get("/api/fdrs/FDR-APEX-001", headers={"Authorization": f"Bearer {maker_token}"})
    assert maker_res.status_code == 200
    assert maker_res.json()["duplicate_count"] == 0

    # Check RO
    ro_res = client.get("/api/fdrs/FDR-APEX-001", headers={"Authorization": f"Bearer {ro_token}"})
    assert ro_res.status_code == 200
    assert ro_res.json()["duplicate_count"] == 0

    # Check Bank Verifier
    bank_res = client.get("/api/fdrs/FDR-APEX-001", headers={"Authorization": f"Bearer {bank_token}"})
    assert bank_res.status_code == 200
    assert bank_res.json()["duplicate_count"] == 0

    # Check Scrutiny Officer (Confidential alert visible)
    scrutiny_res = client.get("/api/fdrs/FDR-APEX-001", headers={"Authorization": f"Bearer {scrutiny_token}"})
    assert scrutiny_res.status_code == 200
    assert scrutiny_res.json()["duplicate_count"] >= 1

    # Check AICTE Admin (HQ oversight visible)
    admin_res = client.get("/api/fdrs/FDR-APEX-001", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert admin_res.json()["duplicate_count"] >= 1


def test_institutions_and_fdrs_consistency_at_day_200():
    """At Day 200, FDR-APEX-003 has identical status ('closed_early') and proof_score (0.0) on /fdrs and /institutions."""
    admin_token = get_token("aicte_admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Advance clock to Day 200
    adv_res = client.post("/api/clock/advance", json={"days": 200}, headers=headers)
    assert adv_res.status_code == 200
    assert adv_res.json()["days_elapsed"] == 200

    try:
        # 2. Query /fdrs/FDR-APEX-003
        fdr_res = client.get("/api/fdrs/FDR-APEX-003", headers=headers)
        assert fdr_res.status_code == 200
        fdr_data = fdr_res.json()
        assert fdr_data["status"] == "closed_early"
        assert fdr_data["proof_score"] == 0.0
        assert fdr_data["decay_risk"] is True

        # 3. Query /institutions/INST-001
        inst_res = client.get("/api/institutions/INST-001", headers=headers)
        assert inst_res.status_code == 200
        inst_data = inst_res.json()

        apex_003_in_inst = next((f for f in inst_data["fdrs"] if f["id"] == "FDR-APEX-003"), None)
        assert apex_003_in_inst is not None

        # PARITY ASSERTIONS:
        assert apex_003_in_inst["status"] == fdr_data["status"] == "closed_early"
        assert apex_003_in_inst["proof_score"] == fdr_data["proof_score"] == 0.0
        assert apex_003_in_inst["decay_risk"] == fdr_data["decay_risk"] is True
    finally:
        # Reset clock
        client.post("/api/clock/reset", headers=headers)
