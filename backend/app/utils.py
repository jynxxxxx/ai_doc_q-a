import re
import fitz
import docx
from fastapi import UploadFile, HTTPException, Request
from io import BytesIO
from app.settings import settings
import jwt  # PyJWT
from typing import Optional


async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing access_token cookie")

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}  # Supabase-specific
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {e}")

def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200):
    """
    Splits a long text into overlapping chunks.
    chunk_size: number of characters per chunk
    overlap: number of overlapping characters between chunks
    """
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap  # move forward but keep overlap
    
    return chunks

def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from PDF or DOCX directly from BytesIO."""
    content = BytesIO(file.file.read())
    text = ""

    if file.filename.lower().endswith(".pdf"):
        doc = fitz.open(stream=content.read(), filetype="pdf")
        for page in doc:
            text += page.get_text()
    elif file.filename.lower().endswith(".docx"):
        doc = docx.Document(content)
        for para in doc.paragraphs:
            text += para.text + "\n"
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return text.strip()