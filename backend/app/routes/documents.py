from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.responses import JSONResponse, StreamingResponse

from app.models import Document
from app.utils import extract_text_from_file, chunk_text

from app.db.chroma_client import collection
from app.settings import settings
from app.db.db import get_db
from app.db.sb_client import supabase
from app.utils import get_current_user
import uuid
from io import BytesIO

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file and save its metadata in the database.
    Reads user_id from cookie to associate uploaded file with the user.
    """
    try:
        file_id = str(uuid.uuid4())
        path = f"documents/{user_id}/{file_id}_{file.filename}"
        data = await file.read()

        try:
            upload = supabase.storage.from_(settings.SUPABASE_BUCKET).upload(path, data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Supabase upload failed: {e}")

        # Save doc metadata
        doc = Document(user_id=user_id, filename=file.filename, filepath=str(path))
        db.add(doc)
        await db.commit()

        await db.refresh(doc)

        try:
            file.file.seek(0)
            text = extract_text_from_file(file)
            if not text:
                raise HTTPException(400, "No text could be extracted from the file")
        except Exception as e:
            raise HTTPException(400, f"Text extraction failed: {e}")

        # Add to Chroma
        try:
            chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
            for i, chunk in enumerate(chunks):
                collection.add(
                    documents=[chunk],
                    metadatas=[{"user_id": user_id, "doc_id": doc.id, "filename": file.filename}],
                    ids=[f"{user_id}_{doc.id}_{i}"]
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Chroma add failed: {e}")

        return {"user_id": user_id, "doc_id": doc.id, "filename": file.filename}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"error": e.detail})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/")
async def list_documents( user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.user_id == user_id))
    docs = res.scalars().all()
    return [{"id": d.id, "filename": d.filename} for d in docs]


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id==doc_id, Document.user_id==user_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from Chroma
    collection.delete(where={"doc_id": doc.id})

    # Delete from Supabase Storage
    supabase.storage.from_("documents").remove([doc.filepath])

    # Delete metadata
    await db.delete(doc)
    await db.commit()
    return {"detail": "Document deleted"}

@router.get("/{doc_id}")
async def get_document(doc_id: int, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id==doc_id, Document.user_id==user_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_res = supabase.storage.from_("documents").download(doc.filepath)
    if not file_res:
        raise HTTPException(status_code=500, detail=f"Could not download {doc.filepath}")

    return StreamingResponse(
        BytesIO(file_res),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={doc.filename}"}
    )


@router.get("/{doc_id}/text")
async def get_document_text(doc_id: int, user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id==doc_id, Document.user_id==user_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_res = supabase.storage.from_("documents").download(doc.filepath)
    if not file_res:
        raise HTTPException(status_code=500, detail=f"Could not download {doc.filepath}")
    
    bytes_wrapper = BytesIO(file_res)
    file_imitator = UploadFile(filename=doc.filename, file=bytes_wrapper)

    text = extract_text_from_file(file_imitator)

    if not text:
        raise HTTPException(400, "No text could be extracted from the file")
    
    return {"text": text, "filename": doc.filename}