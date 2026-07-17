import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { usePWA } from "@/hooks/usePWA";
import { ArrowUpFromLine, Share, PlusSquare, X } from "lucide-react";
import { LegalModal } from "@/components/legal-modal";
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
  const pwa = usePWA();
  const [dismissedIOS, setDismissedIOS] = useState(false);
  const [showIOSDetails, setShowIOSDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sw.dismiss_ios_install");
      if (stored === "true") {
        setDismissedIOS(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  const dismissIOS = () => {
    setDismissedIOS(true);
    try {
      localStorage.setItem("sw.dismiss_ios_install", "true");
    } catch {
      /* noop */
    }
  };

  const showIOSHelper = pwa.isIOS && pwa.isSafari && !pwa.isStandalone && !dismissedIOS;

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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center relative">
      {/* iOS Installation Subtle Helper on Landing/Sign In */}
      <AnimatePresence>
        {showIOSHelper && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 glass rounded-2xl border border-white/10 p-4 relative"
          >
            <button
              onClick={dismissIOS}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3 pr-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <PlusSquare className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Install SMART WATT on your iPhone
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tap <Share className="inline h-3 w-3 mx-0.5" /> then choose{" "}
                  <strong className="text-foreground">Add to Home Screen</strong>.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => setShowIOSDetails(true)}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    View steps
                  </button>
                  <button
                    onClick={dismissIOS}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Steps Modal Helper */}
      <AnimatePresence>
        {showIOSDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm rounded-2xl border border-white/10 p-5 w-full relative"
            >
              <h3 className="font-display text-base font-bold text-foreground">
                Install SMART WATT
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Access your premium NoskyTech smart-home controls directly from your home screen as
                a standalone application.
              </p>
              <ol className="mt-4 space-y-3 text-xs text-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    1
                  </span>
                  <span>Open Safari browser on your iPhone or iPad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    2
                  </span>
                  <span>
                    Tap the <strong className="text-foreground">Share</strong> icon{" "}
                    <Share className="inline h-3.5 w-3.5 mx-0.5 align-middle" /> in the browser
                    navigation bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    3
                  </span>
                  <span>
                    Scroll down and select{" "}
                    <strong className="text-foreground">Add to Home Screen</strong>{" "}
                    <PlusSquare className="inline h-3.5 w-3.5 mx-0.5 align-middle" />.
                  </span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSDetails(false)}
                className="mt-5 w-full h-9 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all"
              >
                Close instructions
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  const [isOnline, setIsOnline] = useState(true);
  const [legal, setLegal] = useState<LegalDoc["id"] | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cmdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCmdRef = useRef<{ desired: boolean; at: number } | null>(null);

  // Offline Monitoring and Local Cache Loading
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        // Automatically switch device view to offline cached state
        try {
          const cached = localStorage.getItem("sw.last_device_state");
          if (cached) {
            const parsed = JSON.parse(cached);
            setStatus({ kind: "ready", device: parsed });
          }
        } catch (e) {
          console.error("Error reading cached state", e);
        }
      } else {
        // Re-established network, fetch fresh
        if (session) {
          fetchDevice();
        }
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [session]);

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
    // If browser is offline, don't execute network request
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      try {
        const cached = localStorage.getItem("sw.last_device_state");
        if (cached) {
          const parsed = JSON.parse(cached);
          setStatus({ kind: "ready", device: parsed });
        }
      } catch (e) {
        /* noop */
      }
      return;
    }

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

    // Cache successful device state locally for offline fallback
    try {
      localStorage.setItem("sw.last_device_state", JSON.stringify(data));
    } catch {
      /* noop */
    }

    setStatus({ kind: "ready", device: data as SmartWattDevice });
  }

  // Data + realtime lifecycle (only when authenticated)
  useEffect(() => {
    if (!supabaseConfigured || !session) return;
    let cancelled = false;

    // Only establish live connections if online
    if (navigator.onLine) {
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
              // Cache live changes
              try {
                localStorage.setItem("sw.last_device_state", JSON.stringify(next));
              } catch {
                /* noop */
              }
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
    } else {
      setRealtimeOk(false);
      // Fetch from offline local cache immediately
      try {
        const cached = localStorage.getItem("sw.last_device_state");
        if (cached) {
          const parsed = JSON.parse(cached);
          setStatus({ kind: "ready", device: parsed });
        }
      } catch {
        /* noop */
      }
    }

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

    // Safety lock: Reject commands completely while offline
    if (!navigator.onLine || !isOnline) {
      setCmdError("You are offline. Device commands are unavailable until connection returns.");
      return;
    }

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

  const pwa = usePWA();
  const [dismissedDashboard, setDismissedDashboard] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sw.dismiss_dashboard_install");
      if (stored === "true") {
        setDismissedDashboard(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  const dismissDashboard = () => {
    setDismissedDashboard(true);
    try {
      localStorage.setItem("sw.dismiss_dashboard_install", "true");
    } catch {
      /* noop */
    }
  };

  const showInstallCard = pwa.isInstallable && !pwa.isStandalone && !dismissedDashboard;

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
          {/* Premium Glassmorphic Offline Banner */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-warning/20 bg-warning/5 p-4 flex gap-3 overflow-hidden shadow-glow"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5 animate-pulse-glow" />
                <div>
                  <p className="text-xs font-bold text-foreground">You are offline</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Device commands are unavailable until connection returns. Displaying cached
                    information from your secure storage shell.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard Premium Install Card */}
          <AnimatePresence>
            {showInstallCard && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl border border-primary/20 p-5 sm:p-6 relative overflow-hidden"
              >
                <button
                  onClick={dismissDashboard}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* Background glow flare */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
                <div className="flex gap-4 relative">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-glow">
                    <PlusSquare className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Install SMART WATT
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open your devices faster and securely directly from your home screen.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={async () => {
                          const result = await pwa.triggerInstall();
                          if (result) {
                            dismissDashboard();
                          }
                        }}
                        className="h-9 px-4 inline-flex items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-glow"
                      >
                        Install Now
                      </button>
                      <button
                        onClick={dismissDashboard}
                        className="h-9 px-4 inline-flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={cn(
              "glass rounded-3xl border p-5 sm:p-8 transition-colors",
              isOnline ? "border-white/10" : "border-warning/10 bg-warning/[0.01]",
            )}
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
                <StatusChip online={isOnline ? dev.online : false} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    isOnline && realtimeOk
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-warning/30 bg-warning/10 text-warning",
                  )}
                >
                  {isOnline && realtimeOk ? (
                    <Cloud className="h-3 w-3" />
                  ) : (
                    <CloudOff className="h-3 w-3" />
                  )}
                  {isOnline && realtimeOk ? "Cloud realtime" : "Cached fallback"}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "mt-6 transition-opacity duration-300",
                !isOnline && "opacity-80 saturate-[0.85]",
              )}
            >
              <BulbVisual
                on={confirmedOn}
                pending={pending}
                online={isOnline ? dev.online : false}
              />
            </div>

            <div className="mt-6 grid place-items-center">
              <button
                onClick={togglePower}
                disabled={sending || pending || !isOnline}
                aria-label={commandedOn ? "Turn Bulb OFF" : "Turn Bulb ON"}
                className={cn(
                  "group relative inline-flex h-16 min-w-[220px] items-center justify-center gap-3 rounded-2xl px-8 text-sm font-semibold uppercase tracking-widest transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  !isOnline
                    ? "bg-white/[0.04] text-muted-foreground border border-white/5"
                    : confirmedOn
                      ? "bg-white/90 text-[#07101F] shadow-glow hover:bg-white"
                      : "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
                )}
              >
                {!isOnline ? (
                  <>
                    <CloudOff className="h-5 w-5" />
                    Offline State
                  </>
                ) : sending || pending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Power className="h-5 w-5" strokeWidth={2.4} />
                )}
                {isOnline &&
                  (sending
                    ? "Sending…"
                    : pending
                      ? "Waiting…"
                      : commandedOn
                        ? "Turn Bulb OFF"
                        : "Turn Bulb ON")}
              </button>
            </div>

            {cmdError && (
              <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
                {cmdError}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StateTile
                label={isOnline ? "Commanded state" : "Last commanded state"}
                value={commandedOn ? "ON" : "OFF"}
                active={commandedOn}
              />
              <StateTile
                label={isOnline ? "Confirmed physical state" : "Last known state"}
                value={confirmedOn ? "ON" : "OFF"}
                active={confirmedOn}
              />
            </div>

            <div
              className={cn(
                "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
                !isOnline
                  ? "border-warning/15 bg-warning/5 text-warning"
                  : pending
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-success/30 bg-success/10 text-success",
              )}
            >
              <span className="inline-flex items-center gap-2 font-medium">
                {!isOnline ? (
                  <>
                    <CloudOff className="h-4 w-4" />
                    Live Connection Unavailable
                  </>
                ) : pending ? (
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
                {!isOnline ? "Last updated " : "Updated "} {formatTime(dev.updated_at)}
              </span>
            </div>

            {isOnline && !dev.online && (
              <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
                Device Offline. Remote commands may remain pending until the device reconnects.
              </p>
            )}
          </motion.section>

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
