"""LLM eval harness: does the MEDDPICC rubric hold up against real transcripts?

Not part of `tests/unit` and not run by CI on every push (see .github/workflows/ci.yml —
it only runs `tests/unit`). This makes real LLM calls, costs real tokens, and takes real
wall-clock time; it belongs in a slower, explicitly-triggered pass, the same way most teams
run evals nightly rather than per-commit. Run it directly with:

    python -m pytest tests/evals -v

It answers a different question than a unit test. A unit test with a mocked LLM response
proves the *code* handles a given response correctly. It cannot tell you whether the model
actually applies Rule 6.2 (Economic Buyer hard cap), preserves Hinglish verbatim (Rule 1.2),
or invents evidence quotes that were never in the transcript — those are properties of the
prompt + model, not the Python around it, and the only way to check them is to actually call
the LLM and inspect what comes back. `app/core/llm_router.py`'s deterministic mock fallback
returns the exact same fixed scorecard regardless of input, so it can't exercise any of this
either — hence a real provider is required and the suite skips cleanly without one.
"""
import difflib
import re

import pytest

from app.core.config import settings
from app.core.llm_router import llm_router
from app.core.prompts.medpicc_prompts import MEDPICC_SYSTEM_PROMPT, build_medpicc_prompt, get_tier_weights_and_caps
from app.models.medpicc_schemas import QualificationModel
from tests.evals.golden_medpicc_cases import GOLDEN_CASES


def _has_real_llm_key() -> bool:
    for key in (settings.GEMINI_API_KEY, settings.GROQ_API_KEY, settings.OPENAI_API_KEY):
        if key and "mock" not in key.lower():
            return True
    return False


pytestmark = pytest.mark.skipif(
    not _has_real_llm_key(),
    reason="No real GEMINI_API_KEY/GROQ_API_KEY/OPENAI_API_KEY configured — "
    "the eval needs a real model response, the deterministic mock can't exercise it.",
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _best_match_ratio(quote: str, transcript: str) -> float:
    """Highest similarity between the quote and any equal-length window of the transcript.

    A plain substring check is too strict — models legitimately trim trailing punctuation
    or a stray "..." — but a wholesale-invented quote won't come close to any real window.
    """
    q = _normalize(quote)
    t = _normalize(transcript)
    if q in t:
        return 1.0
    window = len(q)
    best = 0.0
    step = max(1, window // 4)
    for i in range(0, max(1, len(t) - window), step):
        ratio = difflib.SequenceMatcher(None, q, t[i : i + window]).ratio()
        best = max(best, ratio)
    return best


async def _run_case(case) -> QualificationModel:
    prompt = build_medpicc_prompt(
        deal_name="Eval Deal",
        company_name="Eval Co",
        transcript_text=case.transcript_text,
        deal_context={},
        tenant_track="Service / Retainer",
        deal_tier=case.deal_tier,
        deal_currency="INR",
    )
    qualification, model_used = await llm_router.call_structured_llm(
        tenant_id="trifid_media",
        system_prompt=MEDPICC_SYSTEM_PROMPT,
        user_prompt=prompt,
        response_model=QualificationModel,
        feature="medpicc_eval",
    )
    assert model_used != "mock-deterministic-v1", (
        f"{case.name}: fell through to the static mock — no real provider actually answered, "
        "so none of this case's assertions would mean anything."
    )
    return qualification


def _box(qualification: QualificationModel, name: str):
    for b in qualification.value_selling_boxes:
        if b.box == name:
            return b
    raise AssertionError(f"MEDDPICC response is missing the '{name}' box entirely")


@pytest.mark.asyncio
@pytest.mark.parametrize("case", GOLDEN_CASES, ids=[c.name for c in GOLDEN_CASES])
async def test_golden_case(case):
    qualification = await _run_case(case)

    if case.min_score is not None:
        assert qualification.overall_qualification_score_0_100 >= case.min_score, (
            f"{case.name}: scored {qualification.overall_qualification_score_0_100}, "
            f"expected >= {case.min_score}. {case.notes}"
        )
    if case.max_score is not None:
        assert qualification.overall_qualification_score_0_100 <= case.max_score, (
            f"{case.name}: scored {qualification.overall_qualification_score_0_100}, "
            f"expected <= {case.max_score}. {case.notes}"
        )

    if case.expect_eb_hard_cap is not None:
        eb = _box(qualification, "Economic Buyer")
        caps = get_tier_weights_and_caps(case.deal_tier)
        if case.expect_eb_hard_cap:
            assert eb.hard_cap_applied, f"{case.name}: expected Rule 6.2 EB hard cap. {case.notes}"
            assert eb.score <= caps["eb_cap"], (
                f"{case.name}: EB scored {eb.score}, tier cap is {caps['eb_cap']}"
            )
        else:
            assert not eb.hard_cap_applied, f"{case.name}: EB hard cap applied but shouldn't be. {case.notes}"

    if case.expect_champion_hard_cap is not None:
        champion = _box(qualification, "Champion")
        caps = get_tier_weights_and_caps(case.deal_tier)
        if case.expect_champion_hard_cap:
            assert champion.hard_cap_applied, f"{case.name}: expected Rule 6.7 Champion hard cap. {case.notes}"
            assert champion.score <= caps["champ_cap"], (
                f"{case.name}: Champion scored {champion.score}, tier cap is {caps['champ_cap']}"
            )
        else:
            assert not champion.hard_cap_applied, f"{case.name}: Champion hard cap applied but shouldn't be."

    for phrase in case.must_preserve_verbatim:
        all_quotes = " ".join(
            q.quote for box in qualification.value_selling_boxes for q in box.evidence_quotes
        )
        assert _normalize(phrase) in _normalize(all_quotes), (
            f"{case.name}: expected the Hinglish phrase {phrase!r} preserved verbatim in an "
            f"evidence quote, but no quote contained it. Rule 1.2 forbids translating "
            f"code-switched speech into formal English."
        )

    # Universal anti-hallucination check, every case: a "direct" evidence quote is a claim
    # that this exact thing was said. If it doesn't resemble anything in the transcript, the
    # model invented it — the single most damaging failure mode for a tool selling "verified
    # buyer evidence" as its core differentiator.
    for box in qualification.value_selling_boxes:
        if box.evidence_basis != "direct":
            continue
        for q in box.evidence_quotes:
            ratio = _best_match_ratio(q.quote, case.transcript_text)
            assert ratio >= 0.5, (
                f"{case.name}: box '{box.box}' cites a 'direct' quote with no resemblance "
                f"(best match {ratio:.2f}) to anything in the transcript — likely fabricated: "
                f"{q.quote!r}"
            )
