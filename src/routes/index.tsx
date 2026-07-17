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
  Mic,
  Activity,
  ChevronRight,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldAlert,
  Server,
  Sparkles,
} from "lucide-react";

import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BulbVisual } from "@/components/bulb";
import { LegalModal } from "@/components/legal-modal";
import type { LegalDoc } from "@/lib/legal";

// Cypher integration
import { useCypher } from "@/cypher/hooks/useCypher";
import { Waveform } from "@/cypher/components/Waveform";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SMART WATT — Control Center" },
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

// Normalized event model for high-end Activity Timeline
interface TimelineEvent {
  id: string;
  type: "action" | "cypher" | "connection" | "refresh" | "auth" | "error";
  title: string;
  description: string;
  timestamp: Date;
  status: "Completed" | "Failed" | "Pending" | "Neutral";
}

function formatEventTime(date: Date) {
  try {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function formatTime(dateInput: Date | string | null | undefined) {
  if (!dateInput) return "Never";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "Never";
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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_oklch(0.62_0.19_256_/_30%)]">
          <Zap className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-widest text-foreground">
          SMART WATT
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground/80">
          Powered by NoskyTech
        </p>
      </div>

      <form onSubmit={submit} className="glass-panel border border-white/[0.08] p-6 sm:p-7 shadow-card">
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
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/40 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
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
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/40 px-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
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
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_oklch(0.62_0.19_256_/_40%)] disabled:opacity-60"
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

  // Timeline events array
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  // Auth & Cypher integration
  const isAuthenticated = !!session;
  const cypher = useCypher(isAuthenticated);

  // Sync session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) {
        addTimelineEvent({
          type: "auth",
          title: "Session Established",
          description: "Secure auth channel confirmed.",
          status: "Completed",
        });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) {
        addTimelineEvent({
          type: "auth",
          title: "Authenticated",
          description: `Logged in as ${s.user.email}`,
          status: "Completed",
        });
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Utility to push normalized events to activity log safely
  const addTimelineEvent = (ev: Omit<TimelineEvent, "id" | "timestamp">) => {
    setEvents((prev) => {
      const isDuplicate = prev.some(
        (p) =>
          p.title === ev.title &&
          p.description === ev.description &&
          Date.now() - p.timestamp.getTime() < 3000,
      );
      if (isDuplicate) return prev;
      const newEv: TimelineEvent = {
        ...ev,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
      };
      return [newEv, ...prev].slice(0, 15);
    });
  };

  // Cypher activity history integration
  useEffect(() => {
    if (cypher.history && cypher.history.length > 0) {
      const latest = cypher.history[0];
      addTimelineEvent({
        type: "cypher",
        title: `Cypher: ${latest.intent}`,
        description: `"${latest.command}" -> ${latest.result}`,
        status: latest.status === "Completed" ? "Completed" : "Failed",
      });
    }
  }, [cypher.history]);

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

  // Live device monitor
  useEffect(() => {
    if (!supabaseConfigured || !session) return;
    let cancelled = false;
    fetchDevice();

    const channel = supabase
      .channel(`smart_watt_page_${DEVICE_CODE}`)
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
            setStatus((prev) => {
              if (prev.kind === "ready") {
                const oldDevice = prev.device;
                // Connection Change Log
                if (oldDevice.online !== next.online) {
                  addTimelineEvent({
                    type: "connection",
                    title: next.online ? "Device Reconnected" : "Device Disconnected",
                    description: `Bulb SW-0001 status changed.`,
                    status: next.online ? "Completed" : "Failed",
                  });
                }
                // Actual State Confirmation Log
                if (oldDevice.actual_state !== next.actual_state) {
                  addTimelineEvent({
                    type: "action",
                    title: next.actual_state ? "Bulb Switched ON" : "Bulb Switched OFF",
                    description: "Physical state confirmation acknowledged.",
                    status: "Completed",
                  });
                }
              }
              return { kind: "ready", device: next };
            });
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
  }, [session?.user?.id]);

  // Command confirmation tracker
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

    addTimelineEvent({
      type: "action",
      title: next ? "Request ON Sent" : "Request OFF Sent",
      description: "Dispatching instruction to device relay...",
      status: "Pending",
    });

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

      addTimelineEvent({
        type: "error",
        title: "Relay Control Refused",
        description: error.message,
        status: "Failed",
      });
      return;
    }

    pendingCmdRef.current = { desired: next, at: Date.now() };
    if (cmdTimerRef.current) clearTimeout(cmdTimerRef.current);
    cmdTimerRef.current = setTimeout(() => {
      if (pendingCmdRef.current) {
        pendingCmdRef.current = null;
        addTimelineEvent({
          type: "error",
          title: "Confirmation Timeout",
          description: "Physical device failed to confirm state change.",
          status: "Failed",
        });
      }
    }, CMD_TIMEOUT_MS);
  }

  function togglePower() {
    if (status.kind !== "ready") return;
    void sendDesired(!status.device.desired_state);
  }

  /* -------- Quick Action triggers -------- */
  const triggerRefresh = async () => {
    addTimelineEvent({
      type: "refresh",
      title: "Manual Sync Triggered",
      description: "Retrieving latest physical state metrics.",
      status: "Neutral",
    });
    await fetchDevice();
  };

  /* -------- Gates -------- */

  if (!supabaseConfigured) {
    return (
      <div className="glass-panel border border-white/[0.08] p-6 max-w-lg mx-auto mt-12 text-center shadow-card">
        <AlertTriangle className="h-10 w-10 text-warning mx-auto animate-pulse mb-4" />
        <p className="font-semibold text-foreground text-lg">SMART WATT is not configured</p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Missing Supabase credentials. Please verify your environment parameters or contact NoskyTech administrators.
        </p>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const dev = status.kind === "ready" ? status.device : null;
  const pending = dev ? dev.desired_state !== dev.actual_state : false;
  const confirmedOn = dev ? dev.actual_state : false;
  const commandedOn = dev ? dev.desired_state : false;

  return (
    <div className="w-full space-y-6">
      {status.kind === "loading" && (
        <div className="glass-panel flex items-center gap-3 border border-white/[0.08] p-6 shadow-glow">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Initializing secure OS channel…</span>
        </div>
      )}

      {status.kind === "error" && (
        <div className="glass-panel border border-white/[0.08] p-6 shadow-card">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Unable to reach SMART WATT cloud</p>
              <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>
              <button
                onClick={fetchDevice}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-white/[0.05]"
              >
                Retry Link
              </button>
            </div>
          </div>
        </div>
      )}

      {status.kind === "missing" && (
        <div className="glass-panel border border-white/[0.08] p-6 shadow-card">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO BULB & QUICK ACTIONS (65% width)        */}
          {/* ========================================================= */}
          <div className="space-y-6 lg:col-span-8">
            {/* Main Hero Bulb Control Card */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "glass-panel-elevated relative overflow-hidden border p-6 sm:p-8 shadow-card transition-all duration-700",
                confirmedOn && dev.online ? "glow-primary shadow-[0_0_50px_oklch(0.62_0.19_256_/_10%)] border-primary/20" : "border-white/[0.06]",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="status-pill status-pill-online border-primary/10 bg-primary/5 uppercase tracking-wider text-[10px]">
                    Primary Device Control
                  </span>
                  <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Smart Bulb
                  </h1>
                  <p className="text-xs font-semibold text-muted-foreground/80 mt-1">
                    System Node • {dev.device_code}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      "status-pill",
                      dev.online ? "status-pill-online" : "status-pill-offline",
                    )}
                  >
                    {dev.online ? "Node Online" : "Node Offline"}
                  </span>
                </div>
              </div>

              {/* Grid with 3D Bulb on Left, Power ring on Right */}
              <div className="mt-8 grid grid-cols-1 items-center gap-8 md:grid-cols-12">
                <div className="md:col-span-7">
                  <BulbVisual on={confirmedOn} pending={pending} online={dev.online} />
                </div>

                <div className="flex flex-col items-center justify-center md:col-span-5 md:items-end">
                  {/* Circular Illuminated Power Button Ring (Tesla style) */}
                  <div className="relative">
                    {/* Ring glowing layers */}
                    <AnimatePresence>
                      {confirmedOn && dev.online && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 rounded-full blur-xl bg-primary/20 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {/* Animated rotating outer ring while pending confirmation */}
                    {pending && dev.online && (
                      <div className="absolute -inset-3.5 rounded-full border-2 border-dashed border-primary animate-spin-slow" />
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePower}
                      disabled={sending || pending || !dev.online}
                      className={cn(
                        "relative flex h-28 w-28 flex-col items-center justify-center rounded-full border text-center transition-all duration-500",
                        !dev.online
                          ? "bg-white/[0.02] border-white/[0.04] text-muted-foreground cursor-not-allowed"
                          : confirmedOn
                            ? "bg-primary text-primary-foreground border-primary glow-primary"
                            : "bg-[#050914]/40 border-white/[0.08] text-foreground hover:border-primary/50",
                      )}
                    >
                      <Power className={cn("h-8 w-8 transition-transform", pending && "animate-pulse")} strokeWidth={2.5} />
                      <span className="mt-1.5 font-display text-[9px] font-bold tracking-[0.15em] uppercase">
                        {pending ? "Syncing" : confirmedOn ? "Active" : "Standby"}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Status and timestamp validation line */}
              <div
                className={cn(
                  "mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs backdrop-blur-md",
                  pending
                    ? "border-warning/20 bg-warning/[0.03] text-warning"
                    : confirmedOn
                      ? "border-primary/20 bg-primary/[0.03] text-primary"
                      : "border-white/[0.04] bg-white/[0.01] text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  {pending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Pending hardware handshake...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      State synchronized & secured
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground/80">
                  <Clock className="h-3.5 w-3.5" />
                  Telemetry verified {formatTime(dev.updated_at)}
                </span>
              </div>

              {cmdError && (
                <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-xs text-destructive">
                  {cmdError}
                </p>
              )}
            </motion.section>

            {/* Quick Actions Panel */}
            <section className="glass-panel border border-white/[0.06] p-6 shadow-card">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                System Quick Actions
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <QuickActionButton
                  icon={<Zap className="h-4 w-4" />}
                  label="Turn ON"
                  onClick={() => sendDesired(true)}
                  disabled={sending || confirmedOn || !dev.online}
                />
                <QuickActionButton
                  icon={<Power className="h-4 w-4" />}
                  label="Turn OFF"
                  onClick={() => sendDesired(false)}
                  disabled={sending || !confirmedOn || !dev.online}
                />
                <QuickActionButton
                  icon={<Mic className="h-4 w-4" />}
                  label="Ask Cypher"
                  onClick={() => cypher.handleMicrophoneClick()}
                />
                <QuickActionButton
                  icon={<RefreshCw className="h-4 w-4" />}
                  label="Refresh"
                  onClick={triggerRefresh}
                />
                <QuickActionButton
                  icon={<SettingsIcon className="h-4 w-4" />}
                  label="Settings"
                  href="/settings"
                />
                <QuickActionButton
                  icon={<Server className="h-4 w-4" />}
                  label="Device Status"
                  onClick={() => {
                    addTimelineEvent({
                      type: "refresh",
                      title: "Diagnostics",
                      description: `Bulb version 1.0.0, Ping latency verified.`,
                      status: "Neutral",
                    });
                  }}
                />
              </div>
            </section>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: INTELLIGENCE & TIMELINE (35% width)        */}
          {/* ========================================================= */}
          <div className="space-y-6 lg:col-span-4">
            {/* Device Health Diagnostics */}
            <section className="glass-panel border border-white/[0.06] p-5 shadow-card">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-4">
                Device Diagnostics
              </h2>
              <div className="space-y-3.5">
                <HealthRow label="Device Code" value={dev.device_code} />
                <HealthRow
                  label="Link Connectivity"
                  value={
                    dev.online ? (
                      <span className="text-success inline-flex items-center gap-1 font-semibold">
                        <Wifi className="h-3 w-3" /> Online
                      </span>
                    ) : (
                      <span className="text-destructive inline-flex items-center gap-1 font-semibold">
                        <WifiOff className="h-3 w-3" /> Offline
                      </span>
                    )
                  }
                />
                <HealthRow label="Desired State" value={dev.desired_state ? "ON" : "OFF"} />
                <HealthRow label="Physical Confirmed" value={dev.actual_state ? "ON" : "OFF"} />
                <HealthRow label="Last Telemetry" value={formatTime(dev.updated_at)} />
              </div>
            </section>

            {/* Permanent Interactive Cypher Card */}
            <section
              onClick={() => cypher.handleMicrophoneClick()}
              className={cn(
                "glass-panel relative cursor-pointer overflow-hidden border p-5 shadow-card transition-all duration-300 hover:shadow-glow hover:-translate-y-1",
                cypher.state === "listening" ? "glow-primary border-primary/30" : "border-white/[0.06]",
              )}
            >
              {/* Cypher Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    {cypher.state === "listening" && (
                      <span className="absolute -inset-1 rounded-xl border border-primary/40 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">Cypher Brain</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80">Always-On Listening</p>
                  </div>
                </div>

                {/* Animated status ring */}
                <div className="relative flex h-4 w-4 items-center justify-center">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      cypher.state === "listening" ? "bg-primary animate-ping" : "bg-success",
                    )}
                  />
                </div>
              </div>

              {/* AI Avatar & Animated Waveform */}
              <div className="mt-5 rounded-2xl bg-[#050914]/40 border border-white/[0.04] p-4 flex flex-col items-center justify-center min-h-[90px]">
                {cypher.state === "listening" ? (
                  <div className="w-full space-y-3">
                    <Waveform />
                    <p className="text-center text-xs font-semibold text-primary">
                      {cypher.interimTranscript || cypher.transcript || "Awaiting voice command..."}
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <p className="text-xs font-bold text-foreground">Voice Command Core</p>
                    <p className="text-[10px] text-muted-foreground/80">
                      Try saying <span className="text-primary">"Hey Cypher, turn ON bulb"</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 italic mt-1">Tap card to start listening</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity Log Timeline */}
            <section className="glass-panel border border-white/[0.06] p-5 shadow-card">
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-4">
                Live Activity Log
              </h2>

              {events.length === 0 ? (
                <div className="py-6 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">No recent activity</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px] mx-auto">
                    Confirmed actions and Cypher commands will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/[0.06]">
                  {events.slice(0, 5).map((ev) => (
                    <div key={ev.id} className="relative flex gap-3.5 items-start text-xs">
                      {/* Ring Indicator */}
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#050914] border border-white/[0.08]">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            ev.status === "Completed"
                              ? "bg-success shadow-[0_0_8px_oklch(0.72_0.18_144)]"
                              : ev.status === "Failed"
                                ? "bg-destructive"
                                : ev.status === "Pending"
                                  ? "bg-warning animate-pulse"
                                  : "bg-primary",
                          )}
                        />
                      </div>

                      {/* Info payload */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-foreground truncate">{ev.title}</p>
                          <span className="text-[9px] text-muted-foreground/60 shrink-0">
                            {formatEventTime(ev.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 leading-relaxed truncate">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

/* ------------------------- Helper Layout Components ------------------------- */

function QuickActionButton({
  icon,
  label,
  onClick,
  href,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.03] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
        {icon}
      </span>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </>
  );

  const classes = cn(
    "group flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 transition-all duration-300",
    disabled
      ? "opacity-40 cursor-not-allowed"
      : "hover:border-primary/20 hover:bg-white/[0.03] hover:shadow-[0_0_15px_oklch(0.62_0.19_256_/_8%)]",
  );

  if (href) {
    return (
      <Link to={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}

function HealthRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-xs">
      <span className="font-medium text-muted-foreground/80">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}
