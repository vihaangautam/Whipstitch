"""Overrides tests/conftest.py's autouse `_no_external_apis` fixture for this directory only.

That fixture exists precisely so `tests/unit` never makes a real network call — correct
there. It is also autouse, so it applies here too by default and would monkeypatch away
the real GEMINI_API_KEY/GROQ_API_KEY before every eval test runs, silently forcing the
"no real key" skip condition regardless of what's actually in the environment. The whole
point of this directory is to call a real provider, so it needs the real keys restored.
"""
import pytest

from app.core.config import settings

_REAL_KEYS = {
    "GEMINI_API_KEY": settings.GEMINI_API_KEY,
    "GROQ_API_KEY": settings.GROQ_API_KEY,
    "OPENAI_API_KEY": settings.OPENAI_API_KEY,
}


@pytest.fixture(autouse=True)
def _restore_real_llm_keys(monkeypatch):
    for key, value in _REAL_KEYS.items():
        monkeypatch.setattr(settings, key, value, raising=False)
