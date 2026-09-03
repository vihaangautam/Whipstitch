"""Unit tests for Document & Transcript Parser."""
import pytest
from app.services.parsing.document_parser import document_parser


def test_vtt_parsing_cleans_timestamps_and_headers():
    vtt_sample = """WEBVTT

1
00:00:01.000 --> 00:00:04.000
Alex: Thanks for joining today's executive briefing.

2
00:00:04.500 --> 00:00:08.200
Sarah: Happy to be here. We are losing $150k annually on unrouted leads.
"""
    cleaned = document_parser.parse_vtt_or_srt(vtt_sample)
    assert "WEBVTT" not in cleaned
    assert "-->" not in cleaned
    assert "Alex: Thanks for joining today's executive briefing." in cleaned
    assert "Sarah: Happy to be here. We are losing $150k annually on unrouted leads." in cleaned


def test_plain_text_parsing():
    raw = b"Sales Call Notes\nCustomer expressed strong interest in API integration."
    parsed = document_parser.parse_plain_text(raw)
    assert "Sales Call Notes" in parsed
    assert "API integration" in parsed


def test_file_extension_routing():
    content = b"Simple transcript notes"
    parsed_txt = document_parser.parse_file("meeting_notes.txt", content)
    assert parsed_txt == "Simple transcript notes"
