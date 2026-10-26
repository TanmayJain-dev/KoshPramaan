from abc import abstractmethod
from typing import Any, Dict, List
from .base import BaseAdapter


class GrievanceAdapter(BaseAdapter):
    @property
    def adapter_name(self) -> str:
        return "AICTE Grievance Portal Connector (Mocked)"

    @property
    def is_mock(self) -> bool:
        return True

    @abstractmethod
    def get_open_grievances(self, institution_id: str) -> List[Dict[str, Any]]:
        pass


class MockGrievanceAdapter(GrievanceAdapter):
    def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "status": "operational",
            "mode": "mock",
            "sync_interval_mins": 60,
        }

    def get_open_grievances(self, institution_id: str) -> List[Dict[str, Any]]:
        if institution_id == "INST-001":
            return [
                {
                    "grievance_id": "GRV-2026-0042",
                    "category": "faculty_salary_arrears",
                    "complainant": "Faculty Welfare Association",
                    "amount": 400000.0,
                    "status": "pending_inquiry",
                    "summary": "Unpaid salary arrears for 6 months (5 assistant professors).",
                    "blocking_release": True,
                }
            ]
        return []


mock_grievance = MockGrievanceAdapter()
