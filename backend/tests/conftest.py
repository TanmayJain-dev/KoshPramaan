import os
import tempfile
import pytest

# Enforce temporary SQLite database for all pytest runs to guarantee isolation from koshpramaan.db
_temp_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_temp_db_path = _temp_db_file.name
_temp_db_file.close()

os.environ["DATABASE_URL"] = f"sqlite:///{_temp_db_path}"

# Rebind app.database engine and sessionmaker to the isolated temporary DB
import app.database as db_mod
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_mod.DATABASE_URL = f"sqlite:///{_temp_db_path}"
db_mod.engine = create_engine(db_mod.DATABASE_URL, connect_args={"check_same_thread": False})
db_mod.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_mod.engine)

from app.seed import seed_database
from app.models import User
from app.auth import create_access_token


@pytest.fixture(scope="session", autouse=True)
def isolated_test_db_session():
    """Session fixture guaranteeing no tests touch koshpramaan.db and cleans up temp db."""
    assert "koshpramaan.db" not in db_mod.DATABASE_URL, "CRITICAL: Tests must not point to koshpramaan.db"
    
    # Initialize the temporary database schema and seed deterministic baseline
    db = db_mod.SessionLocal()
    seed_database(db)
    db.close()
    
    yield
    
    # Teardown: remove temporary DB file
    if os.path.exists(_temp_db_path):
        try:
            os.remove(_temp_db_path)
        except OSError:
            pass


@pytest.fixture
def db():
    """Provides a transactional session to the isolated temp DB."""
    session = db_mod.SessionLocal()
    try:
        yield session
    finally:
        session.close()
