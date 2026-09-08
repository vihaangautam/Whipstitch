"""Temporal Activities for MEDDPICC Deal Diagnostic Workflow."""
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import select
from temporalio import activity

from app.core.logging import bind_correlation_id, get_logger
from app.core.llm_router import llm_router
from app.core.prompts.medpicc_prompts import MEDPICC_SYSTEM_PROMPT, build_medpicc_prompt
from app.db.models import Deal, DealDiagnostic, EvidenceQuote, MEDPICCScore, Tenant
from app.db.session import AsyncSessionLocal
from app.models.medpicc_schemas import QualificationModel
from app.services.crm.hubspot import HubSpotCRMProvider
from app.services.parsing.document_parser import document_parser
from app.services.reporting.pdf_generator import pdf_generator

logger = get_logger(__name__)


@activity.defn(name="parse_transcript_activity")
async def parse_transcript_activity(
    deal_id: str,
    raw_content: str,
    filename: Optional[str] = None,
) -> Dict[str, Any]:
    """Activity 1: Parses transcript text or uploaded file content."""
    bind_correlation_id(deal_id)
    logger.info("parse_transcript_activity_started", deal_id=deal_id, filename=filename)

    if filename and ("." in filename):
        parsed_text = document_parser.parse_file(filename, raw_content.encode("utf-8"))
    else:
        # Check if raw text looks like WebVTT
        if "-->" in raw_content or "WEBVTT" in raw_content:
            parsed_text = document_parser.parse_vtt_or_srt(raw_content)
        else:
            parsed_text = raw_content.strip()

    word_count = len(parsed_text.split())
    logger.info("parse_transcript_activity_completed", deal_id=deal_id, word_count=word_count)
    return {"cleaned_text": parsed_text, "word_count": word_count}


@activity.defn(name="extract_medpicc_scores_activity")
async def extract_medpicc_scores_activity(
    deal_id: str,
    tenant_id: str,
    deal_name: str,
    company_name: str,
    transcript_text: str,
    deal_context: Dict[str, Any],
    preferred_model: Optional[str] = None,
) -> Dict[str, Any]:
    """Activity 2: Executes Multi-LLM MEDDPICC evaluation and persists scorecard to Postgres."""
    tenant_track = deal_context.get("tenant_track", "Service / Retainer")
    deal_tier = deal_context.get("buyer_tier", "Tier 1: Founder-Led SMB")
    deal_currency = deal_context.get("currency", "INR")

    user_prompt = build_medpicc_prompt(
        deal_name=deal_name,
        company_name=company_name,
        transcript_text=transcript_text,
        deal_context=deal_context,
        tenant_track=tenant_track,
        deal_tier=deal_tier,
        deal_currency=deal_currency,
    )

    qualification, model_used = await llm_router.call_structured_llm(
        tenant_id=tenant_id,
        system_prompt=MEDPICC_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        response_model=QualificationModel,
        feature="medpicc",
        preferred_model=preferred_model,
    )

    tier_num = "1" if "tier 1" in deal_tier.lower() else ("2" if "tier 2" in deal_tier.lower() else "3")
    qualification.rubric_version = f"track1-tier{tier_num}-v1.0"

    diagnostic_id = uuid.uuid4()
    async with AsyncSessionLocal() as session:
        # Resolve tenant_uuid
        tenant_uuid = None
        try:
            tenant_uuid = uuid.UUID(tenant_id)
        except ValueError:
            tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
            tenant_obj = tenant_res.scalar_one_or_none()
            tenant_uuid = tenant_obj.id if tenant_obj else uuid.uuid4()

        deal_uuid = uuid.UUID(deal_id) if isinstance(deal_id, str) and len(deal_id) == 36 else uuid.uuid4()

        # Create DealDiagnostic record
        diagnostic_record = DealDiagnostic(
            id=diagnostic_id,
            deal_id=deal_uuid,
            tenant_id=tenant_uuid,
            transcript_source="parsed_input",
            transcript_text=transcript_text[:10000],  # store first 10k chars for audit
            overall_score=qualification.overall_qualification_score_0_100,
            deal_category=qualification.deal_category,
            next_best_action=qualification.next_best_action,
            follow_up_email_subject=qualification.next_best_action_email.subject,
            follow_up_email_body=qualification.next_best_action_email.body_content,
            closure_if_addressed=qualification.closure_likelihood.if_addressed.model_dump(),
            closure_if_ignored=qualification.closure_likelihood.if_ignored.model_dump(),
            top_blocking_boxes=qualification.top_2_missing_boxes_blocking_closure,
            seller_summary=qualification.seller_summary.model_dump(),
            model_used=model_used,
        )
        session.add(diagnostic_record)

        # Create 8 MEDPICCScore records & EvidenceQuote items
        for box in qualification.value_selling_boxes:
            score_id = uuid.uuid4()
            score_item = MEDPICCScore(
                id=score_id,
                diagnostic_id=diagnostic_id,
                box_name=box.box,
                score=box.score,
                max_score=box.max_score,
                rating=box.rating,
                evidence_basis=box.evidence_basis,
                hard_cap_applied=box.hard_cap_applied,
                notes=box.notes,
                missing_evidence=box.missing_evidence,
                coaching_questions=box.coaching_questions,
            )
            session.add(score_item)

            for quote in box.evidence_quotes:
                quote_entry = EvidenceQuote(
                    id=uuid.uuid4(),
                    score_id=score_id,
                    person_name=quote.person_name,
                    evidence_date=quote.evidence_date,
                    medium=quote.medium,
                    quote=quote.quote,
                )
                session.add(quote_entry)

        # Update Deal stage & score
        deal_res = await session.execute(select(Deal).where(Deal.id == uuid.UUID(deal_id)))
        deal_obj = deal_res.scalar_one_or_none()
        if deal_obj:
            deal_obj.current_stage = f"{qualification.deal_category} ({qualification.overall_qualification_score_0_100}/100)"
            deal_obj.updated_at = datetime.now(timezone.utc)

        await session.commit()

    logger.info(
        "extract_medpicc_scores_completed",
        deal_id=deal_id,
        diagnostic_id=str(diagnostic_id),
        score=qualification.overall_qualification_score_0_100,
        category=qualification.deal_category,
    )

    return {
        "diagnostic_id": str(diagnostic_id),
        "qualification_model": qualification.model_dump(),
        "model_used": model_used,
    }


@activity.defn(name="update_crm_deal_stage_activity")
async def update_crm_deal_stage_activity(
    deal_id: str,
    tenant_id: str,
    company_name: str,
    qualification_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Activity 3: Syncs MEDDPICC score and stage recommendation to HubSpot CRM."""
    bind_correlation_id(deal_id)
    category = qualification_data.get("deal_category", "Rescue")
    score = qualification_data.get("overall_qualification_score_0_100", 70)

    # Map category to HubSpot Pipeline Stage
    stage_map = {
        "Advance": "qualifiedtobuy",
        "Rescue": "decisionmakerbought-in",
        "Nurture": "appointmentscheduled",
        "Disqualify": "closedlost",
    }
    hubspot_stage = stage_map.get(category, "appointmentscheduled")

    crm_provider = HubSpotCRMProvider()
    logger.info("syncing_medpicc_to_crm", deal_id=deal_id, stage=hubspot_stage, score=score)

    crm_result = await crm_provider.sync_lead(
        email=f"deal-{deal_id[:8]}@{company_name.lower().replace(' ', '')}.com",
        company_name=company_name,
        enrichment_data={"deal_stage": hubspot_stage, "medpicc_score": score},
        qualification_data={
            "lead_score": score,
            "fit_reasoning": f"MEDDPICC Deal Score: {score}/100. Category: {category}. Action: {qualification_data.get('recommended_stage_action', '')}",
        },
    )

    return {"crm_provider": "hubspot", "crm_record_id": crm_result.crm_record_id, "stage": hubspot_stage}


@activity.defn(name="render_medpicc_pdf_activity")
async def render_medpicc_pdf_activity(
    deal_id: str,
    diagnostic_id: str,
    deal_name: str,
    company_name: str,
    qualification_data: Dict[str, Any],
    model_used: str,
) -> Dict[str, Any]:
    """Activity 4: Compiles and saves the executive MEDDPICC report PDF/HTML."""
    bind_correlation_id(deal_id)
    output_dir = os.path.join(os.getcwd(), "artifacts", "reports")

    report_payload = {
        "deal_name": deal_name,
        "company_name": company_name,
        "overall_score": qualification_data.get("overall_qualification_score_0_100", 0),
        "deal_category": qualification_data.get("deal_category", "Rescue"),
        "next_best_action": qualification_data.get("next_best_action", ""),
        "follow_up_email": qualification_data.get("next_best_action_email", {}),
        "closure_likelihood": qualification_data.get("closure_likelihood", {}),
        "seller_summary": qualification_data.get("seller_summary", {}),
        "boxes": qualification_data.get("value_selling_boxes", []),
        "model_used": model_used,
    }

    report_path = pdf_generator.render_pdf_or_html(
        output_dir=output_dir,
        deal_id=deal_id,
        report_data=report_payload,
    )

    async with AsyncSessionLocal() as session:
        diag_res = await session.execute(
            select(DealDiagnostic).where(DealDiagnostic.id == uuid.UUID(diagnostic_id))
        )
        diag = diag_res.scalar_one_or_none()
        if diag:
            diag.pdf_report_path = report_path
            await session.commit()

    logger.info("medpicc_report_saved", deal_id=deal_id, report_path=report_path)
    return {"report_path": report_path}
