from supabase import create_client, Client
from app.settings import settings

supabase: Client = create_client(settings.SUPABASE_CLIENT_URL, settings.SUPABASE_ANON_KEY)