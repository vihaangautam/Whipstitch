from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class CRMSyncResult(BaseModel):
    crm_provider: str = "hubspot"
    crm_record_id: str
    sync_status: str = "synced"  # synced, staged_awaiting_approval, failed
    details: Dict[str, Any] = Field(default_factory=dict)


class BaseCRMProvider(ABC):
    """Abstract base class for target CRM integrations."""

    name: str

    @abstractmethod
    async def sync_lead(
        self,
        email: str,
        company_name: str,
        enrichment_data: Dict[str, Any],
        qualification_data: Dict[str, Any],
    ) -> CRMSyncResult:
        """Syncs lead, score, and structured outreach draft into target CRM."""
        pass
