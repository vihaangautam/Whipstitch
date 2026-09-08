"""Deals & MEDDPICC Deal Diagnostic API Router."""
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from temporalio.client import Client

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import Deal, DealDiagnostic, EvidenceQuote, MEDPICCScore, Tenant
from app.db.session import get_db_session
from app.models.medpicc_schemas import (
    CreateDealRequest,
    DealDiagnosticResponse,
    DealResponse,
    TranscriptUploadRequest,
    TriggerDiagnoseRequest,
)
from app.services.parsing.document_parser import document_parser
from app.workflows.deal_diagnostic_workflow import DealDiagnosticWorkflow

logger = get_logger(__name__)
router = APIRouter(prefix="/v1/deals", tags=["Deal Intelligence & MEDDPICC"])


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    payload: CreateDealRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Creates a new deal record for qualification tracking."""
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == payload.tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    tenant_uuid = tenant.id if tenant else uuid.uuid4()

    deal = Deal(
        id=uuid.uuid4(),
        tenant_id=tenant_uuid,
        deal_name=payload.deal_name,
        company_name=payload.company_name,
        domain=payload.domain,
        deal_size=payload.deal_size,
        currency=payload.currency,
        current_stage=payload.current_stage,
    )
    session.add(deal)
    await session.commit()
    logger.info("deal_created", deal_id=str(deal.id), deal_name=deal.deal_name, company=deal.company_name)

    return DealResponse(
        id=str(deal.id),
        tenant_id=payload.tenant_id,
        deal_name=deal.deal_name,
        company_name=deal.company_name,
        domain=deal.domain,
        deal_size=deal.deal_size,
        currency=deal.currency,
        current_stage=deal.current_stage,
        created_at=str(deal.created_at),
    )


@router.get("", response_model=List[DealResponse])
async def list_deals(
    tenant_id: str = "trifid_media",
    session: AsyncSession = Depends(get_db_session),
):
    """Lists all active deals with their latest MEDDPICC diagnostic score and stage."""
    tenant_res = await session.execute(select(Tenant).where(Tenant.tenant_key == tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        return []

    deals_res = await session.execute(
        select(Deal).where(Deal.tenant_id == tenant.id).order_by(desc(Deal.created_at))
    )
    deals = deals_res.scalars().all()

    results = []
    for d in deals:
        # Fetch latest diagnostic
        diag_res = await session.execute(
            select(DealDiagnostic)
            .where(DealDiagnostic.deal_id == d.id)
            .order_by(desc(DealDiagnostic.created_at))
            .limit(1)
        )
        latest_diag = diag_res.scalar_one_or_none()

        results.append(
            DealResponse(
                id=str(d.id),
                tenant_id=tenant_id,
                deal_name=d.deal_name,
                company_name=d.company_name,
                domain=d.domain,
                deal_size=d.deal_size,
                currency=d.currency,
                current_stage=d.current_stage,
                latest_score=latest_diag.overall_score if latest_diag else None,
                latest_category=latest_diag.deal_category if latest_diag else None,
                created_at=str(d.created_at),
            )
        )

    return results


@router.post("/{deal_id}/transcript", status_code=status.HTTP_200_OK)
async def upload_transcript(
    deal_id: str,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_db_session),
):
    """Uploads a transcript via file upload (.txt, .vtt, .srt, .docx, .pdf) or raw text."""
    deal_res = await session.execute(select(Deal).where(Deal.id == uuid.UUID(deal_id)))
    deal = deal_res.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if file:
        content_bytes = await file.read()
        parsed_text = document_parser.parse_file(file.filename, content_bytes)
        source = "file_upload"
    elif raw_text:
        parsed_text = document_parser.parse_plain_text(raw_text.encode("utf-8"))
        source = "text_paste"
    else:
        raise HTTPException(status_code=400, detail="Must provide either a transcript file or raw_text")

    word_count = len(parsed_text.split())
    logger.info("transcript_uploaded", deal_id=deal_id, source=source, word_count=word_count)

    return {
        "deal_id": deal_id,
        "status": "uploaded",
        "source": source,
        "word_count": word_count,
        "preview": parsed_text[:300] + ("..." if len(parsed_text) > 300 else ""),
        "full_text": parsed_text,
    }


@router.post("/{deal_id}/diagnose", status_code=status.HTTP_202_ACCEPTED)
async def trigger_diagnose_workflow(
    deal_id: str,
    payload: TriggerDiagnoseRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Triggers the DealDiagnosticWorkflow in Temporal or local fallback."""
    deal_res = await session.execute(select(Deal).where(Deal.id == uuid.UUID(deal_id)))
    deal = deal_res.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    text_to_analyze = payload.transcript_text or (payload.deal_context or {}).get("transcript_text", "")
    if not text_to_analyze:
        # Check if there is an existing diagnostic transcript to re-run
        diag_res = await session.execute(
            select(DealDiagnostic).where(DealDiagnostic.deal_id == deal.id).order_by(desc(DealDiagnostic.created_at)).limit(1)
        )
        existing_diag = diag_res.scalar_one_or_none()
        if existing_diag:
            text_to_analyze = existing_diag.transcript_text
        else:
            raise HTTPException(status_code=400, detail="No transcript text provided for diagnosis")

    workflow_id = f"medpicc-diag-{deal_id[:8]}-{uuid.uuid4().hex[:6]}"

    wf_payload = {
        "deal_id": str(deal.id),
        "tenant_id": payload.tenant_id,
        "deal_name": deal.deal_name,
        "company_name": deal.company_name,
        "transcript_text": text_to_analyze,
        "deal_context": payload.deal_context,
        "preferred_model": payload.preferred_model,
    }

    try:
        temporal_client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
        handle = await temporal_client.start_workflow(
            DealDiagnosticWorkflow.run,
            wf_payload,
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
        logger.info("medpicc_workflow_scheduled", workflow_id=workflow_id, deal_id=deal_id)
        return {
            "workflow_id": workflow_id,
            "status": "scheduled",
            "deal_id": deal_id,
            "message": "MEDDPICC Deal Diagnostic workflow triggered successfully.",
        }
    except Exception as e:
        logger.warning("temporal_start_failed_running_direct_activity", error=str(e))
        # Direct execution fallback for local test/dev without active worker
        from app.activities.deal_diagnostic_activity import extract_medpicc_scores_activity, update_crm_deal_stage_activity, render_medpicc_pdf_activity

        score_res = await extract_medpicc_scores_activity(
            deal_id=str(deal.id),
            tenant_id=payload.tenant_id,
            deal_name=deal.deal_name,
            company_name=deal.company_name,
            transcript_text=text_to_analyze,
            deal_context=payload.deal_context,
            preferred_model=payload.preferred_model,
        )
        diag_id = score_res["diagnostic_id"]
        qual_data = score_res["qualification_model"]

        await update_crm_deal_stage_activity(str(deal.id), payload.tenant_id, deal.company_name, qual_data)
        pdf_res = await render_medpicc_pdf_activity(
            str(deal.id), diag_id, deal.deal_name, deal.company_name, qual_data, score_res["model_used"]
        )

        return {
            "workflow_id": "direct-execution",
            "status": "completed",
            "deal_id": deal_id,
            "diagnostic_id": diag_id,
            "overall_score": qual_data.get("overall_qualification_score_0_100"),
            "deal_category": qual_data.get("deal_category"),
            "report_path": pdf_res.get("report_path"),
        }


@router.get("/{deal_id}/medpicc", response_model=DealDiagnosticResponse)
async def get_medpicc_scorecard(
    deal_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieves the latest parsed MEDDPICC scorecard, verbatim evidence quotes, and coaching questions."""
    deal_uuid = uuid.UUID(deal_id)
    diag_res = await session.execute(
        select(DealDiagnostic)
        .where(DealDiagnostic.deal_id == deal_uuid)
        .order_by(desc(DealDiagnostic.created_at))
        .limit(1)
    )
    diag = diag_res.scalar_one_or_none()
    if not diag:
        raise HTTPException(status_code=404, detail="No MEDDPICC diagnostic found for this deal")

    # Fetch 8 box scores with quotes
    scores_res = await session.execute(
        select(MEDPICCScore).where(MEDPICCScore.diagnostic_id == diag.id)
    )
    scores = scores_res.scalars().all()

    boxes_list = []
    for s in scores:
        quotes_res = await session.execute(
            select(EvidenceQuote).where(EvidenceQuote.score_id == s.id)
        )
        quotes = quotes_res.scalars().all()

        boxes_list.append({
            "box": s.box_name,
            "score": s.score,
            "max_score": s.max_score,
            "rating": s.rating,
            "evidence_basis": s.evidence_basis,
            "hard_cap_applied": s.hard_cap_applied,
            "notes": s.notes,
            "missing_evidence": s.missing_evidence,
            "coaching_questions": s.coaching_questions or [],
            "evidence_quotes": [
                {
                    "person_name": q.person_name,
                    "evidence_date": q.evidence_date,
                    "medium": q.medium,
                    "quote": q.quote,
                }
                for q in quotes
            ],
        })

    pdf_url = f"/v1/deals/{deal_id}/medpicc/pdf" if diag.pdf_report_path else None

    return DealDiagnosticResponse(
        id=str(diag.id),
        deal_id=str(diag.deal_id),
        overall_score=diag.overall_score,
        deal_category=diag.deal_category,
        next_best_action=diag.next_best_action,
        closure_if_addressed=diag.closure_if_addressed,
        closure_if_ignored=diag.closure_if_ignored,
        top_blocking_boxes=diag.top_blocking_boxes,
        seller_summary=diag.seller_summary,
        follow_up_email={
            "subject": diag.follow_up_email_subject or "",
            "body_content": diag.follow_up_email_body or "",
        },
        boxes=boxes_list,
        model_used=diag.model_used,
        pdf_report_url=pdf_url,
        created_at=str(diag.created_at),
    )


@router.get("/{deal_id}/medpicc/pdf")
async def download_medpicc_pdf(
    deal_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Downloads the compiled MEDDPICC diagnostic report (PDF or rendered HTML)."""
    deal_uuid = uuid.UUID(deal_id)
    diag_res = await session.execute(
        select(DealDiagnostic)
        .where(DealDiagnostic.deal_id == deal_uuid)
        .order_by(desc(DealDiagnostic.created_at))
        .limit(1)
    )
    diag = diag_res.scalar_one_or_none()
    if not diag or not diag.pdf_report_path or not os.path.exists(diag.pdf_report_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    if diag.pdf_report_path.endswith(".pdf"):
        return FileResponse(diag.pdf_report_path, media_type="application/pdf", filename=f"medpicc_diagnostic_{deal_id[:8]}.pdf")
    else:
        with open(diag.pdf_report_path, "r", encoding="utf-8") as f:
            html = f.read()
        return HTMLResponse(content=html)


@router.get("/{deal_id}/follow-up")
async def get_follow_up_email(
    deal_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieves the auto-drafted follow-up email targeting the weakest MEDDPICC box."""
    deal_uuid = uuid.UUID(deal_id)
    diag_res = await session.execute(
        select(DealDiagnostic)
        .where(DealDiagnostic.deal_id == deal_uuid)
        .order_by(desc(DealDiagnostic.created_at))
        .limit(1)
    )
    diag = diag_res.scalar_one_or_none()
    if not diag or not diag.follow_up_email_body:
        raise HTTPException(status_code=404, detail="No follow-up email drafted yet")

    return {
        "deal_id": deal_id,
        "subject": diag.follow_up_email_subject,
        "body_content": diag.follow_up_email_body,
    }
