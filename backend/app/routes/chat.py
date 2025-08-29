from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse

import google.generativeai as genai
import asyncio
import json
from app.utils import get_current_user
from app.settings import settings
from app.db.chroma_client import collection

router = APIRouter()

@router.post("/")
async def chat(
    user_id: str = Depends(get_current_user),
    request: Request = None
):
    """
    Handles a user's chat question.
    1. Queries a vector store for relevant documents (RAG).
    2. Streams a response from the Gemini model.
    """
    body = await request.json()
    question = body.get("question")

    results = collection.query(
        query_texts=[question],
        n_results=settings.RAG_TOP_K,
        where={"user_id": user_id}
    )

    context_docs = []
    if results["documents"]:
        for i, doc_text in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i]
            snippet = doc_text[:200].replace("\n", " ")  # keep it single-line
            context_docs.append(
                f"[DOC {i}]\nFilename: {meta['filename']}\nDoc ID: {meta['doc_id']}\nSnippet: {snippet}\nFull Text:\n{doc_text}"
            )


    context = "\n\n".join(context_docs)
    prompt = f"""
        Answer the question based on these documents:

        {context}

        Question: {question}

        Instructions:
        - Whenever you reference a document, include a line exactly like this:
        [__CITATIONS__]{{"doc_id": "...", "filename": "...", "snippet": "..."}}  
        for the document(s) you used to produce the answer. Do NOT invent filenames, IDs, or any content outside of these documents.
        - Do NOT reference any document not included above.
        - Remove all [__CITATIONS__] lines from the answer text. They should only be emitted as separate citation messages.
        - Answer concisely and clearly, and include citations only when necessary.
    """

    # stream the answer from Gemini    
    async def event_stream():
        buffer = ""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            stream = await model.generate_content_async(
                prompt,
                stream=True,
            )

            await asyncio.sleep(0.01)
            
            async for chunk in stream:
                if await request.is_disconnected():
                    print("Client disconnected. Cancelling stream...")
                    break

                if chunk.text:
                    buffer += chunk.text

                    # process all complete citations in buffer
                    while "[__CITATIONS__]" in buffer:
                        before, after = buffer.split("[__CITATIONS__]", 1)
                        if before.strip():
                            yield json.dumps({"type": "chunk", "data": before.strip()}) + "\n"
                        try:
                            end_idx = after.index("}") + 1
                            citation_json = after[:end_idx]
                            citation = json.loads(citation_json)
                            yield json.dumps({"type": "citations", "data": citation}) + "\n"
                            buffer = after[end_idx:]
                        except ValueError:
                            # incomplete citation, wait for next chunk
                            buffer = "[__CITATIONS__]" + after
                            break

            # flush remaining text
            if buffer.strip():
                yield json.dumps({"type": "chunk", "data": buffer.strip()}) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"
    return StreamingResponse(event_stream(), media_type="text/plain")