import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import {
  Loader2,
  Wifi,
  WifiOff,
  Power,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  Zap,
} from "lucide-react";

import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { LegalModal } from "@/components/legal-modal";
import type { LegalDoc } from "@/lib/legal";

// Import Redesigned Premium Cards
import { HeroBulbCard } from "@/components/HeroBulbCard";
import { DeviceHealthCard } from "@/components/DeviceHealthCard";
import { CypherCard } from "@/components/CypherCard";
import { ActivityTimelineCard } from "@/components/ActivityTimelineCard";
import { QuickActionsCard } from "@/components/QuickActionsCard";

// Import integrated global Cypher hook for the embedded card context
import { useCypher } from "@/cypher/hooks/useCypher";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SMART WATT — Premium Control Center" },
      {
        name: "description",
        content:
          "Control your BULB with SMART WATT — a premium connected device-control platform by NoskyTech.",
      },
    ],
  }),
  component: SmartWattPage,
});

const DEVICE_CODE = "SW-0001";
const CMD_TIMEOUT_MS = 12000;

type DeviceStatus =
  | { kind: "loading" }
  | { kind: "ready"; device: SmartWattDevice }
  | { kind: "missing" }
  | { kind: "error"; message: string };

function formatTime(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/* ------------------------- Sign In ------------------------- */

function SignIn({ onLegal }: { onLegal: (d: LegalDoc["id"]) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Authentication failed";
      console.error("[SmartWatt] auth error", e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-glow">
          <Zap className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-widest text-foreground">
          SMART WATT
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Powered by NoskyTech
        </p>
      </div>

      <form onSubmit={submit} className="glass rounded-[24px] border border-white/10 p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Sign in</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Authenticated access only. No anonymous relay control.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-border bg-background/40 px-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
        </div>

        {err && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          By signing in, you agree to the SMART WATT{" "}
          <button
            type="button"
            onClick={() => onLegal("terms")}
            className="text-primary hover:underline"
          >
            Terms of Use
          </button>{" "}
          and acknowledge the{" "}
          <button
            type="button"
            onClick={() => onLegal("privacy")}
            className="text-primary hover:underline"
          >
            Privacy Policy
          </button>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        © 2026 NoskyTech. All rights reserved.
      </p>
    </div>
  );
}

/* ------------------------- Control Page ------------------------- */

function SmartWattPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState<DeviceStatus>({ kind: "loading" });
  const [sending, setSending] = useState(false);
  const [cmdError, setCmdError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [legal, setLegal] = useState<LegalDoc["id"] | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cmdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCmdRef = useRef<{ desired: boolean; at: number } | null>(null);

  // Initialize embedded Cypher voice assistant context
  const cypher = useCypher(!!session);

  // Session tracking
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function fetchDevice() {
    const { data, error } = await supabase
      .from("smart_watt_devices")
      .select("*")
      .eq("device_code", DEVICE_CODE)
      .maybeSingle();
    if (error) {
      console.error("[SmartWatt] fetch error", error);
      setStatus((prev) =>
        prev.kind === "ready" ? prev : { kind: "error", message: error.message },
      );
      return;
    }
    if (!data) {
      setStatus({ kind: "missing" });
      return;
    }
    setStatus({ kind: "ready", device: data as SmartWattDevice });
  }

  // Data + realtime lifecycle (only when authenticated)
  useEffect(() => {
    if (!supabaseConfigured || !session) return;
    let cancelled = false;
    fetchDevice();

    const channel = supabase
      .channel(`smart_watt_${DEVICE_CODE}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "smart_watt_devices",
          filter: `device_code=eq.${DEVICE_CODE}`,
        },
        (payload) => {
          if (cancelled) return;
          const next = payload.new as SmartWattDevice | undefined;
          if (next && next.device_code === DEVICE_CODE) {
            setStatus({ kind: "ready", device: next });
          }
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setRealtimeOk(true);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setRealtimeOk(false);
          if (!pollRef.current) pollRef.current = setInterval(fetchDevice, 5000);
        }
      });
    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (cmdTimerRef.current) {
        clearTimeout(cmdTimerRef.current);
        cmdTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Watch for command confirmation
  useEffect(() => {
    if (status.kind !== "ready") return;
    const pending = pendingCmdRef.current;
    if (!pending) return;
    if (status.device.actual_state === pending.desired) {
      pendingCmdRef.current = null;
      if (cmdTimerRef.current) {
        clearTimeout(cmdTimerRef.current);
        cmdTimerRef.current = null;
      }
    }
  }, [status]);

  async function sendDesired(next: boolean) {
    if (status.kind !== "ready") return;
    if (sending) return;
    if (status.device.desired_state === next && status.device.actual_state === next) {
      return;
    }

    setSending(true);
    setCmdError(null);

    const { error } = await supabase
      .from("smart_watt_devices")
      .update({ desired_state: next })
      .eq("device_code", DEVICE_CODE);

    setSending(false);

    if (error) {
      console.error("[SmartWatt] update error", error);
      const msg = error.message.includes("row-level security")
        ? "Permission denied. Your account is not allowed to control this device."
        : `Could not send the command: ${error.message}`;
      setCmdError(msg);
      return;
    }

    pendingCmdRef.current = { desired: next, at: Date.now() };
    if (cmdTimerRef.current) clearTimeout(cmdTimerRef.current);
    cmdTimerRef.current = setTimeout(() => {
      if (pendingCmdRef.current) {
        pendingCmdRef.current = null;
      }
    }, CMD_TIMEOUT_MS);
  }

  function togglePower() {
    if (status.kind !== "ready") return;
    void sendDesired(!status.device.desired_state);
  }

  /* -------- Gates -------- */

  if (!supabaseConfigured) {
    return (
      <div className="glass rounded-[24px] border border-white/10 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">SMART WATT is not configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Missing Supabase credentials. Please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <SignIn onLegal={setLegal} />
        <LegalModal docId={legal} onClose={() => setLegal(null)} />
      </>
    );
  }

  /* -------- Loaded control -------- */

  const dev = status.kind === "ready" ? status.device : null;
  const pending = dev ? dev.desired_state !== dev.actual_state : false;
  const confirmedOn = dev ? dev.actual_state : false;
  const commandedOn = dev ? dev.desired_state : false;

  return (
    <div className="space-y-6">
      {status.kind === "loading" && (
        <div className="glass flex items-center gap-3 rounded-[24px] border border-white/10 p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading Smart Watt control surface…</span>
        </div>
      )}

      {status.kind === "error" && (
        <div className="glass rounded-[24px] border border-white/10 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Unable to reach SMART WATT cloud</p>
              <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>
              <button
                onClick={fetchDevice}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {status.kind === "missing" && (
        <div className="glass rounded-[24px] border border-white/10 p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Device record not found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No BULB (device code {DEVICE_CODE}) is available to your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {dev && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: HERO BULB & QUICK ACTIONS (65-70%) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Main Redesigned 3D Hero Bulb Control Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <HeroBulbCard
                on={confirmedOn}
                desiredOn={commandedOn}
                pending={pending}
                online={dev.online}
                sending={sending}
                onToggle={togglePower}
                lastUpdated={formatTime(dev.updated_at)}
                deviceCode={dev.device_code}
              />
            </motion.div>

            {/* Error notifications */}
            {cmdError && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
                {cmdError}
              </p>
            )}

            {/* Redesigned Floating Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <QuickActionsCard
                on={confirmedOn}
                online={dev.online}
                onTurnOn={() => sendDesired(true)}
                onTurnOff={() => sendDesired(false)}
                onTriggerCypher={() => cypher.handleMicrophoneClick()}
                onTriggerRefresh={fetchDevice}
                onNavigateSettings={() => window.location.assign("/settings")}
              />
            </motion.div>

          </div>

          {/* RIGHT COLUMN: INTELLIGENCE - HEALTH, CYPHER, ACTIVITY TIMELINE (30-35%) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Device Health Telemetry Card */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <DeviceHealthCard
                deviceCode={dev.device_code}
                online={dev.online}
                desiredState={dev.desired_state}
                actualState={dev.actual_state}
                lastSeen={formatTime(dev.updated_at)}
                realtimeOk={realtimeOk}
              />
            </motion.div>

            {/* Integrated Embedded Cypher Card */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
            >
              <CypherCard cypher={cypher} />
            </motion.div>

            {/* Recent Action Event Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
            >
              <ActivityTimelineCard
                deviceLastUpdated={dev.updated_at}
                history={cypher.history}
              />
            </motion.div>

          </div>

        </div>
      )}

      {/* Legal agreements trigger and footer markup */}
      <footer className="pt-6 text-center text-[11px] text-muted-foreground">
        <p>
          SMART WATT SYSTEM V2.5 · Powered by NoskyTech ·{" "}
          <Link to="/settings" className="text-primary hover:underline font-semibold">
            Settings
          </Link>
        </p>
      </footer>

      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}
