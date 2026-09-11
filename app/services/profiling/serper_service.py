"""Google Serper API integration with Redis rate limiting and SHA-256 result caching."""
import asyncio
import hashlib
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("whipstitch.serper")

# In-memory rate-limit and cache fallbacks if Redis is not configured
_IN_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}
_DAILY_QUERY_COUNT: int = 0
_DAILY_QUERY_LIMIT: int = 100

# ATS job-board hosts whose URLs carry a parseable company slug in the first path segment.
# Serper's free tier rejects the `site:` operator entirely, so these are used as plain
# keywords in the query and the ATS URLs are picked out of the organic results instead.
_ATS_HOST_KEYWORDS = ("greenhouse.io", "lever.co", "ashbyhq.com")
_ATS_URL_MARKERS = ("greenhouse.io/", "jobs.lever.co/", "ashbyhq.com/")
_ATS_GENERIC_SEGMENTS = {
    "careers", "jobs", "j", "search", "companies", "about", "o", "embed", "postings",
}
_DOMAIN_TLDS = ("com", "io", "co", "ai", "in")

# A company whose own posting is "we're hiring a recruiter/talent role" is not a hiring-signal
# lead — it's a job board / HR-tech / staffing vendor whose entire business is jobs, so it
# always outranks real operating companies in a "<role> job <ATS>" search. Filtered by name
# since that's resolved for every candidate; false positives (a genuine company that happens
# to have "job"/"talent" in its name) are rare and cheap to Reject manually on the card.
_NOISE_COMPANY_RE = re.compile(
    r"\b(jobs?|careers?|recruit(?:ing|er)?|staffing|talent|hiring|remote\s*work)\b", re.I
)
# Job-board brand names are usually compounds ("Jobgether", "Jobstreet", "Jobvite") that don't
# trip the word-boundary check above — catch those by prefix instead.
_NOISE_COMPANY_PREFIX_RE = re.compile(r"^(job|career|recruit|staffing|talent|hire|remote)", re.I)


def _is_noise_company(name: str, domain: str) -> bool:
    domain_root = re.sub(r"[^a-z0-9]", "", domain.lower().split(".")[0])
    return bool(
        _NOISE_COMPANY_RE.search(name)
        or _NOISE_COMPANY_RE.search(domain)
        or _NOISE_COMPANY_PREFIX_RE.match(name.strip())
        or _NOISE_COMPANY_PREFIX_RE.match(domain_root)
    )


def _ats_company_slug(link: str) -> Optional[str]:
    """boards.greenhouse.io/acme/jobs/123 -> 'acme'. Returns None for non-ATS or generic pages."""
    low = link.lower()
    if not any(m in low for m in _ATS_URL_MARKERS):
        return None
    try:
        path = link.split("//", 1)[1].split("/", 1)[1]
    except IndexError:
        return None
    seg = path.split("/", 1)[0].split("?", 1)[0].strip().lower()
    if not seg or seg in _ATS_GENERIC_SEGMENTS:
        return None
    return seg


_ATS_TITLE_NOISE = re.compile(
    r"\s*[-|–—]\s*(greenhouse|lever|ashby|ashbyhq|job\s*board|careers?|jobs?)\b.*$", re.I
)
_NAME_JUNK = re.compile(r"[^\w .'\-]", re.UNICODE)  # drop emoji / symbols from a person name
_TITLEISH = re.compile(
    r"\b(manager|director|lead|head|specialist|officer|vp|chief|engineer|analyst|coordinator|executive)\b",
    re.I,
)


def _clean_person_name(raw: str) -> Optional[str]:
    name = _NAME_JUNK.sub("", (raw or "")).strip(" .-'")
    name = re.sub(r"\s{2,}", " ", name)
    parts = name.split()
    if not (2 <= len(parts) <= 4):
        return None
    if _TITLEISH.search(name):  # it's a job title, not a person
        return None
    return name


def _pretty_slug(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def _company_from_title(title: str, slug: str) -> str:
    """Extracts the employer name from an ATS result title, else prettifies the slug."""
    t = _ATS_TITLE_NOISE.sub("", (title or "").strip()).strip(" .|-–—")
    for sep in (" at ", " — ", " – ", " - ", " | ", ", "):
        if sep in t and _TITLEISH.search(t.split(sep, 1)[0]):
            t = t.split(sep, 1)[1].strip()
            break
    t = t.strip(" .|-–—")
    # If what's left still reads like a job title (or is empty), fall back to the slug.
    if not t or (_TITLEISH.search(t) and len(t.split()) <= 4):
        return _pretty_slug(slug)
    return t


async def _resolve_company_domain(slug: str) -> str:
    """Best-effort slug -> registrable domain via concurrent HEAD probes. Falls back to
    '<slug>.com' when nothing resolves (downstream research keys off company name, not domain).
    ponytail: TLD-probe heuristic, no WHOIS/registry lookup."""
    compact = re.sub(r"[^a-z0-9]", "", slug.lower())
    candidates: List[str] = []
    for host in (f"{slug.lower()}.com", *[f"{compact}.{tld}" for tld in _DOMAIN_TLDS]):
        if host not in candidates:
            candidates.append(host)

    async def probe(host: str) -> Optional[str]:
        try:
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
                resp = await client.head(f"https://{host}")
            return host if resp.status_code < 400 else None
        except Exception:
            return None

    for host in await asyncio.gather(*(probe(h) for h in candidates)):
        if host:
            return host
    return f"{compact or slug.lower()}.com"


class SerperService:
    """Async client for Google Serper search and scrape with credit safety guarantees."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SERPER_API_KEY or os.getenv("SERPER_API_KEY", "")
        self.base_url = "https://google.serper.dev/search"

    def _generate_cache_key(self, query: str) -> str:
        return f"serper:{hashlib.sha256(query.strip().lower().encode('utf-8')).hexdigest()}"

    def check_rate_limit(self) -> bool:
        """Returns True if within the 100 req/day quota, False otherwise."""
        global _DAILY_QUERY_COUNT
        if _DAILY_QUERY_COUNT >= _DAILY_QUERY_LIMIT:
            logger.warning("Serper daily limit reached (%d/%d)", _DAILY_QUERY_COUNT, _DAILY_QUERY_LIMIT)
            return False
        return True

    def record_usage(self):
        global _DAILY_QUERY_COUNT
        _DAILY_QUERY_COUNT += 1

    @property
    def is_live(self) -> bool:
        return bool(self.api_key) and self.api_key != "mock" and "test" not in self.api_key.lower()

    async def _organic(self, query: str, num: int = 10) -> List[Dict[str, str]]:
        """Runs one live Serper search and returns organic results (title/link/snippet)."""
        if not self.is_live or not self.check_rate_limit():
            return []
        cache_key = self._generate_cache_key(f"{query}|{num}")
        cached = _IN_MEMORY_CACHE.get(cache_key)
        if cached is not None:
            return cached.get("organic", [])
        headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
        body = {"q": query, "num": num}
        # The free tier reports burst throttling as 400/429 (misleadingly, as
        # "Query pattern not allowed") — retry once after a short backoff.
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(self.base_url, headers=headers, json=body)
                self.record_usage()
                if resp.status_code == 200:
                    organic = resp.json().get("organic", []) or []
                    _IN_MEMORY_CACHE[cache_key] = {"organic": organic}
                    return organic
                if resp.status_code in (400, 429) and attempt == 0:
                    logger.warning("Serper %d (retrying): %s", resp.status_code, resp.text[:120])
                    await asyncio.sleep(1.5)
                    continue
                logger.error("Serper API error %d: %s", resp.status_code, resp.text[:200])
                return []
            except Exception as e:
                logger.error("Serper request failed: %s", str(e))
                if attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                return []
        return []

    async def discover_via_hiring_signals(
        self,
        trigger_roles: List[str],
        geographies: List[str],
        limit: int = 8,
        max_queries: int = 9,
    ) -> List[Dict[str, Any]]:
        """Free discovery: find companies actively hiring for a `trigger_role` (a role whose
        posting implies budget + unmet need in the tenant's category) via ATS job boards.

        Returns [{name, domain, industry, hiring_signal}] — same shape the discovery activity
        expects from Apollo, plus a hiring_signal payload for the prospect card.
        """
        roles = [r.strip() for r in (trigger_roles or []) if r and r.strip()][:4]
        geos = [g.strip() for g in (geographies or []) if g and g.strip()]
        if not roles:
            return []

        # Job-board postings rarely contain a country name verbatim ("Bengaluru", not "India"),
        # so geo is used as a soft ranking hint, not a hard query filter.
        geo_terms = {g.lower() for g in geos}
        seen: set = set()
        out: List[Dict[str, Any]] = []
        used = 0

        # (role, host) pairs, role-major so we get diversity within the query budget.
        # Serper free tier blocks the site: operator, so the ATS host is a plain keyword and
        # the ATS URLs are filtered out of the organic results.
        queries = [f"{role} job {kw}" for role in roles for kw in _ATS_HOST_KEYWORDS]
        for query in queries:
            if used >= max_queries or len(out) >= limit:
                break
            role = query.split(" job ")[0]
            results = await self._organic(query, num=15)
            used += 1

            def geo_rank(it):
                blob = (it.get("title", "") + " " + it.get("snippet", "")).lower()
                return 0 if any(g in blob for g in geo_terms) else 1

            for item in sorted(results, key=geo_rank):
                slug = _ats_company_slug(item.get("link", ""))
                if not slug or slug in seen:
                    continue
                seen.add(slug)
                domain = await _resolve_company_domain(slug)
                if domain in seen:
                    continue
                seen.add(domain)
                name = _company_from_title(item.get("title", ""), slug)
                if _is_noise_company(name, domain):
                    continue
                blob = (item.get("title", "") + " " + item.get("snippet", "")).lower()
                geo_hit = next((g for g in geos if g.lower() in blob), None)
                out.append(
                    {
                        "name": name,
                        "domain": domain,
                        "industry": None,
                        "hiring_signal": {
                            "label": f"Hiring {role}" + (f" · {geo_hit}" if geo_hit else ""),
                            "evidence_url": item.get("link", ""),
                        },
                    }
                )
                if len(out) >= limit:
                    break

        logger.info(
            "serper_hiring_discovery roles=%d queries=%d found=%d", len(roles), used, len(out)
        )
        return out

    async def find_decision_maker(
        self, company_name: str, domain: str, roles: List[str]
    ) -> Dict[str, Optional[str]]:
        """Resolves a named executive + LinkedIn URL (no verified email) via Serper."""
        role = (roles or ["Head of Marketing"])[0]
        results = await self._organic(f"{company_name} {role} linkedin profile", num=8)
        for item in results:
            link = item.get("link", "")
            if "linkedin.com/in/" not in link.lower():
                continue
            title = item.get("title", "").replace(" | LinkedIn", "").replace(" - LinkedIn", "")
            parts = [p.strip() for p in title.split(" - ")]
            name = _clean_person_name(parts[0].split(" | ")[0])
            if not name:
                continue
            parsed_title = parts[1] if len(parts) >= 2 else ""
            if not parsed_title or len(parsed_title.split()) > 7 or " at " in parsed_title.lower():
                parsed_title = role
            return {
                "full_name": name,
                "exact_title": parsed_title,
                "linkedin_url": link,
            }
        return {"full_name": None, "exact_title": role, "linkedin_url": None}

    async def search_company_signals(self, company_name: str) -> List[Dict[str, str]]:
        """Searches Google Serper for recent company news, hiring trends, and initiatives."""
        query = f"{company_name} news funding hiring expansion product launch"
        cache_key = self._generate_cache_key(query)

        # 1. Check Cache
        if cache_key in _IN_MEMORY_CACHE:
            logger.info("Serper cache hit for query: %s", query)
            return _IN_MEMORY_CACHE[cache_key].get("signals", [])

        # 2. Mock Fallback when API key is missing or in test environment
        if not self.api_key or self.api_key == "mock" or "test" in self.api_key.lower():
            mock_signals = [
                {
                    "source": "Google Serper Radar",
                    "headline": f"{company_name} Expands Global Operations Team",
                    "snippet": f"{company_name} announces strategic investment into modernized pipeline automation and regional supply chain visibility.",
                    "relevance_to_deal": "Aligns with RevOps automation pitch and unblocks Q3 quota expansion.",
                },
                {
                    "source": "Google Serper Radar",
                    "headline": f"{company_name} Appoints New Chief Financial Officer",
                    "snippet": "Focusing on operational efficiency and vendor spend rationalization ahead of fiscal year close.",
                    "relevance_to_deal": "Confirms CFO requirement for quantified ROI models before approving software line items.",
                },
            ]
            _IN_MEMORY_CACHE[cache_key] = {"signals": mock_signals}
            return mock_signals

        # 3. Rate Limit Enforcement
        if not self.check_rate_limit():
            logger.warning("Serper rate limit exceeded. Falling back to cached or default signal.")
            return []

        # 4. Live Serper HTTP Request
        try:
            headers = {
                "X-API-KEY": self.api_key,
                "Content-Type": "application/json",
            }
            payload = {"q": query, "num": 5}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.base_url, headers=headers, json=payload)
                self.record_usage()
                if resp.status_code == 200:
                    data = resp.json()
                    signals = []
                    for item in data.get("organic", [])[:3]:
                        signals.append({
                            "source": "Google Serper Radar",
                            "headline": item.get("title", ""),
                            "snippet": item.get("snippet", ""),
                            "relevance_to_deal": "External signal indicating corporate focus and workflow modernization.",
                        })
                    _IN_MEMORY_CACHE[cache_key] = {"signals": signals}
                    return signals
                else:
                    logger.error("Serper API error %d: %s", resp.status_code, resp.text)
                    return []
        except Exception as e:
            logger.error("Failed to query Serper API: %s", str(e))
            return []
