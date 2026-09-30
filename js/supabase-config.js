/**
 * PackSmart AI — Supabase JS Client Configuration
 * Smart India Hackathon 2026 | PS: SIH26236
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Supabase project credentials (can be set via Settings, localStorage, or hardcoded below)
const storedUrl = typeof localStorage !== "undefined" ? localStorage.getItem("packsmart_supabase_url") : null;
const storedKey = typeof localStorage !== "undefined" ? localStorage.getItem("packsmart_supabase_anon_key") : null;

const SUPABASE_URL = (storedUrl || (typeof window !== "undefined" && window.PACKSMART_SUPABASE_URL) || "https://your-project-id.supabase.co").trim();
const SUPABASE_ANON_KEY = (storedKey || (typeof window !== "undefined" && window.PACKSMART_SUPABASE_ANON_KEY) || "your-anon-key-here").trim();

export const IS_LIVE_SUPABASE = Boolean(
    SUPABASE_URL && 
    !SUPABASE_URL.includes("your-project-id") &&
    !SUPABASE_URL.includes("<your-project-id>") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("your-anon-key") &&
    !SUPABASE_ANON_KEY.includes("<your-anon-key>")
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
