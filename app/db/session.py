"""Database session manager with automatic PostgreSQL-to-SQLite resilient fallback."""
import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.ext.compiler import compiles

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Register SQLite dialect translations for Postgres-specific column types
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "VARCHAR(36)"


# SQLite fallback database path
SQLITE_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "whipstitch_local.db")
)
SQLITE_DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_DB_PATH}"

pg_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

sqlite_engine = create_async_engine(
    SQLITE_DATABASE_URL,
    echo=False,
    future=True,
)

# Active engine reference
engine: AsyncEngine = pg_engine
_pg_tested = False
_use_sqlite = False
_sqlite_ready = False
_lock = asyncio.Lock()

_session_maker = async_sessionmaker(
    bind=pg_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def _seed_default_data(session: AsyncSession):
    """Seeds default tenant, deals, and staged prospects for Ground 0 experience."""
    from app.core.security import hash_password
    from app.db.models import (
        BuyingCommitteeMember,
        Deal,
        DealDiagnostic,
        MEDPICCScore,
        OutboundProspect,
        Tenant,
        User,
    )

    existing_tenant = await session.execute(
        select(Tenant).where(Tenant.tenant_key == "trifid_media")
    )
    tenant = existing_tenant.scalar_one_or_none()
    if tenant:
        # Ensure default user exists in existing database
        user_res = await session.execute(select(User).where(User.email == "rep@trifidmedia.in"))
        if not user_res.scalar_one_or_none():
            default_user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                email="rep@trifidmedia.in",
                hashed_password=hash_password("Whipstitch123!"),
                full_name="Alex Morgan",
                role="sales_representative",
                is_active=True,
            )
            session.add(default_user)
            await session.commit()
        return

    logger.info("seeding_ground_zero_database")
    tenant = Tenant(
        id=uuid.uuid4(),
        tenant_key="trifid_media",
        name="Trifid Media",
        config={
            "industry": "Agency & B2B SaaS",
            "icp_criteria": {
                "min_employees": 10,
                "target_roles": ["Founder", "VP Marketing", "Head of Growth", "CCO"],
            },
        },
    )
    session.add(tenant)
    await session.flush()

    # Seed default Sales Representative user
    default_user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email="rep@trifidmedia.in",
        hashed_password=hash_password("Whipstitch123!"),
        full_name="Alex Morgan",
        role="sales_representative",
        is_active=True,
    )
    session.add(default_user)

    deals_data = [
        ("Zepto - Fast Delivery Retention Engine", "Zepto", "zepto.in", 75000.0, "Discovery"),
        ("Swiggy Instamart - Merchant Ad Platform", "Swiggy", "swiggy.com", 120000.0, "Technical Validation"),
        ("Blinkit - Dark Store Demand Forecasting", "Blinkit", "blinkit.com", 95000.0, "Business Case"),
        ("FinFlow Global - Enterprise Compliance Pipeline", "FinFlow Global", "finflow.io", 150000.0, "Proposal & Review"),
    ]

    deals = []
    for d_name, c_name, dom, d_size, stage in deals_data:
        d = Deal(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            deal_name=d_name,
            company_name=c_name,
            domain=dom,
            deal_size=d_size,
            currency="USD",
            current_stage=stage,
        )
        session.add(d)
        deals.append(d)
    await session.flush()

    # Add Buying Committee Members for Zepto
    zepto_deal = deals[0]
    cm_data = [
        ("Rhea Kapoor", "Head of Product", "Internal Champion", "Engaged", "rhea@zepto.in"),
        ("Aarav Sharma", "VP Growth & Marketing", "Budget Owner", "Engaged", "aarav@zepto.in"),
        ("Devendra Nair", "InfoSec Director", "Security Reviewer", "Pending", "devendra@zepto.in"),
        ("Tanvi Deshmukh", "Senior Legal Counsel", "Legal & Contracts", "Missing", "tanvi@zepto.in"),
    ]
    for name, role, tag, status, email in cm_data:
        session.add(
            BuyingCommitteeMember(
                id=uuid.uuid4(),
                deal_id=zepto_deal.id,
                tenant_id=tenant.id,
                name=name,
                role=role,
                tag=tag,
                status=status,
                email=email,
            )
        )

    # Add Staged Outbound Prospects
    prospects_data = [
        (
            "NovaScale Technologies",
            "novascale.io",
            "D2C & E-Commerce",
            "Aarav Sharma",
            "Head of Growth",
            {"growth_stage": "Series A", "hiring_signals": ["Performance Marketer", "Creative Lead"], "recent_funding": "$4.5M", "apollo_verified": True},
            "**Fit Score: 92/100**\n\n- **Hook**: Scaling DTC ad spend by 300% this quarter.\n- **Capability**: AI automated UGC creative generation cuts CAC by 40%.\n- **Ask**: 15-min teardown of current ROAS bottlenecks.",
        ),
        (
            "OmniRetail AI",
            "omniretail.ai",
            "Retail Tech",
            "Priya Patel",
            "VP Marketing",
            {"signals": ["New Retail Launch", "Shopify Plus Migration"], "apollo_verified": True},
            "**Fit Score: 88/100**\n\n- **Hook**: Expanding omnichannel retail integrations.\n- **Capability**: Turnkey B2B sales automation.\n- **Ask**: Low-friction pilot run.",
        ),
        (
            "ApexPay Solutions",
            "apexpay.co",
            "Fintech & Payments",
            "Vikram Mehta",
            "Founder & CEO",
            {"signals": ["Cross-border expansion", "Seed round"], "apollo_verified": True},
            "**Fit Score: 85/100**\n\n- **Hook**: Scaling cross-border payment merchant acquisition.\n- **Capability**: High-velocity pipeline generation.\n- **Ask**: Benchmark comparison against legacy SDRs.",
        ),
    ]
    for c_name, dom, ind, dm_name, dm_title, sig, fit_md in prospects_data:
        session.add(
            OutboundProspect(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                company_name=c_name,
                domain=dom,
                industry=ind,
                scrape_status="staged_awaiting_approval",
                decision_maker_name=dm_name,
                decision_maker_title=dm_title,
                signals_json=sig,
                fit_markdown=fit_md,
            )
        )

    # Add initial MEDDPICC diagnostic for Zepto
    diag = DealDiagnostic(
        id=uuid.uuid4(),
        deal_id=zepto_deal.id,
        tenant_id=tenant.id,
        transcript_source="text_paste",
        transcript_text="Customer is very enthusiastic about our product. Rhea mentioned: 'Our biggest problem is quick delivery drop-off rate.'",
        overall_score=74,
        deal_category="Advance",
        next_best_action="Schedule technical deep-dive with Devendra Nair (InfoSec) to clear paper process.",
        follow_up_email_subject="Next Steps: Zepto & Whipstitch Integration Pilot",
        follow_up_email_body="Hi Rhea,\n\nThank you for the productive call today. Based on our discussion regarding cart abandonment during peak delivery hours, here is the proposed pilot blueprint...",
        closure_if_addressed={"likelihood_range": "75-85%", "rationale": "Strong internal product champion with clear metric alignment."},
        closure_if_ignored={"likelihood_range": "20-30%", "rationale": "InfoSec and procurement review risk stalling closing date by 60+ days."},
        top_blocking_boxes=["Paper Process", "Decision Process"],
        seller_summary={
            "headline": "High-velocity mid-market deal with strong product champion",
            "what_we_know": ["Drop-off rate is primary pain point", "Rhea has executive support"],
            "deal_risks": ["InfoSec review not yet initiated", "No defined legal signing turnaround"],
            "next_best_actions": ["Send SOC2 certification package to Devendra Nair", "Confirm budget sign-off timeline with Aarav Sharma"],
        },
        model_used="groq/llama-3.3-70b-versatile",
    )
    session.add(diag)
    await session.flush()

    medpicc_boxes = [
        ("Metrics", 12, 15, "Strong", "direct", "Direct quote on CAC and drop-off rate reduction targets."),
        ("Economic Buyer", 11, 15, "Moderate", "inferred", "Aarav Sharma has budget allocation authority."),
        ("Decision Criteria", 12, 15, "Strong", "direct", "Criteria defined: sub-200ms latency and SOC2 compliance."),
        ("Decision Process", 8, 15, "Moderate", "inferred", "Requires InfoSec signoff before procurement approval."),
        ("Paper Process", 5, 10, "Weak", "none", "Procurement timeline and standard MSA terms unknown."),
        ("Implicated Pain", 14, 15, "Strong", "direct", "High cart drop-off costs over $40k/month in lost GMV."),
        ("Champion", 14, 15, "Strong", "direct", "Rhea actively advocating for Whipstitch across tech team."),
        ("Competition", 8, 10, "Moderate", "inferred", "Evaluating internal build vs. Whipstitch turnkey solution."),
    ]
    for box, sc, max_sc, rat, basis, notes in medpicc_boxes:
        session.add(
            MEDPICCScore(
                id=uuid.uuid4(),
                diagnostic_id=diag.id,
                box_name=box,
                score=sc,
                max_score=max_sc,
                rating=rat,
                evidence_basis=basis,
                notes=notes,
                coaching_questions=["What is the legal team's typical review turnaround?"],
            )
        )

    await session.commit()
    logger.info("ground_zero_database_seeded_successfully")


async def _ensure_sqlite_ready():
    """Initializes SQLite schema and seeds demo data."""
    global _sqlite_ready
    if _sqlite_ready:
        return

    async with _lock:
        if _sqlite_ready:
            return
        from app.db.models import Base

        async with sqlite_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        sqlite_session_maker = async_sessionmaker(
            bind=sqlite_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with sqlite_session_maker() as session:
            await _seed_default_data(session)

        _sqlite_ready = True


async def _get_active_session() -> AsyncSession:
    """Returns an active AsyncSession, falling back to SQLite if PostgreSQL fails."""
    global _pg_tested, _use_sqlite, engine
    if not _pg_tested:
        try:
            async with asyncio.timeout(1.0):
                async with pg_engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
            _pg_tested = True
            _use_sqlite = False
        except Exception as e:
            logger.warning(
                "postgres_connection_failed_falling_back_to_sqlite",
                error=str(e),
            )
            _pg_tested = True
            _use_sqlite = True
            engine = sqlite_engine
            _session_maker.configure(bind=sqlite_engine)

    if _use_sqlite:
        await _ensure_sqlite_ready()

    return _session_maker()


@asynccontextmanager
async def _session_scope():
    session = await _get_active_session()
    try:
        yield session
    finally:
        await session.close()


class ResilientSessionFactory:
    """Callable wrapper that mirrors async_sessionmaker while providing SQLite fallback."""

    def __call__(self, *args, **kwargs):
        return _session_scope()

    def configure(self, **kwargs):
        _session_maker.configure(**kwargs)


AsyncSessionLocal = ResilientSessionFactory()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
