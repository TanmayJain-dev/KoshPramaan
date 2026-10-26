from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from .database import Base


class SystemState(Base):
    __tablename__ = "system_state"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    region = Column(String(64), nullable=False)
    category = Column(String(64), nullable=False)
    intake = Column(Integer, default=0, nullable=False)
    annual_fee = Column(Float, default=0.0, nullable=False)
    faculty_count = Column(Integer, default=0, nullable=False)
    avg_monthly_salary = Column(Float, default=0.0, nullable=False)
    exempt = Column(Boolean, default=False, nullable=False)
    trust_id = Column(String(64), nullable=True)

    fdrs = relationship("FDR", back_populates="institution", cascade="all, delete-orphan")
    liabilities = relationship("Liability", back_populates="institution", cascade="all, delete-orphan")


class FDR(Base):
    __tablename__ = "fdrs"

    id = Column(String(64), primary_key=True)
    institution_id = Column(String(64), ForeignKey("institutions.id"), nullable=False)
    receipt_no = Column(String(128), nullable=False)
    parent_receipt_id = Column(String(64), nullable=True)
    bank = Column(String(128), nullable=False)
    branch = Column(String(128), nullable=False)
    ifsc = Column(String(32), nullable=False)
    principal = Column(Float, nullable=False)
    issue_date = Column(String(32), nullable=False)  # ISO date string e.g. 2024-04-01
    maturity_date = Column(String(32), nullable=False)  # ISO date string e.g. 2032-04-01
    lien_clause_ok = Column(Boolean, default=False, nullable=False)
    status = Column(String(64), default="active", nullable=False)  # active, closed_early, matured, discrepancy_locked, returned_for_correction
    fingerprint = Column(String(64), nullable=False, index=True)
    doc_hash = Column(String(64), nullable=True)

    institution = relationship("Institution", back_populates="fdrs")
    field_claims = relationship("FieldClaim", back_populates="fdr", cascade="all, delete-orphan")
    confirmations = relationship("Confirmation", back_populates="fdr", cascade="all, delete-orphan")
    releases = relationship("Release", back_populates="fdr", cascade="all, delete-orphan")


class FieldClaim(Base):
    __tablename__ = "field_claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fdr_id = Column(String(64), ForeignKey("fdrs.id"), nullable=False)
    field = Column(String(64), nullable=False)  # e.g., "principal", "maturity_date", "lien_status"
    claimed_value = Column(Text, nullable=False)
    bank_value = Column(Text, nullable=True)
    trust_level = Column(
        String(32),
        default="claimed",
        nullable=False,
    )  # claimed | document_checked | bank_confirmed | reverified
    verified_at = Column(String(32), nullable=True)
    source = Column(String(64), default="institution_claim", nullable=False)

    fdr = relationship("FDR", back_populates="field_claims")


class Confirmation(Base):
    __tablename__ = "confirmations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fdr_id = Column(String(64), ForeignKey("fdrs.id"), nullable=False)
    officer_id = Column(String(64), nullable=False)
    mode = Column(String(32), nullable=False)  # blind | positive | canary
    shown_value = Column(Text, nullable=True)
    answered_value = Column(Text, nullable=True)
    correct = Column(Boolean, nullable=True)
    canary_missed = Column(Boolean, default=False, nullable=False)
    token_jti = Column(String(128), unique=True, nullable=False, index=True)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(String(32), nullable=False)
    answered_at = Column(String(32), nullable=True)

    fdr = relationship("FDR", back_populates="confirmations")


class Verifier(Base):
    __tablename__ = "verifiers"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    bank = Column(String(128), nullable=False)
    branch = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    reliability_score = Column(Float, default=1.0, nullable=False)
    catches = Column(Integer, default=0, nullable=False)
    misses = Column(Integer, default=0, nullable=False)
    avg_response_days = Column(Float, default=1.0, nullable=False)


class Rule(Base):
    __tablename__ = "rules"

    key = Column(String(128), primary_key=True)
    value_json = Column(Text, nullable=False)
    effective_year = Column(Integer, default=2026, nullable=False)
    version = Column(Integer, default=1, nullable=False)


class Liability(Base):
    __tablename__ = "liabilities"

    id = Column(String(64), primary_key=True)
    institution_id = Column(String(64), ForeignKey("institutions.id"), nullable=False)
    kind = Column(String(32), nullable=False)  # grievance | arrears | refund
    amount = Column(Float, nullable=False)
    status = Column(String(32), default="open", nullable=False)  # open | resolved | disputed

    institution = relationship("Institution", back_populates="liabilities")


class HeartbeatRun(Base):
    __tablename__ = "heartbeat_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ts_sim = Column(String(32), nullable=False)
    seed = Column(String(128), nullable=False)
    seed_hash = Column(String(64), nullable=False)
    selected_fdr_ids = Column(Text, nullable=False)  # JSON list of FDR ids
    method = Column(String(64), default="pseudo_random_draw", nullable=False)


class Release(Base):
    __tablename__ = "releases"

    id = Column(String(64), primary_key=True)
    fdr_id = Column(String(64), ForeignKey("fdrs.id"), nullable=False)
    status = Column(String(32), default="pending", nullable=False)  # pending | rejected | approved
    blocked_reasons_json = Column(Text, nullable=True)  # JSON list of reasons
    maker_id = Column(String(64), nullable=True)
    checker_id = Column(String(64), nullable=True)
    ro_id = Column(String(64), nullable=True)
    noc_hash = Column(String(64), nullable=True)
    created_at = Column(String(32), nullable=False)

    fdr = relationship("FDR", back_populates="releases")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ts_sim = Column(String(32), nullable=False)
    actor = Column(String(128), nullable=False)
    role = Column(String(64), nullable=False)
    action = Column(String(128), nullable=False)
    payload = Column(Text, nullable=False)  # JSON string
    prev_hash = Column(String(64), nullable=False)
    hash = Column(String(64), nullable=False)
