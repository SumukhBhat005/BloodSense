"""
PDF renderer — converts PDF pages to PNG images for Gemini Vision.
Uses pymupdf (fitz) for high-quality rendering.
"""
import fitz  # pymupdf
import io
from PIL import Image


def pdf_to_images(pdf_bytes: bytes, dpi: int = 200) -> list[bytes]:
    """
    Convert each page of a PDF to a PNG image.
    Returns a list of PNG image bytes (one per page, max 5 pages).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []

    # Cap at 5 pages to control Gemini API costs
    max_pages = min(len(doc), 5)

    for page_num in range(max_pages):
        page = doc[page_num]
        # Render at specified DPI for good OCR quality
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        images.append(img_bytes)

    doc.close()
    return images


def get_pdf_text(pdf_bytes: bytes) -> str:
    """
    Extract embedded text from PDF directly (fast, no OCR needed).
    Returns empty string if no text layer.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts).strip()
