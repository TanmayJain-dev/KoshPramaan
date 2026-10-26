import hashlib
from abc import abstractmethod
from typing import Any, Dict
from .base import BaseAdapter


class ESignAdapter(BaseAdapter):
    @property
    def adapter_name(self) -> str:
        return "National eSign Gateway (Mocked)"

    @property
    def is_mock(self) -> bool:
        return True

    @abstractmethod
    def sign_payload(self, signatory_role: str, signatory_id: str, document_hash: str) -> Dict[str, Any]:
        pass


class MockESignAdapter(ESignAdapter):
    def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "status": "operational",
            "mode": "mock",
            "cert_provider": "C-DAC Mock eSign Sub-CA",
        }

    def sign_payload(self, signatory_role: str, signatory_id: str, document_hash: str) -> Dict[str, Any]:
        raw_token = f"{signatory_role}:{signatory_id}:{document_hash}"
        signature = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        return {
            "signatory_role": signatory_role,
            "signatory_id": signatory_id,
            "document_hash": document_hash,
            "signature": f"MOCK-ESIGN-{signature[:32]}",
            "timestamp": "simulated",
            "valid": True,
            "algorithm": "SHA256-RSA-MOCK",
        }


mock_esign = MockESignAdapter()
