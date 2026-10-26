from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseAdapter(ABC):
    """Abstract base class for all system integrations."""

    @property
    @abstractmethod
    def adapter_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        return True

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        pass
