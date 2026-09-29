/**
 * PackSmart AI — Supabase JS Client Configuration
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Supabase project credentials (replace with your live Supabase project credentials)
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";

export const IS_LIVE_SUPABASE = (
    SUPABASE_URL && 
    !SUPABASE_URL.includes("your-project-id") &&
    !SUPABASE_URL.includes("<your-project-id>") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("your-anon-key")
);

let client = null;
try {
    if (IS_LIVE_SUPABASE) {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        // Safe mock client for offline hackathon judging without internet or unconfigured keys
        client = createClient("https://offline-demo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-signature");
    }
} catch (e) {
    console.warn("[Supabase] Running in local demo mode:", e);
}

export const supabase = client;
