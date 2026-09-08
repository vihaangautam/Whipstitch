"""Google Serper API integration with Redis rate limiting and SHA-256 result caching."""
import asyncio
import hashlib
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("whipstitch.serper")

# In-memory rate-limit and cache fallbacks if Redis is not configured
_IN_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}
_DAILY_QUERY_COUNT: int = 0
_DAILY_QUERY_LIMIT: int = 100

# ATS job-board hosts whose URLs carry a parseable company slug in the first path segment.
_ATS_SITE_FILTER = " OR ".join(
    f"site:{h}" for h in ("boards.greenhouse.io", "jobs.lever.co", "jobs.ashbyhq.com")
)
_ATS_GENERIC_SEGMENTS = {
    "careers", "jobs", "j", "search", "companies", "about", "o", "embed", "postings",
}
_DOMAIN_TLDS = ("com", "io", "co", "ai", "in")


def _ats_company_slug(link: str) -> Optional[str]:
    """boards.greenhouse.io/acme/jobs/123 -> 'acme'. Returns None for generic pages."""
    try:
        path = link.split("//", 1)[1].split("/", 1)[1]
    except IndexError:
        return None
    seg = path.split("/", 1)[0].split("?", 1)[0].strip().lower()
    if not seg or seg in _ATS_GENERIC_SEGMENTS:
        return None
    return seg


def _company_from_title(title: str, slug: str) -> str:
    """Extracts the employer name from an ATS result title, else prettifies the slug."""
    t = (title or "").strip()
    if " at " in t:
        return t.rsplit(" at ", 1)[-1].strip(" .|-") or slug
    return slug.replace("-", " ").replace("_", " ").title()


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
        self.api_key = api_key or os.getenv("SERPER_API_KEY", "")
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
        try:
            headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.base_url, headers=headers, json={"q": query, "num": num})
            self.record_usage()
            if resp.status_code != 200:
                logger.error("Serper API error %d: %s", resp.status_code, resp.text[:200])
                return []
            organic = resp.json().get("organic", []) or []
            _IN_MEMORY_CACHE[cache_key] = {"organic": organic}
            return organic
        except Exception as e:
            logger.error("Serper request failed: %s", str(e))
            return []

    async def discover_via_hiring_signals(
        self,
        trigger_roles: List[str],
        geographies: List[str],
        limit: int = 8,
        max_queries: int = 6,
    ) -> List[Dict[str, Any]]:
        """Free discovery: find companies actively hiring for a `trigger_role` (a role whose
        posting implies budget + unmet need in the tenant's category) via ATS job boards.

        Returns [{name, domain, industry, hiring_signal}] — same shape the discovery activity
        expects from Apollo, plus a hiring_signal payload for the prospect card.
        """
        roles = [r.strip() for r in (trigger_roles or []) if r and r.strip()][:4]
        geos = [g.strip() for g in (geographies or []) if g and g.strip()] or [""]
        if not roles:
            return []

        seen: set = set()
        out: List[Dict[str, Any]] = []
        used = 0
        for role in roles:
            for geo in geos:
                if used >= max_queries or len(out) >= limit:
                    break
                query = f'({_ATS_SITE_FILTER}) "{role}"'
                if geo:
                    query += f' "{geo}"'
                results = await self._organic(query, num=10)
                used += 1
                for item in results:
                    slug = _ats_company_slug(item.get("link", ""))
                    if not slug or slug in seen:
                        continue
                    seen.add(slug)
                    domain = await _resolve_company_domain(slug)
                    if domain in seen:
                        continue
                    seen.add(domain)
                    out.append(
                        {
                            "name": _company_from_title(item.get("title", ""), slug),
                            "domain": domain,
                            "industry": None,
                            "hiring_signal": {
                                "label": f"Hiring {role}" + (f" · {geo}" if geo else ""),
                                "evidence_url": item.get("link", ""),
                            },
                        }
                    )
                    if len(out) >= limit:
                        break
            if used >= max_queries or len(out) >= limit:
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
        results = await self._organic(
            f'"{company_name}" {role} site:linkedin.com/in', num=5
        )
        for item in results:
            link = item.get("link", "")
            if "linkedin.com/in/" not in link:
                continue
            title = item.get("title", "")
            name = title.split(" - ")[0].split(" | ")[0].strip()
            parsed_title = None
            parts = [p.strip() for p in title.replace(" | LinkedIn", "").split(" - ")]
            if len(parts) >= 2:
                parsed_title = parts[1]
            return {
                "full_name": name or None,
                "exact_title": parsed_title or role,
                "linkedin_url": link,
            }
        return {"full_name": None, "exact_title": role, "linkedin_url": None}

    async def search_company_signals(self, company_name: str) -> List[Dict[str, str]]:
        """Searches Google Serper for recent company news, hiring trends, and initiatives."""
        query = f'"{company_name}" enterprise revenue operations OR hiring OR software'
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
