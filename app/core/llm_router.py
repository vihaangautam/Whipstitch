"""Multi-LLM Provider Router with BYOK support, fallback chaining, and cost tracking."""
import json
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar
import httpx
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.core.vault import key_vault
from app.db.models import LLMUsageLog, Tenant, UserAPIKey
from app.db.session import AsyncSessionLocal
from app.models.medpicc_schemas import (
    ClosureLikelihood,
    ClosureLikelihoodDetail,
    EvidenceQuote,
    NextBestActionEmail,
    QualificationModel,
    SellerSummary,
    ValueSellingBox,
)

logger = get_logger(__name__)
T = TypeVar("T", bound=BaseModel)

# Current model ids (aliases that track the latest stable release).
GEMINI_MODEL = "gemini-flash-latest"
GROQ_MODEL = "openai/gpt-oss-20b"

# Per-1K token pricing table in USD
MODEL_PRICING = {
    "gemini-flash-latest": {"input": 0.0001, "output": 0.0004},
    "gemini-2.5-flash": {"input": 0.0001, "output": 0.0004},
    "openai/gpt-oss-20b": {"input": 0.0001, "output": 0.0004},
    "openai/gpt-oss-120b": {"input": 0.00015, "output": 0.0006},
    "gpt-4o": {"input": 0.0025, "output": 0.0100},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "claude-3-5-sonnet": {"input": 0.003, "output": 0.015},
}


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model, {"input": 0.0005, "output": 0.0015})
    cost = (input_tokens / 1000.0) * pricing["input"] + (output_tokens / 1000.0) * pricing["output"]
    return round(cost, 6)


_WRAPPER_KEYS = {"result", "output", "data", "response", "json", "value"}


def _coerce_to_model(model: Type[T], raw_text: str) -> T:
    """Parse LLM text into `model`, tolerating markdown fences and a single wrapper key
    like {"QualificationModel": {...}} or {"result": {...}}."""
    txt = (raw_text or "").strip()
    if txt.startswith("```"):
        inner = txt.split("```")
        txt = inner[1] if len(inner) > 1 else txt
        if txt.lstrip().lower().startswith("json"):
            txt = txt.lstrip()[4:]
        txt = txt.strip().strip("`").strip()
    data = json.loads(txt)
    if isinstance(data, dict) and len(data) == 1:
        key, val = next(iter(data.items()))
        if isinstance(val, dict) and key.lower() in (model.__name__.lower(), *_WRAPPER_KEYS):
            data = val
    return model.model_validate(data)


def _with_schema_hint(user_prompt: str, model: Type[T]) -> str:
    return (
        f"{user_prompt}\n\nReturn ONLY one JSON object — no markdown fences, no wrapper key — "
        f"that validates against this JSON Schema:\n{json.dumps(model.model_json_schema())}"
    )


def generate_mock_medpicc(deal_name: str, company_name: str) -> QualificationModel:
    """Deterministic fallback qualification model for offline/test environments."""
    boxes = [
        ValueSellingBox(
            box="Metrics",
            score=12,
            max_score=15,
            rating="Strong",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="VP Ops",
                    evidence_date="Recent Call",
                    medium="Call",
                    quote="We are currently losing 4 hours per analyst per day on manual reconciliation, costing roughly $180k annually.",
                )
            ],
            notes="Clear baseline of manual waste with quantified financial impact.",
            missing_evidence="Secondary metrics around turnaround SLA impact not yet fully scoped.",
            coaching_questions=["What is the downstream revenue consequence when reconciliation reports are delayed by 24h?"],
        ),
        ValueSellingBox(
            box="Economic Buyer",
            score=6,
            max_score=15,
            rating="Moderate",
            evidence_basis="inferred",
            hard_cap_applied=True,
            evidence_quotes=[],
            notes="RULE 6.2 Hard-Cap Applied: CFO named as budget holder but no direct access or confirmation call scheduled yet.",
            missing_evidence="Direct EB sponsor meeting and confirmation of discretionary funds.",
            coaching_questions=["Who has final signing authority on technology investments over $50k?", "Can our champion broker a 15-min alignment call with the CFO?"],
        ),
        ValueSellingBox(
            box="Decision Criteria",
            score=8,
            max_score=10,
            rating="Strong",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="Lead Architect",
                    evidence_date="Recent Call",
                    medium="Meeting",
                    quote="The solution must support SOC2 compliance, sub-200ms latency, and direct HubSpot integration.",
                )
            ],
            notes="Technical criteria explicitly detailed.",
            missing_evidence="Commercial criteria and vendor evaluation weighting.",
            coaching_questions=["How will internal stakeholders balance price versus compliance speed?"],
        ),
        ValueSellingBox(
            box="Decision Process",
            score=7,
            max_score=10,
            rating="Moderate",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="Director of RevOps",
                    evidence_date="Email",
                    medium="Email",
                    quote="Next step is a security review with infosec, then executive signoff before the end of Q3.",
                )
            ],
            notes="Next stages known, full date-mapped signature path needs validation.",
            missing_evidence="Exact board approval schedule.",
            coaching_questions=["What is the exact date infosec needs to complete their audit for Q3 closure?"],
        ),
        ValueSellingBox(
            box="Paper Process",
            score=5,
            max_score=10,
            rating="Moderate",
            evidence_basis="inferred",
            evidence_quotes=[],
            notes="Standard MSA/DPA route expected; procurement contact not yet identified.",
            missing_evidence="Named procurement officer and vendor onboarding checklist.",
            coaching_questions=["Has your legal team already approved standard SaaS terms, or will redlining be required?"],
        ),
        ValueSellingBox(
            box="Implicated Pain",
            score=13,
            max_score=15,
            rating="Strong",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="Head of Growth",
                    evidence_date="Recent Call",
                    medium="Call",
                    quote="Our leads are sitting unrouted for 48 hours. Sales reps are burning good inbound pipeline.",
                )
            ],
            notes="Executive pain directly tied to lead leakage and team revenue targets.",
            missing_evidence=None,
            coaching_questions=["What is the executive consequence if the Q3 pipeline target is missed?"],
        ),
        ValueSellingBox(
            box="Champion",
            score=11,
            max_score=15,
            rating="Strong",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="RevOps Manager",
                    evidence_date="Email",
                    medium="Email",
                    quote="I shared your deck with our VP. Let's make sure this gets approved this month.",
                )
            ],
            notes="Champion actively selling internally and opening stakeholder doors.",
            missing_evidence="Confirmation that champion can defend deal during closed-door budget reviews.",
            coaching_questions=["How does successfully rolling this out impact our champion's annual performance review?"],
        ),
        ValueSellingBox(
            box="Competition",
            score=7,
            max_score=10,
            rating="Moderate",
            evidence_basis="direct",
            evidence_quotes=[
                EvidenceQuote(
                    person_name="Lead Architect",
                    evidence_date="Recent Call",
                    medium="Call",
                    quote="We are considering building an in-house Python script or sticking with our manual spreadsheet process.",
                )
            ],
            notes="Status quo and internal build are the primary competitors.",
            missing_evidence="Formal evaluation of other commercial SaaS vendors.",
            coaching_questions=["What is the opportunity cost of pulling 2 engineers off product development to build this in-house?"],
        ),
    ]

    total_score = sum(b.score for b in boxes)

    return QualificationModel(
        overall_qualification_score_0_100=total_score,
        deal_category="Rescue",
        deal_health="Moderate",
        recommended_stage_action="Run proposal-readiness call; schedule CFO sponsor alignment before advancing.",
        next_best_action="Schedule 15-minute executive alignment with the CFO to unlock budget approval.",
        next_best_action_email=NextBestActionEmail(
            subject=f"Next Steps & ROI Alignment for {company_name}",
            body_content=f"Hi Team,\n\nFollowing our review of {deal_name}, we've mapped the $180k manual reconciliation waste. To ensure seamless Q3 signoff, could we schedule a brief 15-minute sync with the CFO to confirm the financial justification?\n\nBest regards,\nAccount Executive",
        ),
        top_2_missing_boxes_blocking_closure=["Economic Buyer", "Paper Process"],
        closure_likelihood=ClosureLikelihood(
            if_addressed=ClosureLikelihoodDetail(
                likelihood_range="70-85%",
                rationale="Pain and metrics are validated. Unlocking CFO access and locking procurement timeline will secure Q3 closure.",
            ),
            if_ignored=ClosureLikelihoodDetail(
                likelihood_range="15-25%",
                rationale="Without direct EB engagement, the deal risks stalling in procurement or falling prey to status quo inertia.",
            ),
        ),
        seller_summary=SellerSummary(
            headline=f"Promising deal with strong pain ({company_name}), but requires direct Economic Buyer validation.",
            what_we_know=[
                "Manual waste quantified at $180k/year across analyst team.",
                "Technical architecture and security criteria clearly specified.",
                "RevOps manager is an active, vocal champion.",
            ],
            deal_risks=[
                "CFO / Economic Buyer has not yet personally confirmed budget allocation.",
                "Internal build or status quo inertia could delay contracting.",
            ],
            next_best_actions=[
                "Ask champion for intro to CFO.",
                "Deliver ROI one-pager outlining internal build cost comparison.",
            ],
        ),
        value_selling_boxes=boxes,
        evidence_coverage=6,
    )


class MultiLLMRouter:
    """Manages multi-provider LLM execution with BYOK keys and graceful fallbacks."""

    async def _resolve_api_key(self, tenant_id: str, provider: str) -> Tuple[Optional[str], bool]:
        """Resolves API key: checks BYOK first, then platform defaults. Returns (key, is_byok)."""
        byok_entry = None
        try:
            async with AsyncSessionLocal() as session:
                t_uuid = None
                try:
                    t_uuid = uuid.UUID(tenant_id)
                except ValueError:
                    t_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
                    t_obj = t_res.scalar_one_or_none()
                    t_uuid = t_obj.id if t_obj else None

                if t_uuid:
                    res = await session.execute(
                        select(UserAPIKey).where(
                            UserAPIKey.tenant_id == t_uuid,
                            UserAPIKey.provider == provider,
                            UserAPIKey.is_active == True,
                        )
                    )
                    byok_entry = res.scalar_one_or_none()
                if byok_entry and byok_entry.encrypted_key:
                    try:
                        decrypted = key_vault.decrypt_key(byok_entry.encrypted_key)
                        return decrypted, True
                    except Exception as e:
                        logger.warning("byok_decryption_failed", provider=provider, error=str(e))
        except Exception as db_err:
            logger.debug("byok_db_lookup_skipped_or_failed", error=str(db_err))

        # Platform default keys
        if provider == "gemini" and settings.GEMINI_API_KEY and "mock" not in settings.GEMINI_API_KEY.lower():
            return settings.GEMINI_API_KEY, False
        if provider == "groq" and settings.GROQ_API_KEY and "mock" not in settings.GROQ_API_KEY.lower():
            return settings.GROQ_API_KEY, False
        if provider == "openai" and settings.OPENAI_API_KEY and "mock" not in settings.OPENAI_API_KEY.lower():
            return settings.OPENAI_API_KEY, False

        return None, False


    async def call_structured_llm(
        self,
        tenant_id: str,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        feature: str = "medpicc",
        preferred_model: Optional[str] = None,
    ) -> Tuple[T, str]:
        """
        Executes a structured output LLM call following the fallback chain.
        Returns: (parsed_pydantic_object, model_used)
        """
        start_time = time.time()
        user_prompt = _with_schema_hint(user_prompt, response_model)

        # Step 1: Attempt Gemini 2.0 Flash / 1.5 Flash (BYOK or Platform)
        gemini_key, is_byok_gemini = await self._resolve_api_key(tenant_id, "gemini")
        if gemini_key:
            try:
                model_name = preferred_model if preferred_model and "gemini" in preferred_model else GEMINI_MODEL
                async with httpx.AsyncClient(timeout=30.0) as client:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                    payload = {
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
                        ],
                        "generationConfig": {"response_mime_type": "application/json"},
                    }
                    resp = await client.post(url, json=payload)
                    if resp.status_code != 200:
                        logger.warning("gemini_non_200", status=resp.status_code, body=resp.text[:300])
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = _coerce_to_model(response_model, raw_text)
                        latency = round(time.time() - start_time, 3)
                        await self._log_usage(
                            tenant_id=tenant_id,
                            feature=feature,
                            provider="gemini",
                            model=model_name,
                            input_tokens=len(user_prompt) // 4,
                            output_tokens=len(raw_text) // 4,
                            latency=latency,
                            is_byok=is_byok_gemini,
                            success=True,
                        )
                        return parsed, model_name
            except Exception as e:
                logger.warning("gemini_call_failed_falling_back", error=str(e))

        # Step 2: Attempt Groq Llama 3.3 70B (BYOK or Platform)
        groq_key, is_byok_groq = await self._resolve_api_key(tenant_id, "groq")
        if groq_key:
            try:
                model_name = GROQ_MODEL
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {groq_key}"},
                        json={
                            "model": model_name,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "response_format": {"type": "json_object"},
                        },
                    )
                    if resp.status_code != 200:
                        logger.warning("groq_non_200", status=resp.status_code, body=resp.text[:300])
                    if resp.status_code == 200:
                        raw_text = resp.json()["choices"][0]["message"]["content"]
                        parsed = _coerce_to_model(response_model, raw_text)
                        latency = round(time.time() - start_time, 3)
                        await self._log_usage(
                            tenant_id=tenant_id,
                            feature=feature,
                            provider="groq",
                            model=model_name,
                            input_tokens=len(user_prompt) // 4,
                            output_tokens=len(raw_text) // 4,
                            latency=latency,
                            is_byok=is_byok_groq,
                            success=True,
                        )
                        return parsed, model_name
            except Exception as e:
                logger.warning("groq_call_failed_falling_back", error=str(e))

        # Step 3: Attempt OpenAI (BYOK if available)
        openai_key, is_byok_openai = await self._resolve_api_key(tenant_id, "openai")
        if openai_key:
            try:
                model_name = preferred_model if preferred_model and "gpt" in preferred_model else "gpt-4o"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={
                            "model": model_name,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "response_format": {"type": "json_object"},
                        },
                    )
                    if resp.status_code == 200:
                        raw_text = resp.json()["choices"][0]["message"]["content"]
                        parsed = _coerce_to_model(response_model, raw_text)
                        latency = round(time.time() - start_time, 3)
                        await self._log_usage(
                            tenant_id=tenant_id,
                            feature=feature,
                            provider="openai",
                            model=model_name,
                            input_tokens=len(user_prompt) // 4,
                            output_tokens=len(raw_text) // 4,
                            latency=latency,
                            is_byok=is_byok_openai,
                            success=True,
                        )
                        return parsed, model_name
            except Exception as e:
                logger.warning("openai_call_failed_falling_back", error=str(e))

        # Step 4: Deterministic Mock Qualification Fallback
        logger.info("using_mock_llm_fallback_for_qualification", feature=feature)
        latency = round(time.time() - start_time, 3)
        await self._log_usage(
            tenant_id=tenant_id,
            feature=feature,
            provider="mock",
            model="mock-deterministic-v1",
            input_tokens=0,
            output_tokens=0,
            latency=latency,
            is_byok=False,
            success=True,
        )

        if response_model == QualificationModel:
            return generate_mock_medpicc("Strategic Account Deal", "Target Corp"), "mock-deterministic-v1"  # type: ignore

        raise ValueError(f"No LLM provider available and no mock generator for model {response_model}")

    async def _log_usage(
        self,
        tenant_id: str,
        feature: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency: float,
        is_byok: bool,
        success: bool,
        error_message: Optional[str] = None,
    ):
        """Asynchronously writes token telemetry to Postgres."""
        try:
            total_tokens = input_tokens + output_tokens
            cost = calculate_cost(model, input_tokens, output_tokens) if is_byok else 0.0

            t_uuid = None
            if tenant_id:
                try:
                    t_uuid = uuid.UUID(tenant_id)
                except ValueError:
                    t_uuid = None

            async with AsyncSessionLocal() as session:
                log_entry = LLMUsageLog(
                    id=uuid.uuid4(),
                    tenant_id=t_uuid,
                    feature=feature,
                    provider=provider,
                    model=model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    estimated_cost_usd=cost,
                    latency_seconds=latency,
                    is_byok=is_byok,
                    success=success,
                    error_message=error_message,
                )
                session.add(log_entry)
                await session.commit()
        except Exception as e:
            logger.warning("llm_usage_logging_failed", error=str(e))


# Global Router Instance
llm_router = MultiLLMRouter()
