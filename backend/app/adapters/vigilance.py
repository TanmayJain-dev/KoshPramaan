from abc import abstractmethod
from typing import Any, Dict, List
from .base import BaseAdapter


class VigilanceAdapter(BaseAdapter):
    @property
    def adapter_name(self) -> str:
        return "AICTE Vigilance & Legal Cell Connector (Mocked)"

    @property
    def is_mock(self) -> bool:
        return True

    @abstractmethod
    def check_clearance(self, institution_id: str) -> Dict[str, Any]:
        pass


class MockVigilanceAdapter(VigilanceAdapter):
    def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "status": "operational",
            "mode": "mock",
            "active_investigations_total": 3,
        }

    def check_clearance(self, institution_id: str) -> Dict[str, Any]:
        # For hero institution, vigilance has an active alert due to arrears
        if institution_id == "INST-001":
            return {
                "institution_id": institution_id,
                "cleared": False,
                "hold_reason": "Pending scrutiny: Faculty arrears grievance GRV-2026-0042 under arbitration.",
                "adverse_findings": False,
                "hold_active": True,
            }
        return {
            "institution_id": institution_id,
            "cleared": True,
            "hold_reason": None,
            "adverse_findings": False,
            "hold_active": False,
        }


mock_vigilance = MockVigilanceAdapter()
