import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project-id.supabase.co")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "your-anon-key")
SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "packsmart-secret-key-sih2026")

PORT: int = int(os.getenv("PORT", "8000"))
HOST: str = os.getenv("HOST", "0.0.0.0")

# Determine if Supabase URL & Key are real or placeholder
IS_SUPABASE_CONFIGURED: bool = bool(
    SUPABASE_URL 
    and "your-project-id" not in SUPABASE_URL 
    and "<your-project-id>" not in SUPABASE_URL
    and SUPABASE_KEY 
    and "your-service-role" not in SUPABASE_KEY
    and "<your-service-role-key>" not in SUPABASE_KEY
)

supabase = None
if IS_SUPABASE_CONFIGURED:
    try:
        from supabase import create_client, Client
        supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[Supabase] Warning initializing live client: {e}. Falling back to local data layer.")
        supabase = None
else:
    print("[Supabase] Running in Local Evaluation / Standalone Mode (Valid for SIH Demo & Offline Evaluation).")
