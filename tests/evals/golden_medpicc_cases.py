"""Golden-dataset fixtures for the MEDDPICC eval harness.

Each case is a real (hand-written, not scraped) call transcript paired with the invariant
the actual product design claims to guarantee — the Rule 6.2 / 6.7 hard caps and the
Hinglish verbatim-preservation rule documented in `app/core/prompts/medpicc_prompts.py`
and CLAUDE.md. These are properties of the *scoring rubric*, checkable regardless of which
LLM answers, which is what makes them useful as regression cases instead of one-off vibes.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class GoldenCase:
    name: str
    deal_tier: str
    transcript_text: str
    # Loose bounds, not exact-match — LLM output varies run to run even at temperature 0.
    min_score: Optional[int] = None
    max_score: Optional[int] = None
    expect_eb_hard_cap: Optional[bool] = None
    expect_champion_hard_cap: Optional[bool] = None
    must_preserve_verbatim: list = field(default_factory=list)
    notes: str = ""


GOLDEN_CASES = [
    GoldenCase(
        name="strong_founder_committed_deal",
        deal_tier="Tier 1: Founder-Led SMB",
        transcript_text="""
Rep: Thanks for hopping on, Priya. Last time we spoke you mentioned the manual reconciliation
process was costing you real time.
Priya (Founder): Haan yaar, seriously — my ops team spends like 4 hours a day just matching
invoices by hand, and we're losing maybe 2 lakh rupees a month in errors and late fees.
Rep: If we could cut that to under 30 minutes a day, would that change your Q3 plans?
Priya (Founder): Absolutely. Look, main khud decision leta hoon yahan, there's no board to
check with. If your demo next week shows it actually works on our invoice format, main 15
Lakh approve kar raha hoon on the spot, bas SOW bhej do saath mein.
Rep: That's great to hear. Who else needs to sign off before we can start?
Priya (Founder): Nobody. Jo main bolti hoon woh final hota hai in this company. Just get me
the contract.
Rep: Perfect, I'll have legal send the SOW by Friday. Any concerns about switching from your
current spreadsheet process?
Priya (Founder): Only that my ops lead, Rohan, needs to be trained fast — he's the one who'll
actually use it daily, and he's already pushing me to move quickly because he's drowning.
""",
        min_score=65,
        expect_eb_hard_cap=False,
        expect_champion_hard_cap=False,
        notes="Founder is the verified economic buyer with direct verbal commitment — no hard cap should apply.",
    ),
    GoldenCase(
        name="unverified_economic_buyer",
        deal_tier="Tier 1: Founder-Led SMB",
        transcript_text="""
Rep: Sanjay, walk me through how a purchase like this usually gets approved on your side.
Sanjay (Ops Manager): Honestly, I really like what I've seen, the demo solved exactly the
reconciliation headache I've been complaining about for months.
Rep: Great to hear. Is there budget already set aside for a tool like this?
Sanjay (Ops Manager): Not that I know of. I'd need to bring this to our founder, Aditi — she
keeps a really tight handle on spending and I've never actually gotten budget approved without
her sitting in the room herself.
Rep: Could we get 15 minutes with her this week?
Sanjay (Ops Manager): I can try, but she's been pretty hard to pin down lately, she's heads-down
on fundraising. I'll ask, no promises though.
Rep: Understood. In the meantime, what's the actual daily cost of the manual process for you?
Sanjay (Ops Manager): It's annoying but I don't have exact numbers, maybe an hour or two a day
across the team.
""",
        expect_eb_hard_cap=True,
        max_score=55,
        notes="No founder access, no confirmed authority, vague pain — Rule 6.2 should cap Economic Buyer.",
    ),
    GoldenCase(
        name="enthusiastic_champion_no_committee_access",
        deal_tier="Tier 3: Enterprise MNC",
        transcript_text="""
Rep: David, thanks for championing this internally. Linda, thanks for joining as well.
Linda (CFO): Happy to hop on for a few minutes. David's been keeping me in the loop and I
wanted to confirm directly: once procurement finishes the standard SOC2 security review,
I will personally approve the $180k contract. Get me that report and I'll sign this week.
Rep: That's great to hear directly from you, Linda. David, when you present internally,
who else is in the room?
David (Sr. Analyst): Honestly, outside of this call, I'm not really in those meetings.
I don't have a direct line to our VP of Engineering or the Security committee — I just hear
secondhand what they decided. I've never actually presented to them myself.
Rep: Got it. Do you know what specifically the security committee is looking for?
David (Sr. Analyst): Not exactly, I just forward whatever your team sends me and hope for the
best.
""",
        expect_eb_hard_cap=False,
        expect_champion_hard_cap=True,
        notes="Economic Buyer (Linda, CFO) personally confirmed on the call - no EB cap. David has zero committee access despite enthusiasm - Rule 6.7 should cap Champion.",
    ),
    GoldenCase(
        name="hinglish_founder_commitment_preserved",
        deal_tier="Tier 1: Founder-Led SMB",
        transcript_text="""
Rep: Rajesh ji, aapko demo kaisa laga?
Rajesh (Founder): Bahut accha laga yaar, genuinely impressed. Dekho, main clearly bata deta hoon
- Diwali se pehle humein yeh system chahiye kyunki peak season mein order volume 3x ho jaata hai
aur abhi hum manually track kar rahe hain, bahut mistakes ho rahi hain.
Rep: Understood, timing is critical then.
Rajesh (Founder): Bilkul. Main 15 Lakh approve kar raha hoon, bas advance PO pending hai from
my side, do din mein bhej dunga. Koi aur approval nahi chahiye, main hi final decision maker
hoon yahan.
Rep: That's great to hear. Any concerns before we finalize the SOW?
Rajesh (Founder): Bas ek cheez - onboarding fast honi chahiye, kyunki Diwali sales start hone
wale hain agle mahine.
""",
        min_score=60,
        expect_eb_hard_cap=False,
        must_preserve_verbatim=[
            "main 15 lakh approve kar raha hoon",
        ],
        notes="Rule 1.2: the Hinglish commitment must appear verbatim in an evidence quote, not translated into formal English.",
    ),
    GoldenCase(
        name="weak_early_discovery_no_urgency",
        deal_tier="Tier 1: Founder-Led SMB",
        transcript_text="""
Rep: Thanks for the intro call. What made you take this meeting?
Contact: Honestly someone on my team saw your ad and thought we should take a look, nothing
urgent on our end.
Rep: Sure, what's not working well with your current process?
Contact: It's fine I guess, a bit slow sometimes but we've been doing it this way for years.
Rep: Is there a budget or timeline you're working against?
Contact: Not really, no rush. Maybe next year if it comes up in planning.
Rep: Who else would be involved if you did move forward?
Contact: Not sure honestly, we haven't really talked about it internally.
""",
        max_score=40,
        expect_eb_hard_cap=True,
        notes="No pain quantified, no urgency, no named buyer or champion - should score low across the board.",
    ),
]
