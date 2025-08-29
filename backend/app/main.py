from io import BytesIO

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.db import SessionLocal, Base, engine
from app.db.chroma_client import collection
from app.settings import settings
from app.routes import auth, documents, chat

import google.generativeai as genai

app = FastAPI(title="AI Multi-Doc Q&A Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=settings.GOOGLE_API_KEY,)

app.include_router(auth.router, prefix="/auth")
app.include_router(documents.router, prefix="/documents")
app.include_router(chat.router, prefix="/chat")
