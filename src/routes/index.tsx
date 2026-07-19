import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Sliders,
  Settings,
} from "lucide-react";

import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BulbVisual } from "@/components/bulb";
import { LegalModal } from "@/components/legal-modal";
import type { LegalDoc } from "@/lib/legal";
import { InstallPwaButton } from "@/components/install-pwa";
import { OfflineBanner, useLiveControlAvailable } from "@/components/offline-banner";
import { useOnline } from "@/hooks/use-online";

// Cypher integration
import { useSessionContext } from "@/cypher/context/SessionContext";
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
    <div className="relative mx-auto grid min-h-[85vh] w-full max-w-6xl grid-cols-1 items-center gap-10 px-2 py-6 lg:grid-cols-2 lg:gap-16 animate-fade-in">
      {/* Left: Brand storytelling */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative hidden lg:flex flex-col justify-between h-full"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_25px_oklch(0.62_0.19_256_/_35%)]">
              <Zap className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-[0.2em] text-foreground">SMART WATT</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80">NoskyTech OS</p>
            </div>
          </div>

          <h1 className="mt-10 font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground xl:text-5xl">
            Command your device.
            <br />
            <span className="text-gradient">Feel the future.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            SMART WATT is a premium connected control platform — end-to-end encrypted, always
            realtime, and voice-native with Cypher.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <FeatureChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Cypher Voice AI" />
            <FeatureChip icon={<Cloud className="h-3.5 w-3.5" />} label="Realtime Cloud" />
            <FeatureChip icon={<Server className="h-3.5 w-3.5" />} label="Hardware Handshake" />
            <FeatureChip icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Zero Anonymous Access" />
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          All systems operational
          <span className="text-muted-foreground/40">•</span>
          <span>v1.2.0 · Cypher engine</span>
        </div>
      </motion.div>

      {/* Right: Auth panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        {/* Ambient glow */}
        <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/10 blur-2xl opacity-60" />

        <div className="glass-panel-elevated relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 shadow-card sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Secure Access
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to control your SMART WATT device.
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary lg:hidden">
              <Zap className="h-4.5 w-4.5" strokeWidth={2.4} />
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nosky.tech"
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {err && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-sm font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_oklch(0.62_0.19_256_/_45%)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {busy ? "Authenticating…" : "Sign in to SMART WATT"}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">or</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="mt-5 flex justify-center">
            <InstallPwaButton variant="ghost" label="Install SMART WATT" />
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By signing in, you agree to the SMART WATT{" "}
            <button type="button" onClick={() => onLegal("terms")} className="text-primary hover:underline">
              Terms of Use
            </button>{" "}
            and{" "}
            <button type="button" onClick={() => onLegal("privacy")} className="text-primary hover:underline">
              Privacy Policy
            </button>
            .
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          © 2026 NoskyTech · All rights reserved
        </p>
      </motion.div>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-medium text-foreground/90 backdrop-blur">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

/* ------------------------- Control Page ------------------------- */

function SmartWattPage() {
  const sessionCtx = useSessionContext();
  const [legal, setLegal] = useState<LegalDoc["id"] | null>(null);

  // Timeline events array
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  // Cypher Integration Hook
  const cypher = useCypher();

  // Helper to push normalized events to activity log safely
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

  // Monitor Cypher history to sync activities
  useEffect(() => {
    if (cypher.history && cypher.history.length > 0) {
      const latest = cypher.history[0];
      addTimelineEvent({
        type: "cypher",
        title: `Cypher: ${latest.intent}`,
        description: `"${latest.command}" -> ${latest.result}`,
        status: latest.status === "Completed" || latest.status === "Answered" ? "Completed" : "Failed",
      });
    }
  }, [cypher.history]);

  // Handle Initial Session Restore Notifications
  useEffect(() => {
    if (sessionCtx.authStatus === "authenticated") {
      addTimelineEvent({
        type: "auth",
        title: "Session Established",
        description: `Secure auth channel confirmed for ${sessionCtx.user?.email || "user"}.`,
        status: "Completed",
      });
    }
  }, [sessionCtx.authStatus]);

  // Monitor hardware transitions
  const prevActualStateRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (sessionCtx.actualState !== null && prevActualStateRef.current !== null) {
      if (sessionCtx.actualState !== prevActualStateRef.current) {
        addTimelineEvent({
          type: "action",
          title: sessionCtx.actualState ? "Bulb Switched ON" : "Bulb Switched OFF",
          description: "Physical state confirmation acknowledged.",
          status: "Completed",
        });
      }
    }
    prevActualStateRef.current = sessionCtx.actualState;
  }, [sessionCtx.actualState]);

  // Monitor connectivity transitions
  const prevOnlineRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (sessionCtx.deviceOnline !== null && prevOnlineRef.current !== null) {
      if (sessionCtx.deviceOnline !== prevOnlineRef.current) {
        addTimelineEvent({
          type: "connection",
          title: sessionCtx.deviceOnline ? "Device Online" : "Device Offline",
          description: "Controller network handshake changed.",
          status: sessionCtx.deviceOnline ? "Completed" : "Failed",
        });
      }
    }
    prevOnlineRef.current = sessionCtx.deviceOnline;
  }, [sessionCtx.deviceOnline]);

  const triggerPowerToggle = () => {
    const nextState = !sessionCtx.actualState;
    sessionCtx.sendDeviceCommand(nextState);
  };

  const handleRefresh = async () => {
    addTimelineEvent({
      type: "refresh",
      title: "Manual Sync Triggered",
      description: "Retrieving latest physical state metrics.",
      status: "Neutral",
    });
    await sessionCtx.refreshDevice();
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

  // Session restoring loader (Requirement 1)
  if (sessionCtx.authStatus === "initializing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground tracking-widest animate-pulse">
          Restoring your SMART WATT session…
        </p>
      </div>
    );
  }

  if (!sessionCtx.isAuthenticated) {
    return (
      <>
        <SignIn onLegal={setLegal} />
        <LegalModal docId={legal} onClose={() => setLegal(null)} />
      </>
    );
  }

  const pending = sessionCtx.pendingCommand !== null;
  const confirmedOn = sessionCtx.actualState ?? false;
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const liveControlOk =
    online && sessionCtx.deviceOnline && (sessionCtx.realtimeConnected || sessionCtx.simulationMode);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <OfflineBanner />

      {/* Simulation Banner Notice (Requirement 5) */}
      {sessionCtx.simulationMode && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between shadow-glow">
          <div className="flex items-center gap-3">
            <Sliders className="h-5 w-5 text-amber-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Simulation Mode Active</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Using simulated device parameters inside dev mode.</p>
            </div>
          </div>
          <button
            onClick={() => sessionCtx.setSimulationMode(false)}
            className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-bold text-amber-500 hover:bg-amber-500/20"
          >
            Switch to Live
          </button>
        </div>
      )}

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
              confirmedOn && sessionCtx.deviceOnline ? "glow-primary shadow-[0_0_50px_oklch(0.62_0.19_256_/_10%)] border-primary/20" : "border-white/[0.06]",
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
                  System Node • {sessionCtx.deviceId || "SW-0001"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "status-pill",
                    sessionCtx.deviceOnline ? "status-pill-online" : "status-pill-offline",
                  )}
                >
                  {sessionCtx.deviceOnline ? "Node Online" : "Node Offline"}
                </span>
              </div>
            </div>

            {/* Grid with Bulb Visual & Power Button */}
            <div className="mt-8 grid grid-cols-1 items-center gap-8 md:grid-cols-12">
              <div className="md:col-span-7">
                <BulbVisual on={confirmedOn} pending={pending} online={sessionCtx.deviceOnline} />
              </div>

              <div className="flex flex-col items-center justify-center md:col-span-5 md:items-end">
                <div className="relative">
                  <AnimatePresence>
                    {confirmedOn && sessionCtx.deviceOnline && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 rounded-full blur-xl bg-primary/20 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {pending && sessionCtx.deviceOnline && (
                    <div className="absolute -inset-3.5 rounded-full border-2 border-dashed border-primary animate-spin-slow" />
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={triggerPowerToggle}
                    disabled={pending || !liveControlOk}
                    className={cn(
                      "relative flex h-28 w-28 flex-col items-center justify-center rounded-full border text-center transition-all duration-500",
                      !sessionCtx.deviceOnline
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

            {/* Sync confirmation telemetry status line */}
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
                Telemetry verified {formatTime(sessionCtx.lastUpdated)}
              </span>
            </div>

            {sessionCtx.lastError && (
              <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-xs text-destructive animate-pulse">
                {sessionCtx.lastError}
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
                onClick={() => sessionCtx.sendDeviceCommand(true)}
                disabled={pending || confirmedOn || !liveControlOk}
              />
              <QuickActionButton
                icon={<Power className="h-4 w-4" />}
                label="Turn OFF"
                onClick={() => sessionCtx.sendDeviceCommand(false)}
                disabled={pending || !confirmedOn || !liveControlOk}
              />
              <QuickActionButton
                icon={<Mic className="h-4 w-4" />}
                label="Ask Cypher"
                onClick={() => cypher.handleMicrophoneClick()}
              />
              <QuickActionButton
                icon={<RefreshCw className="h-4 w-4" />}
                label="Refresh"
                onClick={handleRefresh}
              />
              <QuickActionButton
                icon={<SettingsIcon className="h-4 w-4" />}
                label="Settings"
                href="/settings"
              />
              <QuickActionButton
                icon={<Server className="h-4 w-4" />}
                label="Simulation Mode"
                onClick={() => sessionCtx.setSimulationMode(!sessionCtx.simulationMode)}
              />
            </div>
          </section>

          {/* Interactive Simulation Console */}
          {sessionCtx.simulationMode && (
            <section className="glass-panel border border-amber-500/20 p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-amber-500">Simulation Control Panel</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  onClick={() => sessionCtx.setSimulationState((prev) => ({ ...prev, online: !prev.online }))}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-semibold text-center transition-all",
                    sessionCtx.simulationState.online
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  )}
                >
                  {sessionCtx.simulationState.online ? "Simulate: Online" : "Simulate: Offline"}
                </button>

                <button
                  onClick={() => sessionCtx.setSimulationState((prev) => ({ ...prev, triggerTimeout: !prev.triggerTimeout }))}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-semibold text-center transition-all",
                    sessionCtx.simulationState.triggerTimeout
                      ? "border-amber-500/20 bg-amber-500/15 text-amber-400"
                      : "border-white/5 bg-white/[0.01] text-muted-foreground"
                  )}
                >
                  {sessionCtx.simulationState.triggerTimeout ? "Simulate: Timeout ON" : "Simulate: Normal Timeout"}
                </button>

                <button
                  onClick={() => sessionCtx.setSimulationState((prev) => ({ ...prev, triggerNetworkError: !prev.triggerNetworkError }))}
                  className={cn(
                    "rounded-xl border p-2.5 text-xs font-semibold text-center transition-all",
                    sessionCtx.simulationState.triggerNetworkError
                      ? "border-red-500/30 bg-red-500/15 text-red-400"
                      : "border-white/5 bg-white/[0.01] text-muted-foreground"
                  )}
                >
                  {sessionCtx.simulationState.triggerNetworkError ? "Simulate: Net Loss ON" : "Simulate: Normal Net"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 px-1 pt-1 text-[11px] text-muted-foreground leading-relaxed">
                <p>• <strong>Simulate Online:</strong> Toggle ESP32 simulation online/offline state.</p>
                <p>• <strong>Simulate Timeout:</strong> Send command but physical device never replies with handshake confirmation.</p>
                <p>• <strong>Simulate Net Loss:</strong> Simulate complete loss of cloud database connectivity.</p>
              </div>
            </section>
          )}
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
              <HealthRow label="Device Code" value={sessionCtx.deviceId || "SW-0001"} />
              <HealthRow
                label="Link Connectivity"
                value={
                  sessionCtx.deviceOnline ? (
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
              <HealthRow label="Desired State" value={sessionCtx.desiredState ? "ON" : "OFF"} />
              <HealthRow label="Physical Confirmed" value={sessionCtx.actualState ? "ON" : "OFF"} />
              <HealthRow label="Last Telemetry" value={formatTime(sessionCtx.lastUpdated)} />
            </div>
          </section>

          {/* Interactive Cypher Card */}
          <section
            onClick={() => cypher.handleMicrophoneClick()}
            className={cn(
              "glass-panel relative cursor-pointer overflow-hidden border p-5 shadow-card transition-all duration-300 hover:shadow-glow hover:-translate-y-1",
              cypher.state === "listening" ? "glow-primary border-primary/30" : "border-white/[0.06]",
            )}
          >
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

              <div className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    cypher.state === "listening" ? "bg-primary animate-ping" : "bg-success",
                  )}
                />
              </div>
            </div>

            {/* AI Avatar & Waveform */}
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

          {/* Activity Log Timeline */}
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
                  <div key={ev.id} className="relative flex gap-3.5 items-start text-xs animate-slide-up">
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
