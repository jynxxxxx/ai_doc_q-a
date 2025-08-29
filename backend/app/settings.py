from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Gemini
    GOOGLE_API_KEY: str = ""

    # Supabase
    SUPABASE_DB_URL: str 
    SUPABASE_JWT_SECRET: str = "devsecret"
    SUPABASE_ANON_KEY: str
    SUPABASE_CLIENT_URL: str 
    SUPABASE_BUCKET: str = "documents"
    
    # Chroma server
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000

    # RAG params
    RAG_TOP_K: int = 6
    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200

    class Config:
        env_file = ".env"


settings = Settings()