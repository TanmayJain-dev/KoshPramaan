from abc import abstractmethod
from typing import Any, Dict, Optional
from .base import BaseAdapter


class BankAdapter(BaseAdapter):
    @property
    def adapter_name(self) -> str:
        return "Bank API Connector (Mocked)"

    @property
    def is_mock(self) -> bool:
        return True

    @abstractmethod
    def query_fdr(self, fdr_id: str, receipt_no: str, bank: str, branch: str, days_elapsed: int) -> Dict[str, Any]:
        """Queries the bank for current FDR status."""
        pass

    @abstractmethod
    def send_confirmation_request(self, officer_id: str, fdr_id: str, mode: str) -> Dict[str, Any]:
        """Dispatches an attestation request to the designated bank officer."""
        pass


class MockBankAdapter(BankAdapter):
    """Mock bank implementation with deterministic scripted behaviors per test case."""

    # Scripted rules for known seed FDRs
    SCRIPTS = {
        # FDR 1: Clean, full match
        "FDR-APEX-001": {
            "status": "active",
            "principal": 3500000.0,
            "maturity_date": "2034-04-01",
            "lien_marked_aicte": True,
            "auto_renews": True,
            "notes": "Verified deposit held under AICTE lien clause.",
        },
        # FDR 2: Claimed amount mismatch (Bank records 10x lower: 2,50,000 instead of 25,00,000)
        "FDR-APEX-002": {
            "status": "active",
            "principal": 250000.0,  # 10x lower than claimed 25,00,000
            "maturity_date": "2032-04-01",
            "lien_marked_aicte": True,
            "auto_renews": False,
            "notes": "Core Banking System reflects ledger amount of Rs 2,50,000 only.",
        },
        # FDR 3: Closes early at simulated day 200
        "FDR-APEX-003": {
            "early_closure_day": 200,
            "pre_day_principal": 1500000.0,
            "maturity_date": "2030-04-01",
            "lien_marked_aicte": True,
            "notes": "Unauthorized early liquidation triggered at simulated day 200.",
        },
        # Duplicate FDR: Shares receipt no with APEX-001
        "FDR-BHARATI-001": {
            "status": "active",
            "principal": 3500000.0,
            "maturity_date": "2034-04-01",
            "lien_marked_aicte": True,
            "auto_renews": True,
            "notes": "Shares identical receipt number and bank branch as APEX-001.",
        },
        # FDR 5: Clean Zenith FDR
        "FDR-ZENITH-001": {
            "status": "active",
            "principal": 2000000.0,
            "maturity_date": "2033-04-01",
            "lien_marked_aicte": True,
            "auto_renews": True,
            "notes": "Clean corporate FDR.",
        },
    }

    def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "status": "operational",
            "mode": "mock",
            "connected_mock_banks": ["State Bank of India", "Punjab National Bank", "Bank of Baroda", "Canara Bank"],
        }

    def query_fdr(self, fdr_id: str, receipt_no: str, bank: str, branch: str, days_elapsed: int) -> Dict[str, Any]:
        script = self.SCRIPTS.get(fdr_id)

        # Handle early closure on day 200
        if script and "early_closure_day" in script:
            closure_day = script["early_closure_day"]
            if days_elapsed >= closure_day:
                return {
                    "fdr_id": fdr_id,
                    "receipt_no": receipt_no,
                    "bank": bank,
                    "branch": branch,
                    "status": "closed_early",
                    "principal": 0.0,
                    "original_principal": script["pre_day_principal"],
                    "maturity_date": script["maturity_date"],
                    "lien_marked_aicte": False,
                    "closed_at_day": closure_day,
                    "closure_reason": "Premature encashment by depositor without AICTE NOC",
                    "bank_attestation_ts": "simulated",
                }
            else:
                return {
                    "fdr_id": fdr_id,
                    "receipt_no": receipt_no,
                    "bank": bank,
                    "branch": branch,
                    "status": "active",
                    "principal": script["pre_day_principal"],
                    "maturity_date": script["maturity_date"],
                    "lien_marked_aicte": script["lien_marked_aicte"],
                    "days_until_early_closure": closure_day - days_elapsed,
                    "bank_attestation_ts": "simulated",
                }

        if script:
            return {
                "fdr_id": fdr_id,
                "receipt_no": receipt_no,
                "bank": bank,
                "branch": branch,
                "status": script.get("status", "active"),
                "principal": script["principal"],
                "maturity_date": script["maturity_date"],
                "lien_marked_aicte": script["lien_marked_aicte"],
                "auto_renews": script.get("auto_renews", False),
                "notes": script.get("notes", ""),
                "bank_attestation_ts": "simulated",
            }

        # Default fallback for dynamic/new FDRs
        return {
            "fdr_id": fdr_id,
            "receipt_no": receipt_no,
            "bank": bank,
            "branch": branch,
            "status": "active",
            "principal": 3500000.0,
            "maturity_date": "2034-04-01",
            "lien_marked_aicte": True,
            "auto_renews": True,
            "notes": "Standard mock response.",
            "bank_attestation_ts": "simulated",
        }

    def send_confirmation_request(self, officer_id: str, fdr_id: str, mode: str) -> Dict[str, Any]:
        return {
            "fdr_id": fdr_id,
            "officer_id": officer_id,
            "mode": mode,
            "delivered": True,
            "channel": "mock_secure_portal",
        }


# Singleton instance
mock_bank = MockBankAdapter()
