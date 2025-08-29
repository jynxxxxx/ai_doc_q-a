import chromadb
from chromadb.utils import embedding_functions
from app.settings import settings
import google.generativeai as genai

genai.configure(api_key=settings.GOOGLE_API_KEY)

# currently using in-memory chroma, switch to persistent by changing client in production
client = chromadb.Client()

embedding_fn = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
    api_key=settings.GOOGLE_API_KEY,
    model_name="text-embedding-004",
)

collection = client.get_or_create_collection(
    name="documents",
    embedding_function=embedding_fn,
)

