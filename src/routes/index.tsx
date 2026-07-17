import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
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
import { BulbVisual } from "@/components/bulb";
import { CypherPanel, type CypherState, type CypherAction } from "@/components/cypher";
import { LegalModal } from "@/components/legal-modal";
import { speak, type CypherIntent } from "@/lib/cypher";
import type { LegalDoc } from "@/lib/legal";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SMART WATT — Control" },
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
    return new Date(iso).toLocaleString();
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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
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

      <form onSubmit={submit} className="glass rounded-2xl border border-white/10 p-6 sm:p-7">
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
  const [cypherState, setCypherState] = useState<CypherState>("idle");
  const [cypherMsg, setCypherMsg] = useState<string | undefined>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cmdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCmdRef = useRef<{ desired: boolean; at: number } | null>(null);

  // Load user prefs
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [language, setLanguage] = useState("en-NG");
  useEffect(() => {
    try {
      setVoiceEnabled(localStorage.getItem("sw.voice") !== "off");
      setSpeechEnabled(localStorage.getItem("sw.speech") !== "off");
      setLanguage(localStorage.getItem("sw.lang") || "en-NG");
    } catch {
      /* noop */
    }
  }, []);

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
      setCypherState("success");
      const msg = pending.desired ? "The bulb is now on." : "The bulb is now off.";
      setCypherMsg(msg);
      speak(msg, speechEnabled);
      setTimeout(() => setCypherState("idle"), 3000);
    }
  }, [status, speechEnabled]);

  async function sendDesired(next: boolean, source: "manual" | "voice") {
    if (status.kind !== "ready") return;
    // Safety: prevent duplicate rapid commands
    if (sending) return;
    if (status.device.desired_state === next && status.device.actual_state === next) {
      const already = next ? "The bulb is already on." : "The bulb is already off.";
      if (source === "voice") {
        setCypherState("success");
        setCypherMsg(already);
        speak(already, speechEnabled);
        setTimeout(() => setCypherState("idle"), 2500);
      }
      return;
    }

    setSending(true);
    setCmdError(null);
    if (source === "voice") {
      setCypherState("sending");
      setCypherMsg("Sending command…");
      speak(next ? "Turning on the bulb." : "Turning off the bulb.", speechEnabled);
    }

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
      if (source === "voice") {
        setCypherState("error");
        setCypherMsg("I could not send the command. Please check your connection and try again.");
        speak(
          "I could not send the command. Please check your connection and try again.",
          speechEnabled,
        );
      }
      return;
    }

    pendingCmdRef.current = { desired: next, at: Date.now() };
    if (source === "voice") {
      setCypherState("waiting");
      setCypherMsg("Command sent. Waiting for BULB confirmation…");
      speak("Command sent. Waiting for the device.", speechEnabled);
    }
    if (cmdTimerRef.current) clearTimeout(cmdTimerRef.current);
    cmdTimerRef.current = setTimeout(() => {
      if (pendingCmdRef.current) {
        pendingCmdRef.current = null;
        if (source === "voice") {
          setCypherState("error");
          setCypherMsg("The command was sent, but the device did not confirm the change.");
          speak("The command was sent, but the device did not confirm the change.", speechEnabled);
        }
      }
    }, CMD_TIMEOUT_MS);
  }

  function togglePower() {
    if (status.kind !== "ready") return;
    void sendDesired(!status.device.desired_state, "manual");
  }

  function handleCypher(action: CypherAction) {
    const intent: CypherIntent = action.intent;
    if (status.kind !== "ready") {
      setCypherState("error");
      setCypherMsg("Device is not ready yet. Please try again in a moment.");
      speak("Device is not ready yet.", speechEnabled);
      return;
    }
    const dev = status.device;

    switch (intent) {
      case "TURN_ON":
      case "TURN_OFF": {
        const next = intent === "TURN_ON";
        if (!dev.online) {
          const msg =
            "The Smart Watt device is offline. Your command may remain pending until it reconnects.";
          setCypherState("error");
          setCypherMsg(msg);
          speak(msg, speechEnabled);
          return;
        }
        void sendDesired(next, "voice");
        return;
      }
      case "GET_BULB_STATUS": {
        const msg = dev.actual_state ? "The bulb is currently on." : "The bulb is currently off.";
        setCypherState("success");
        setCypherMsg(msg);
        speak(msg, speechEnabled);
        setTimeout(() => setCypherState("idle"), 2500);
        return;
      }
      case "GET_DEVICE_STATUS": {
        const msg = dev.online ? "The device is online." : "The device is offline.";
        setCypherState("success");
        setCypherMsg(msg);
        speak(msg, speechEnabled);
        setTimeout(() => setCypherState("idle"), 2500);
        return;
      }
      case "OPEN_SETTINGS": {
        speak("Opening settings.", speechEnabled);
        window.location.assign("/settings");
        return;
      }
      case "HELP": {
        const msg =
          "I can turn the bulb on or off, report its status, check whether Smart Watt is online, open Settings and provide basic safety guidance.";
        setCypherState("success");
        setCypherMsg(msg);
        speak(msg, speechEnabled);
        setTimeout(() => setCypherState("idle"), 4000);
        return;
      }
      case "SAFETY_INFORMATION": {
        const msg =
          "Always disconnect mains power before servicing your Smart Watt device. Only a qualified electrician should perform installation and wiring.";
        setCypherState("success");
        setCypherMsg(msg);
        speak(msg, speechEnabled);
        setTimeout(() => setCypherState("idle"), 5000);
        return;
      }
    }
  }

  /* -------- Gates -------- */

  if (!supabaseConfigured) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-6">
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
    <div className="space-y-5">
      {status.kind === "loading" && (
        <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading device…</span>
        </div>
      )}

      {status.kind === "error" && (
        <div className="glass rounded-2xl border border-white/10 p-6">
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
        <div className="glass rounded-2xl border border-white/10 p-6">
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
        <>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass rounded-3xl border border-white/10 p-5 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Device
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                  BULB
                </h1>
                <p className="text-xs text-muted-foreground">Device code · {dev.device_code}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusChip online={dev.online} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    realtimeOk
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-warning/30 bg-warning/10 text-warning",
                  )}
                >
                  {realtimeOk ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                  {realtimeOk ? "Cloud realtime" : "Cloud polling"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <BulbVisual on={confirmedOn} pending={pending} online={dev.online} />
            </div>

            <div className="mt-6 grid place-items-center">
              <button
                onClick={togglePower}
                disabled={sending || pending}
                aria-label={commandedOn ? "Turn Bulb OFF" : "Turn Bulb ON"}
                className={cn(
                  "group relative inline-flex h-16 min-w-[220px] items-center justify-center gap-3 rounded-2xl px-8 text-sm font-semibold uppercase tracking-widest transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  confirmedOn
                    ? "bg-white/90 text-[#07101F] shadow-glow hover:bg-white"
                    : "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
                )}
              >
                {sending || pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Power className="h-5 w-5" strokeWidth={2.4} />
                )}
                {sending
                  ? "Sending…"
                  : pending
                    ? "Waiting…"
                    : commandedOn
                      ? "Turn Bulb OFF"
                      : "Turn Bulb ON"}
              </button>
            </div>

            {cmdError && (
              <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
                {cmdError}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StateTile
                label="Commanded state"
                value={commandedOn ? "ON" : "OFF"}
                active={commandedOn}
              />
              <StateTile
                label="Confirmed physical state"
                value={confirmedOn ? "ON" : "OFF"}
                active={confirmedOn}
              />
            </div>

            <div
              className={cn(
                "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
                pending
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-success/30 bg-success/10 text-success",
              )}
            >
              <span className="inline-flex items-center gap-2 font-medium">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for device confirmation…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Command confirmed
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Last update {formatTime(dev.updated_at)}
              </span>
            </div>

            {!dev.online && (
              <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
                Device Offline. Remote commands may remain pending until the device reconnects.
              </p>
            )}
          </motion.section>

          <CypherPanel
            voiceEnabled={voiceEnabled}
            speechEnabled={speechEnabled}
            language={language}
            externalState={cypherState}
            externalMessage={cypherMsg}
            onIntent={handleCypher}
          />

          <p className="text-center text-[11px] text-muted-foreground">
            SMART WATT · Powered by NoskyTech ·{" "}
            <Link to="/settings" className="text-primary hover:underline">
              Settings
            </Link>
          </p>
        </>
      )}

      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

function StatusChip({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
        online
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {online ? (
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
    </span>
  );
}

function StateTile({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        active ? "border-primary/40 bg-primary/10" : "border-border bg-background/40",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
