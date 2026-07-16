import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(
  url && key && !key.includes("PASTE_THE_SUPABASE"),
);

export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 5 } },
  },
);

export type SmartWattDevice = {
  device_code: string;
  device_name: string | null;
  desired_state: boolean;
  actual_state: boolean;
  online: boolean;
  created_at: string;
  updated_at: string;
  device_auth_id: string | null;
};
