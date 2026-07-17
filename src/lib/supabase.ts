import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key && !key.includes("PASTE_THE_SUPABASE"));

class DynamicStorage {
  private getStorage(): Storage {
    if (typeof window === "undefined") {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      } as Storage;
    }
    const rememberMe = localStorage.getItem("sw.remember_me") === "true";
    return rememberMe ? localStorage : sessionStorage;
  }

  getItem(key: string): string | null {
    const store = this.getStorage();
    const val = store.getItem(key);
    if (val !== null) return val;
    // Safe transition fallback
    const otherStore = store === localStorage ? sessionStorage : localStorage;
    return otherStore.getItem(key);
  }

  setItem(key: string, value: string): void {
    const store = this.getStorage();
    const otherStore = store === localStorage ? sessionStorage : localStorage;
    otherStore.removeItem(key);
    store.setItem(key, value);
  }

  removeItem(key: string): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
}

export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: new DynamicStorage(),
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
