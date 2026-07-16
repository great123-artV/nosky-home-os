import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Zap,
  Power,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
} from "lucide-react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";

import { PageHeader, GlassCard } from "@/components/primitives";
import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/smart-watt")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Smart Watt — Nosky HomeOS" },
      {
        name: "description",
        content: "Live control interface for the Nosky Smart Watt relay.",
      },
    ],
  }),
  component: SmartWattPage,
});

const DEVICE_CODE = "SW-0001";

type Status =
  | { kind: "loading" }
  | { kind: "ready"; device: SmartWattDevice }
  | { kind: "missing" }
  | { kind: "error"; message: string };

function formatTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function SignInGate({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSignedIn();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/smart-watt" },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account, then sign in.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Authentication failed";
      console.error("[SmartWatt] auth error", e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="mx-auto max-w-md p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Zap className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Sign in to control BULB
          </h2>
          <p className="text-xs text-muted-foreground">
            Authenticated access only. No public writes.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="h-11 w-full rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        {err && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {err}
          </p>
        )}
        {info && (
          <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
            {info}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setErr(null);
            setInfo(null);
          }}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </GlassCard>
  );
}

function SmartWattPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [sending, setSending] = useState(false);
  const [cmdError, setCmdError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session tracking
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
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
      setStatus({ kind: "error", message: error.message });
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
          if (!pollRef.current) {
            pollRef.current = setInterval(fetchDevice, 5000);
          }
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function togglePower() {
    if (status.kind !== "ready") return;
    setSending(true);
    setCmdError(null);
    const next = !status.device.desired_state;
    const { error } = await supabase
      .from("smart_watt_devices")
      .update({ desired_state: next })
      .eq("device_code", DEVICE_CODE);
    if (error) {
      console.error("[SmartWatt] update error", error);
      setCmdError(
        error.message.includes("row-level security")
          ? "Permission denied. Your account is not allowed to control this device."
          : `Command failed: ${error.message}`,
      );
    }
    setSending(false);
  }

  if (!supabaseConfigured) {
    return (
      <>
        <PageHeader title="Smart Watt" subtitle="Live control for the Nosky Smart Watt relay." />
        <GlassCard className="p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Supabase not configured</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Set <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> and{" "}
                <code className="rounded bg-muted px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
                <code className="rounded bg-muted px-1">.env</code> and reload.
              </p>
            </div>
          </div>
        </GlassCard>
      </>
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
        <PageHeader title="Smart Watt" subtitle="Live control for the Nosky Smart Watt relay." />
        <SignInGate onSignedIn={() => { /* session handler updates state */ }} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Smart Watt"
        subtitle="Live control for your BULB relay — commands travel through Supabase to the ESP32."
        action={
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        }
      />

      {status.kind === "loading" && (
        <GlassCard className="flex items-center gap-3 p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading device…</span>
        </GlassCard>
      )}

      {status.kind === "error" && (
        <GlassCard className="p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Unable to reach Supabase</p>
              <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {status.kind === "missing" && (
        <GlassCard className="p-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Device not found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No row in <code className="rounded bg-muted px-1">smart_watt_devices</code> for{" "}
                <code className="rounded bg-muted px-1">{DEVICE_CODE}</code>, or your account
                cannot read it.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {status.kind === "ready" && (
        <DeviceCard
          device={status.device}
          sending={sending}
          cmdError={cmdError}
          realtimeOk={realtimeOk}
          onToggle={togglePower}
        />
      )}
    </>
  );
}

function DeviceCard({
  device,
  sending,
  cmdError,
  realtimeOk,
  onToggle,
}: {
  device: SmartWattDevice;
  sending: boolean;
  cmdError: string | null;
  realtimeOk: boolean;
  onToggle: () => void;
}) {
  const pending = device.desired_state !== device.actual_state;
  const commandedOn = device.desired_state;
  const confirmedOn = device.actual_state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow">
              <Zap className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">BULB</h2>
              <p className="text-xs text-muted-foreground">
                Nosky Smart Watt · {device.device_code}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
              device.online
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {device.online ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </>
            )}
          </div>
        </div>

        {/* Power button */}
        <div className="mt-8 grid place-items-center">
          <button
            onClick={onToggle}
            disabled={sending}
            aria-label={commandedOn ? "Turn OFF" : "Turn ON"}
            className={cn(
              "group relative grid h-40 w-40 place-items-center rounded-full border transition-all duration-300",
              "disabled:cursor-not-allowed",
              confirmedOn
                ? "border-primary/50 bg-primary/15 shadow-glow"
                : "border-border bg-background/40 hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "absolute inset-3 rounded-full transition-opacity duration-500",
                confirmedOn ? "bg-primary/10 opacity-100" : "opacity-0",
              )}
            />
            {sending ? (
              <Loader2 className="relative h-14 w-14 animate-spin text-primary" />
            ) : (
              <Power
                className={cn(
                  "relative h-14 w-14 transition-colors",
                  confirmedOn ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
                strokeWidth={1.75}
              />
            )}
          </button>
          <p className="mt-4 text-sm font-medium text-foreground">
            {sending ? "Sending command…" : commandedOn ? "Turn OFF" : "Turn ON"}
          </p>
        </div>

        {/* State grid */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <StateTile label="Commanded state" value={commandedOn ? "ON" : "OFF"} active={commandedOn} />
          <StateTile label="Confirmed device state" value={confirmedOn ? "ON" : "OFF"} active={confirmedOn} />
        </div>

        {/* Pending / confirmed */}
        <div
          className={cn(
            "mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            pending
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-success/30 bg-success/10 text-success",
          )}
        >
          <span className="inline-flex items-center gap-2 font-medium">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Waiting for device…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Command Confirmed
              </>
            )}
          </span>
          {!device.online && pending && (
            <span className="text-xs text-muted-foreground">ESP32 appears offline</span>
          )}
        </div>

        {cmdError && (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {cmdError}
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Last synced {formatTime(device.updated_at)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              realtimeOk ? "text-success" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                realtimeOk ? "bg-success animate-pulse-glow" : "bg-muted-foreground",
              )}
            />
            {realtimeOk ? "Realtime connected" : "Polling every 5s"}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function StateTile({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
