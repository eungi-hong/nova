import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = isConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : (createClient("https://placeholder.supabase.co", "placeholder-anon-key") as SupabaseClient);

export const PHOTO_BUCKET = "entry-photos";
export const AUDIO_BUCKET = "entry-audio";
