"""5-Stage Blackboard Competitor Battlecard engine — LLM-generated, tenant-specific.

No hardcoded competitor fixtures. Battlecards are synthesised from the tenant's own
company description / offering via the multi-LLM router, with a deterministic template
fallback when no LLM provider is reachable.
"""
import logging
import re
from typing import List, Optional, Tuple

from pydantic import BaseModel, Field

from app.core.llm_router import llm_router
from app.models.battlecard_schemas import (
    BattlecardKillShot,
    BlackboardStageResult,
    CompetitorBattlecard,
    ObjectionHandlingEntry,
)

logger = logging.getLogger("whipstitch.battlecards")


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "competitor"


class CompetitorShortlist(BaseModel):
    competitors: List[str] = Field(
        default_factory=list,
        description="3-4 realistic competitive alternatives this seller loses deals to, "
        "including non-software options like 'Building In-House' or 'Status Quo / Manual Process'.",
    )


class TenantContext(BaseModel):
    seller_company: str = "our company"
    offering: str = ""
    company_description: str = ""
    industry: str = ""
    value_props: List[str] = Field(default_factory=list)
    currency: str = "USD"


_BATTLECARD_SYSTEM = (
    "You are a B2B competitive-intelligence analyst producing a battlecard a salesperson "
    "uses live on calls. Legal safety is mandatory: never assert unverified negative facts "
    "about the competitor. Frame every weakness as either a category-structural pattern "
    "('providers of this type typically...') or a Socratic question the rep asks the buyer. "
    "Be concrete and specific to the seller's actual offering.\n"
    "Return ONLY strict JSON. Rules:\n"
    "- kill_shots: exactly 2 items.\n"
    "- objection_matrix: exactly 3 items.\n"
    "- blackboard_stages: exactly 5 items with stage_number 1,2,3,4,5. Each `details` MUST be "
    "a JSON object (key/value pairs), never a string or array.\n"
    "- Every `evidence_basis` field MUST be exactly one of: \"category_structural_pattern\", "
    "\"socratic_inquiry\", \"tenant_verified_intel\". Use \"tenant_verified_intel\" only for a "
    "claim the seller could back with their own customer evidence."
)


class BlackboardBattlecardOrchestrator:
    """Stateless synthesiser. Persistence lives in the API layer (tenant_battlecards table)."""

    async def identify_competitors(self, ctx: TenantContext) -> List[str]:
        """LLM shortlist of who this seller actually competes with. Template fallback."""
        user_prompt = (
            f"Seller: {ctx.seller_company}\n"
            f"What they sell: {ctx.offering}\n"
            f"Company description: {ctx.company_description}\n"
            f"Industry: {ctx.industry}\n\n"
            "List 3-4 competitive alternatives a buyer would evaluate against this seller. "
            'Return JSON: {"competitors": ["Name 1", "Name 2", ...]}'
        )
        try:
            parsed, _ = await llm_router.call_structured_llm(
                tenant_id=ctx.seller_company,
                system_prompt="You are a B2B market analyst. Return only strict JSON.",
                user_prompt=user_prompt,
                response_model=CompetitorShortlist,
                feature="battlecard_competitor_id",
            )
            names = [c.strip() for c in parsed.competitors if c and c.strip()][:4]
            if names:
                return names
        except Exception as e:
            logger.warning("competitor_identification_llm_failed: %s", e)
        return ["Building In-House", "Status Quo / Manual Process", "Incumbent Vendor"]

    async def generate_battlecard(
        self, competitor_name: str, ctx: TenantContext, tenant_id: str,
        rival_intel: Optional[str] = None,
    ) -> Tuple[CompetitorBattlecard, str, Optional[str]]:
        """Returns (card, generated_by, model_used). Falls back to the template on LLM failure.

        Without tenant-supplied `rival_intel`, all claims are forced to category-level
        (never 'tenant_verified_intel') as a defamation safeguard.
        """
        intel_line = (
            f"TENANT-VERIFIED INTEL ABOUT {competitor_name}: {rival_intel}\n"
            if rival_intel and rival_intel.strip()
            else "TENANT-VERIFIED INTEL: none provided — every evidence_basis MUST be "
            "'category_structural_pattern' or 'socratic_inquiry', never 'tenant_verified_intel'.\n"
        )
        user_prompt = (
            f"SELLER: {ctx.seller_company}\n"
            f"SELLER OFFERING: {ctx.offering}\n"
            f"SELLER DESCRIPTION: {ctx.company_description}\n"
            f"SELLER VALUE PROPS: {', '.join(ctx.value_props) or 'not specified'}\n"
            f"INDUSTRY: {ctx.industry}\n"
            f"CURRENCY: {ctx.currency}\n"
            f"{intel_line}\n"
            f"COMPETITOR TO BATTLECARD: {competitor_name}\n\n"
            "Produce the battlecard as JSON with keys: id (slug), competitor_name, "
            "competitor_category, summary_verdict, pricing_weakness, feature_gaps (list of strings), "
            "evidence_basis, kill_shots (list of {title, the_trap, the_vulnerability, "
            "the_counter_strike, verbatim_soundbite, evidence_proof, evidence_basis}), "
            "objection_matrix (list of {objection, root_cause, talk_track, proof_point}), "
            "blackboard_stages (list of {stage_number, stage_name, executive_summary, details})."
        )
        try:
            parsed, model_used = await llm_router.call_structured_llm(
                tenant_id=tenant_id,
                system_prompt=_BATTLECARD_SYSTEM,
                user_prompt=user_prompt,
                response_model=CompetitorBattlecard,
                feature="battlecard",
            )
            parsed.id = slugify(competitor_name)
            parsed.competitor_name = competitor_name
            # Guarantee 5 sequentially-numbered stages regardless of what the model returned.
            stages = parsed.blackboard_stages[:5]
            _names = [
                "Opportunity Context Engine", "Pressure & Catalyst Engine", "Differentiation Engine",
                "Operational Data Engine", "Seller Action Brief",
            ]
            for i, name in enumerate(_names):
                if i < len(stages):
                    stages[i].stage_number = i + 1
                else:
                    stages.append(BlackboardStageResult(
                        stage_number=i + 1, stage_name=name,
                        executive_summary=f"{name} analysis pending.", details={},
                    ))
            parsed.blackboard_stages = stages
            if not parsed.kill_shots or not parsed.objection_matrix:
                raise ValueError("LLM battlecard missing kill_shots or objection_matrix")

            # Defamation safeguard: no verified-intel claims unless the tenant supplied intel.
            if not (rival_intel and rival_intel.strip()):
                if parsed.evidence_basis == "tenant_verified_intel":
                    parsed.evidence_basis = "category_structural_pattern"
                for ks in parsed.kill_shots:
                    if ks.evidence_basis == "tenant_verified_intel":
                        ks.evidence_basis = "category_structural_pattern"

            return parsed, "llm", model_used
        except Exception as e:
            logger.warning("battlecard_llm_failed_using_template for %s: %s", competitor_name, e)
            return self.synthesize_custom_battlecard(
                competitor_name=competitor_name,
                seller_company=ctx.seller_company,
                tenant_offering=ctx.offering,
                tenant_value_props=ctx.value_props or None,
                currency=ctx.currency,
            ), "template", None

    # ------------------------------------------------------------------ template fallback
    def synthesize_custom_battlecard(
        self,
        competitor_name: str,
        buyer_company: Optional[str] = None,
        deal_context: Optional[str] = None,
        seller_company: Optional[str] = None,
        tenant_offering: Optional[str] = None,
        tenant_value_props: Optional[List[str]] = None,
        tenant_rival_intel: Optional[str] = None,
        avg_contract_value: Optional[float] = None,
        buyer_tier: int = 1,
        currency: str = "USD",
        team_type: str = "team",
    ) -> CompetitorBattlecard:
        """Deterministic, legally-safe battlecard used when no LLM provider is reachable."""
        comp_id = slugify(competitor_name)
        seller = seller_company or "Our Team"
        offering = tenant_offering or "our specialised service"
        props = tenant_value_props or [
            "guaranteed delivery turnaround SLAs",
            "dedicated senior domain bench without junior hand-offs",
            "transparent pricing with zero hidden fees",
        ]

        if tenant_rival_intel and tenant_rival_intel.strip():
            claim_basis = "tenant_verified_intel"
            vulnerability = f"Tenant-verified operational constraint: {tenant_rival_intel.strip()}"
        else:
            claim_basis = "category_structural_pattern"
            vulnerability = (
                f"Providers positioned like {competitor_name} typically carry high account-to-staff "
                "ratios, which creates review bottlenecks during peak demand."
            )

        symbol = "₹" if currency == "INR" else ("€" if currency == "EUR" else "$")
        if avg_contract_value and avg_contract_value > 0:
            leakage = f"{symbol}{avg_contract_value * 1.25:,.0f}"
            leakage_basis = (
                f"Computed from your configured average contract value "
                f"({symbol}{avg_contract_value:,.0f} × 1.25 delay multiplier)"
            )
        else:
            leakage = f"{symbol}0"
            leakage_basis = "Set an average contract value in Logic & ICP Studio for a computed figure."

        return CompetitorBattlecard(
            id=comp_id,
            competitor_name=competitor_name,
            competitor_category="Competitive Alternative",
            summary_verdict=(
                f"{seller} delivers {offering} with verified outcome guarantees, whereas "
                f"{competitor_name} relies on generalist category workflows with operational overhead."
            ),
            pricing_weakness="Bloated minimums, rigid scope lock-ins, and slow review turnaround.",
            feature_gaps=[f"Lacks {props[0]}.", f"No dedicated focus on {offering}.", "Requires client micromanagement to hit production quality."],
            evidence_basis=claim_basis,
            leakage_calculation_basis=leakage_basis,
            kill_shots=[
                BattlecardKillShot(
                    title=f"The {competitor_name} Operational Bottleneck",
                    the_trap=f"{competitor_name} tells buyers: 'We handle everything under one roof at a bundle price.'",
                    the_vulnerability=vulnerability,
                    the_counter_strike=(
                        f"Ask the buyer: 'When your deadline is 10 days out, will {competitor_name}'s senior "
                        "people personally review your deliverables, or does it queue behind other accounts?'"
                    ),
                    verbatim_soundbite=(
                        f"Instead of a generalist provider where your work gets queued, {seller} embeds a "
                        f"dedicated team on {offering} with verified turnaround SLAs."
                    ),
                    evidence_proof=None,
                    evidence_basis=claim_basis,
                )
            ],
            objection_matrix=[
                ObjectionHandlingEntry(
                    objection=f"We are leaning toward {competitor_name}.",
                    root_cause="Brand familiarity or a lower sticker price.",
                    talk_track=(
                        f"We respect {competitor_name}'s presence. Clients switch to {seller} when they need "
                        "high-touch execution, senior accountability, and zero scope friction."
                    ),
                    proof_point=f"Estimated cost of delay: {leakage} ({leakage_basis}).",
                )
            ],
            blackboard_stages=[
                BlackboardStageResult(
                    stage_number=1, stage_name="Opportunity Context Engine",
                    executive_summary=f"Competitive displacement evaluation against {competitor_name} for {buyer_company or 'the prospect'} seeking {offering}.",
                    details={"competitor": competitor_name, "offering": offering},
                ),
                BlackboardStageResult(
                    stage_number=2, stage_name="Pressure & Catalyst Engine",
                    executive_summary="Buyer urgency driven by an upcoming launch milestone and a mandate to protect ROI.",
                    details={"catalyst": "Deadline pressure & margin protection"},
                ),
                BlackboardStageResult(
                    stage_number=3, stage_name="Differentiation Engine",
                    executive_summary=f"Core advantages of {seller}: {', '.join(props[:3])}.",
                    details={"differentiation_pillars": props[:3]},
                ),
                BlackboardStageResult(
                    stage_number=4, stage_name="Operational Data Engine",
                    executive_summary=f"Estimated {leakage} in delayed-deliverable cost avoided.",
                    details={"annual_leakage_saved": leakage, "calculation_basis": leakage_basis},
                ),
                BlackboardStageResult(
                    stage_number=5, stage_name="Seller Action Brief",
                    executive_summary="Equip the rep with the senior-accountability trap question and offer a short proof sprint.",
                    details={"recommended_next_play": f"Offer a short pilot sprint for {offering}"},
                ),
            ],
        )
