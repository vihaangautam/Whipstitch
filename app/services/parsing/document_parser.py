"""Document & Transcript Parser supporting TXT, VTT, SRT, DOCX, and PDF formats."""
import io
import re
from typing import Optional
from pypdf import PdfReader
import docx

from app.core.logging import get_logger

logger = get_logger(__name__)


class DocumentParser:
    """Parses various document and transcript formats into clean text."""

    @staticmethod
    def parse_plain_text(content: bytes) -> str:
        """Decodes plain text / markdown bytes."""
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1", errors="ignore")

    @staticmethod
    def parse_vtt_or_srt(content: str) -> str:
        """Strips subtitle timestamps and cleans transcript dialogue."""
        lines = content.splitlines()
        clean_lines = []
        for line in lines:
            line_str = line.strip()
            # Skip WebVTT header, index numbers, and timestamp lines (e.g. 00:00:10.000 --> 00:00:15.000)
            if not line_str or line_str == "WEBVTT" or line_str.isdigit():
                continue
            if re.match(r"^\d{1,2}:\d{2}(:\d{2})?(\.\d{1,3})?\s*-->\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{1,3})?", line_str):
                continue
            clean_lines.append(line_str)
        return "\n".join(clean_lines)

    @staticmethod
    def parse_docx(content: bytes) -> str:
        """Extracts text paragraphs and tables from a DOCX file."""
        doc = docx.Document(io.BytesIO(content))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    full_text.append(row_text)
        return "\n".join(full_text)

    @staticmethod
    def parse_pdf(content: bytes) -> str:
        """Extracts text across all pages in a PDF file."""
        reader = PdfReader(io.BytesIO(content))
        pages_text = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages_text.append(text.strip())
        return "\n\n".join(pages_text)

    @classmethod
    def parse_file(cls, filename: str, content: bytes) -> str:
        """Detects extension and parses file content accordingly."""
        ext = filename.lower().split(".")[-1] if "." in filename else "txt"
        logger.info("parsing_transcript_file", filename=filename, extension=ext, size_bytes=len(content))

        if ext in ["txt", "text", "md", "json"]:
            return cls.parse_plain_text(content)
        elif ext in ["vtt", "srt"]:
            raw = cls.parse_plain_text(content)
            return cls.parse_vtt_or_srt(raw)
        elif ext in ["docx", "doc"]:
            return cls.parse_docx(content)
        elif ext == "pdf":
            return cls.parse_pdf(content)
        else:
            # Fallback to plain text attempt
            return cls.parse_plain_text(content)


# Global Parser Instance
document_parser = DocumentParser()
