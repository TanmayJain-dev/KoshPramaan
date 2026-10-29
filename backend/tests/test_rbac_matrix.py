import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.seed import seed_database
from app.models import User, FDR
from app.auth import create_access_token

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()


def get_token_for_user(username: str) -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        assert user is not None, f"Seeded user {username} not found"
        return create_access_token(
            data={
                "sub": user.username,
                "user_id": user.id,
                "role": user.role,
                "institution_id": user.institution_id,
                "region": user.region,
                "bank": user.bank,
            }
        )
    finally:
        db.close()


ROLES_TEST_USERS = {
    "INSTITUTION_MAKER": "maker_apex",
    "INSTITUTION_CHECKER": "checker_apex",
    "REGIONAL_OFFICER": "ro_north",
    "SCRUTINY_OFFICER": "scrutiny_officer",
    "BANK_VERIFIER": "bank_sbi",
    "AICTE_ADMIN": "aicte_admin",
}


# =========================================================================
# 1. PARAMETRIZED ENDPOINT ACCESS MATRIX (200/201 vs 403)
# =========================================================================

@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_clock_advance_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/clock/advance",
        json={"days": 15},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status, f"{role} advance clock expected {expected_status}, got {res.status_code}: {res.text}"


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_clock_reset_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/clock/reset",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_demo_reset_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/demo/reset",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_tamper_demo_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/audit/tamper-demo?event_id=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status
    if expected_status == 200:
        db = SessionLocal()
        seed_database(db)
        db.close()


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 200),
        ("SCRUTINY_OFFICER", 200),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_audit_verify_and_events_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res_verify = client.get(
        "/api/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_verify.status_code == expected_status

    res_events = client.get(
        "/api/audit/events?limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_events.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 200),
        ("SCRUTINY_OFFICER", 200),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_rules_registry_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.get(
        "/api/rules",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 200),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_duplicate_summary_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.get(
        "/api/fdrs/duplicates/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 200),
        ("SCRUTINY_OFFICER", 200),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 200),
    ],
)
def test_decay_watchlist_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.get(
        "/api/fdrs/watchlist/decay",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 201),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 403),
    ],
)
def test_create_draft_fdr_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    payload = {
        "receipt_no": f"TEST-{role}-001",
        "bank": "State Bank of India",
        "branch": "Main Branch New Delhi",
        "ifsc": "SBIN0000691",
        "principal": 1000000.0,
        "issue_date": "2026-04-01",
        "maturity_date": "2034-04-01",
        "lien_clause_ok": True,
    }
    res = client.post(
        "/api/fdrs",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 200),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 403),
    ],
)
def test_checker_review_rbac(role, expected_status):
    # Ensure FDR-APEX-004 is submitted
    db = SessionLocal()
    fdr = db.query(FDR).filter(FDR.id == "FDR-APEX-004").first()
    fdr.workflow_status = "SUBMITTED"
    fdr.created_by = "USR-MAKER-001"
    db.commit()
    db.close()

    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/fdrs/FDR-APEX-004/checker-review",
        json={"action": "approve", "remarks": "Review test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 200),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 403),
        ("AICTE_ADMIN", 403),
    ],
)
def test_ro_review_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/fdrs/FDR-APEX-002/ro-review",
        json={"action": "approve", "remarks": "Regional approval"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


@pytest.mark.parametrize(
    "role,expected_status",
    [
        ("INSTITUTION_MAKER", 403),
        ("INSTITUTION_CHECKER", 403),
        ("REGIONAL_OFFICER", 403),
        ("SCRUTINY_OFFICER", 403),
        ("BANK_VERIFIER", 200),
        ("AICTE_ADMIN", 403),
    ],
)
def test_bank_verify_rbac(role, expected_status):
    token = get_token_for_user(ROLES_TEST_USERS[role])
    res = client.post(
        "/api/fdrs/FDR-APEX-001/bank-verify",
        json={"action": "confirm", "notes": "CBS match confirmed"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == expected_status


# =========================================================================
# 2. DATA SCOPING AND ISOLATION TESTS
# =========================================================================

def test_maker_scoping_isolation():
    token = get_token_for_user("maker_apex")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Institutions list: only own institution
    res = client.get("/api/institutions", headers=headers)
    assert res.status_code == 200
    insts = res.json()
    assert len(insts) == 1
    assert insts[0]["id"] == "INST-001"

    # 2. Cannot read another institution by ID
    res_other = client.get("/api/institutions/INST-002", headers=headers)
    assert res_other.status_code == 403

    # 3. FDRs list: only own institution FDRs
    res_fdrs = client.get("/api/fdrs", headers=headers)
    assert res_fdrs.status_code == 200
    fdrs = res_fdrs.json()
    assert len(fdrs) >= 3
    assert all(f["institution_id"] == "INST-001" for f in fdrs)
    # Honesty invariant: duplicate_count concealed
    assert all(f["duplicate_count"] == 0 for f in fdrs)

    # 4. Cannot read out-of-scope FDR by ID
    res_other_fdr = client.get("/api/fdrs/FDR-BHARATI-001", headers=headers)
    assert res_other_fdr.status_code == 403


def test_regional_officer_scoping_isolation():
    token = get_token_for_user("ro_north")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Institutions list: only Northern Region institutions
    res = client.get("/api/institutions", headers=headers)
    assert res.status_code == 200
    insts = res.json()
    assert len(insts) == 2
    assert all(i["region"] == "Northern Region" for i in insts)
    assert not any(i["id"] == "INST-002" for i in insts)

    # 2. Accessing Western institution raises 403
    res_west = client.get("/api/institutions/INST-002", headers=headers)
    assert res_west.status_code == 403

    # 3. Accessing Western FDR by ID raises 403
    res_west_fdr = client.get("/api/fdrs/FDR-BHARATI-001", headers=headers)
    assert res_west_fdr.status_code == 403


def test_bank_verifier_scoping_isolation():
    token = get_token_for_user("bank_sbi")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. FDRs list: only State Bank of India FDRs
    res = client.get("/api/fdrs", headers=headers)
    assert res.status_code == 200
    fdrs = res.json()
    assert len(fdrs) >= 2
    assert all(f["bank"] == "State Bank of India" for f in fdrs)
    assert not any(f["bank"] == "Punjab National Bank" for f in fdrs)

    # 2. Cannot read PNB FDR by ID
    res_pnb = client.get("/api/fdrs/FDR-APEX-002", headers=headers)
    assert res_pnb.status_code == 403

    # 3. Cannot read Bank of Baroda FDR by ID
    res_bob = client.get("/api/fdrs/FDR-ZENITH-001", headers=headers)
    assert res_bob.status_code == 403

    # 4. Cannot view institution with no deposits at this bank
    res_inst = client.get("/api/institutions/INST-003", headers=headers)
    assert res_inst.status_code == 403


# =========================================================================
# 3. STRICT MAKER != CHECKER ENFORCEMENT
# =========================================================================

def test_maker_cannot_act_as_checker_even_with_both_privileges():
    db = SessionLocal()
    try:
        # Create user holding both or attempting self-approval
        dual_user = db.query(User).filter(User.username == "dual_role_user").first()
        if not dual_user:
            dual_user = User(
                id="USR-DUAL-001",
                username="dual_role_user",
                name="Dual Persona User",
                email="dual@apex.edu",
                role="INSTITUTION_CHECKER",
                institution_id="INST-001",
            )
            db.add(dual_user)
            db.commit()

        # Submit FDR created by USR-DUAL-001
        fdr = db.query(FDR).filter(FDR.id == "FDR-APEX-004").first()
        fdr.workflow_status = "SUBMITTED"
        fdr.created_by = "USR-DUAL-001"
        db.commit()
    finally:
        db.close()

    token = create_access_token(
        data={
            "sub": "dual_role_user",
            "role": "INSTITUTION_CHECKER",
            "institution_id": "INST-001",
        }
    )

    # Attempt to approve the FDR that was created by the same user ID
    res = client.post(
        "/api/fdrs/FDR-APEX-004/checker-review",
        json={"action": "approve", "remarks": "Self-approving my claim"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 403
    assert "Maker-Checker Segregation Violation" in res.text
