from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class EnrichmentProfile(BaseModel):
    company_name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    geography: Optional[str] = None
    tech_stack: list[str] = Field(default_factory=list)
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    provider_used: str
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    is_complete: bool = False


class BaseEnrichmentProvider(ABC):
    """Abstract base class for all Whipstitch enrichment waterfall providers."""

    name: str

    @abstractmethod
    async def enrich(self, email: str, company_name: str, domain: Optional[str] = None) -> Optional[EnrichmentProfile]:
        """Attempt to enrich company/lead data. Returns EnrichmentProfile if successful, None if failed/incomplete."""
        pass
