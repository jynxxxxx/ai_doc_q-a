from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.settings import settings

# convert to subapase postresql URL to asyncpg
ASYNC_SUPABASE_DB_URL = settings.SUPABASE_DB_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(ASYNC_SUPABASE_DB_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

# create or get DB
async def get_db():
    async with SessionLocal() as session:
        yield session