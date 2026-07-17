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
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Mic,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { BulbVisual } from "@/components/bulb";
import { CypherPanel, type CypherState, type CypherAction } from "@/components/cypher";
import { speak, type CypherIntent } from "@/lib/cypher";
import type { LegalDoc } from "@/lib/legal";

import {
  LegalModal,
  SecurityModal,
  CloudAuthModal,
  ForgotPasswordModal,
} from "@/components/legal-modal";
import { PreLoginCypherDrawer } from "@/components/pre-login-cypher";

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

/* ------------------------- Contact Modal ------------------------- */
function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const email = "noskytech1@gmail.com";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[60vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div>
                <h2 className="truncate font-display text-base font-bold text-foreground">
                  Contact Support
                </h2>
                <p className="text-[11px] text-muted-foreground">NoskyTech Support Desk</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Contact Modal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 space-y-4">
              <p className="text-sm text-foreground/85 leading-relaxed">
                Need help with your SMART WATT device or account? Reach out directly to our engineering support team.
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/40 p-3.5">
                <span className="truncate font-mono text-xs text-foreground/90">{email}</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title="Copy email to clipboard"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4" />}
                  </button>
                  <a
                    href={`mailto:${email}?subject=SMART WATT Support Query`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-xs text-muted-foreground font-semibold">Web Portal</p>
                <a
                  href="https://noskytech.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  noskytech.vercel.app <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------- About Modal ------------------------- */
function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div>
                <h2 className="truncate font-display text-base font-bold text-foreground">
                  About SMART WATT
                </h2>
                <p className="text-[11px] text-muted-foreground">Premium Smart Home Ecosystem</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close About Modal"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 space-y-4 text-sm text-foreground/85 leading-relaxed">
              <p>
                SMART WATT is a connected device-control platform powered by NoskyTech. It enables authorized users to remotely control compatible electrical equipment through a secure web interface, cloud connection and internet-connected controller.
              </p>
              <div className="rounded-xl border border-white/10 bg-background/40 p-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Current Prototype Capabilities</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                  <li>One connected bulb</li>
                  <li>One ESP32 controller</li>
                  <li>One relay output control</li>
                  <li>Supabase cloud infrastructure Integration</li>
                  <li>Remote ON and OFF physical status verification</li>
                  <li>Realtime confirmed feedback loops</li>
                </ul>
              </div>
              <p>
                SMART WATT is part of NoskyTech's vision for accessible, intelligent and connected automation systems.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------- Cloud Status Popover ------------------------- */
function CloudStatusPopover({
  isOpen,
  onClose,
  status,
  lastChecked,
  checkingCloud,
  onRetry,
}: {
  isOpen: boolean;
  onClose: () => void;
  status: "connected" | "reconnecting" | "unavailable";
  lastChecked: string;
  checkingCloud: boolean;
  onRetry: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/85 backdrop-blur-xs sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[50vh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div>
                <h2 className="truncate font-display text-base font-bold text-foreground">
                  Cloud Service Status
                </h2>
                <p className="text-[11px] text-muted-foreground">Realtime Supabase Health</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Cloud Status"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/40 p-4">
                <span className={cn(
                  "relative flex h-3 w-3 shrink-0 rounded-full",
                  status === "connected" ? "bg-success" : status === "reconnecting" ? "bg-warning" : "bg-destructive"
                )}>
                  {status === "reconnecting" || status === "connected" ? (
                    <span className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                      status === "connected" ? "bg-success" : "bg-warning"
                    )} />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize text-foreground">{status}</p>
                  <p className="text-xs text-muted-foreground">
                    Last checked: {lastChecked || "Never"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                This connectivity check queries the secure Supabase database nodes directly. Ensure you have an active network connection.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onRetry}
                  disabled={checkingCloud}
                  className="h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {checkingCloud && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Retry Check
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------- Sign In Component ------------------------- */

function SignIn({
  onLegal,
  onOpenSecurity,
  onOpenCloudAuth,
  cloudStatus,
  lastCheckedCloud,
  checkingCloud,
  onRetryCloud,
  onOpenAbout,
  onOpenCloudPopover,
}: {
  onLegal: (d: "privacy" | "terms" | "safety" | "about") => void;
  onOpenSecurity: () => void;
  onOpenCloudAuth: () => void;
  cloudStatus: "connected" | "reconnecting" | "unavailable";
  lastCheckedCloud: string;
  checkingCloud: boolean;
  onRetryCloud: () => void;
  onOpenAbout: () => void;
  onOpenCloudPopover: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem("sw.remember_me") === "true";
    setRememberMe(saved);
    if (saved) {
      const savedEmail = localStorage.getItem("sw.saved_email");
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErr("Invalid email format.");
      return;
    }
    if (!password) {
      setErr("Missing password.");
      return;
    }
    setBusy(true);
    setErr(null);

    // Save remember preference
    localStorage.setItem("sw.remember_me", rememberMe ? "true" : "false");
    if (rememberMe) {
      localStorage.setItem("sw.saved_email", email);
    } else {
      localStorage.removeItem("sw.saved_email");
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Humanized friendly error triggers
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect credentials. Please verify and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Account not confirmed. Please check your email.");
        } else if (error.message.includes("too many requests")) {
          throw new Error("Too many attempts. Please try again later.");
        } else {
          throw error;
        }
      }
      toast.success("Authenticated Successfully");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Supabase unavailable or offline.";
      console.error("[SmartWatt] auth error", e);
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  const focusEmail = () => {
    emailInputRef.current?.focus();
  };

  const focusPassword = () => {
    passwordInputRef.current?.focus();
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8 sm:px-6 md:py-16">
      {/* Background artwork wrapper with percentage hotspots */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <div className="relative h-full w-full min-h-screen flex items-center justify-center opacity-45">
          <img
            src="/splash-artwork.png"
            alt="Background Artwork"
            className="h-[100vh] w-auto max-w-none object-contain pointer-events-none select-none"
          />
          {/* Aligned hotspots */}
          <div className="absolute inset-0 pointer-events-auto flex items-center justify-center">
            <div className="relative h-[100vh] aspect-[941/1672]">
              {/* Cloud Hotspot */}
              <button
                type="button"
                onClick={onOpenCloudPopover}
                className="absolute w-[24%] h-[8%] rounded-full cursor-pointer hover:bg-primary/10 hover:border hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ left: "38%", top: "33%" }}
                title="Cloud Status Hotspot"
                aria-label="Check cloud connection status"
              />
              {/* Bulb Hotspot */}
              <button
                type="button"
                onClick={() => {
                  toast.info("Sign in to control BULB.");
                }}
                className="absolute w-[14%] h-[12%] rounded-full cursor-pointer hover:bg-amber-400/10 hover:border hover:border-amber-400/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                style={{ left: "63%", top: "51%" }}
                title="Bulb Control Hotspot"
                aria-label="Information about connected bulb"
              />
              {/* Device Hotspot */}
              <button
                type="button"
                onClick={onOpenAbout}
                className="absolute w-[20%] h-[10%] rounded-xl cursor-pointer hover:bg-primary/10 hover:border hover:border-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ left: "39%", top: "78%" }}
                title="Smart Watt Device Hotspot"
                aria-label="Open About SMART WATT information modal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title & Subtitle Mockup Design */}
      <div className="mb-6 text-center">
        <button
          onClick={focusEmail}
          className="group transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 rounded-xl px-4 py-2"
        >
          <h1 className="font-display text-4xl font-extrabold tracking-widest text-foreground text-gradient bg-clip-text drop-shadow-[0_0_15px_oklch(0.62_0.19_256_/_0.3)]">
            SMART WATT
          </h1>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground group-hover:text-primary transition-colors">
            Secure Smart Home Control
          </p>
        </button>
      </div>

      {/* Main Glassmorphism Login Card */}
      <div className="glass shadow-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">

        {/* Large Glowing Shield Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.button
            onClick={onOpenSecurity}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-glow cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            title="System Security Summary"
            aria-label="System Protection Shield"
          >
            {/* Soft breathing halo glow */}
            <span className="absolute inset-0 rounded-2xl border border-primary/20 bg-primary/5 blur-sm scale-110 animate-pulse-glow" />
            <ShieldCheck className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          </motion.button>

          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-xs text-muted-foreground max-w-xs">
              Sign in to securely control your connected home.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={submit} className="space-y-4">
          {/* Email Row */}
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={focusEmail}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Focus email input"
              >
                <Mail className="h-4.5 w-4.5" />
              </button>
              <input
                id="email-input"
                ref={emailInputRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@noskytech.com"
                className="h-12 w-full rounded-2xl border border-border bg-background/30 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Password Row */}
          <div className="space-y-1.5">
            <label htmlFor="password-input" className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Security Password
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={focusPassword}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Focus password input"
              >
                <Lock className="h-4.5 w-4.5" />
              </button>
              <input
                id="password-input"
                ref={passwordInputRef}
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-2xl border border-border bg-background/30 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Form Actions (Remember & Forgot) */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-md border-border bg-background/30 text-primary focus:ring-offset-0 focus:ring-primary/40"
              />
              <span className="font-medium text-muted-foreground hover:text-foreground transition-colors">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="font-semibold text-primary hover:underline cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
            >
              Forgot Password?
            </button>
          </div>

          {err && (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-start gap-2.5 animate-pulse-glow"
            >
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={busy}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-glow"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Interactive Status & Verification Blocks */}
        <div className="border-t border-white/5 pt-5 space-y-3.5">
          {/* Cloud Auth Popover trigger */}
          <button
            onClick={onOpenCloudAuth}
            className="w-full flex items-center justify-between text-left p-3.5 rounded-2xl border border-white/5 hover:border-primary/25 bg-background/20 hover:bg-primary/5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 group"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-foreground">Secure Cloud Authentication</p>
                <p className="text-[10px] text-muted-foreground">Supabase Cloud Enforced</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          {/* Interactive Cloud Connected and System Protected Status Bar */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cloud Status */}
            <button
              onClick={onOpenCloudPopover}
              className="flex flex-col items-start p-3.5 rounded-2xl border border-white/5 hover:border-primary/20 bg-background/20 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Cloud className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  cloudStatus === "connected" ? "text-success" : cloudStatus === "reconnecting" ? "text-warning" : "text-destructive"
                )} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cloud status</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  cloudStatus === "connected" ? "bg-success" : cloudStatus === "reconnecting" ? "bg-warning" : "bg-destructive"
                )} />
                <span className="text-xs font-bold text-foreground capitalize truncate">
                  {cloudStatus === "reconnecting" ? "Checking..." : cloudStatus === "connected" ? "Cloud connected" : "Cloud offline"}
                </span>
              </div>
            </button>

            {/* System Protected */}
            <button
              onClick={onOpenSecurity}
              className="flex flex-col items-start p-3.5 rounded-2xl border border-white/5 hover:border-primary/20 bg-background/20 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">System security</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs font-bold text-foreground truncate">System Protected</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-card Row: Legal and NoskyTech Credits */}
      <div className="mt-8 space-y-4">
        {/* Brand credit */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
          <span>
            Powered by{" "}
            <a
              href="https://noskytech.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              NoskyTech <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </span>
          <button
            onClick={onOpenAbout}
            className="font-semibold text-muted-foreground hover:text-primary hover:underline cursor-pointer focus:outline-none"
            title="Open About SMART WATT Panel"
          >
            Version 1.0
          </button>
        </div>

        {/* Quick Legal Links Row */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-t border-white/5 pt-4">
          <button
            onClick={() => onLegal("privacy")}
            className="hover:text-primary hover:underline cursor-pointer focus:outline-none"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => onLegal("terms")}
            className="hover:text-primary hover:underline cursor-pointer focus:outline-none"
          >
            Terms of Use
          </button>
          <span>·</span>
          <button
            onClick={() => onLegal("safety")}
            className="hover:text-primary hover:underline cursor-pointer focus:outline-none"
          >
            Electrical Safety
          </button>
          <span>·</span>
          <button
            onClick={onOpenSecurity}
            className="hover:text-primary hover:underline cursor-pointer focus:outline-none"
          >
            Contact
          </button>
        </div>
      </div>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
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
  const [legal, setLegal] = useState<"privacy" | "terms" | "safety" | "about" | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [cloudAuthOpen, setCloudAuthOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"connected" | "reconnecting" | "unavailable">("connected");
  const [lastCheckedCloud, setLastCheckedCloud] = useState<string>("");
  const [checkingCloud, setCheckingCloud] = useState(false);
  const [cloudPopoverOpen, setCloudPopoverOpen] = useState(false);
  const [cypherDrawerOpen, setCypherDrawerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

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
    // Check initial cloud status
    performCloudCheck();
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

  // Real connection check to Supabase
  const performCloudCheck = async () => {
    setCheckingCloud(true);
    setCloudStatus("reconnecting");
    try {
      const { error } = await supabase.from("smart_watt_devices").select("device_code").limit(1);
      if (error && error.message.includes("row-level security")) {
        // Safe database reach despite RLS permission restrictions
        setCloudStatus("connected");
      } else if (error) {
        throw error;
      } else {
        setCloudStatus("connected");
      }
      setLastCheckedCloud(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Cloud status check failed", err);
      setCloudStatus("unavailable");
      setLastCheckedCloud(new Date().toLocaleTimeString());
    } finally {
      setCheckingCloud(false);
    }
  };

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
        <SignIn
          onLegal={setLegal}
          onOpenSecurity={() => setSecurityOpen(true)}
          onOpenCloudAuth={() => setCloudAuthOpen(true)}
          cloudStatus={cloudStatus}
          lastCheckedCloud={lastCheckedCloud}
          checkingCloud={checkingCloud}
          onRetryCloud={performCloudCheck}
          onOpenAbout={() => setLegal("about")}
          onOpenCloudPopover={() => setCloudPopoverOpen(true)}
        />
        <LegalModal docId={legal} onClose={() => setLegal(null)} />
        <SecurityModal
          isOpen={securityOpen}
          onClose={() => setSecurityOpen(false)}
          onOpenPrivacy={() => setLegal("privacy")}
        />
        <CloudAuthModal
          isOpen={cloudAuthOpen}
          onClose={() => setCloudAuthOpen(false)}
          onOpenPrivacy={() => setLegal("privacy")}
          onOpenTerms={() => setLegal("terms")}
        />
        <CloudStatusPopover
          isOpen={cloudPopoverOpen}
          onClose={() => setCloudPopoverOpen(false)}
          status={cloudStatus}
          lastChecked={lastCheckedCloud}
          checkingCloud={checkingCloud}
          onRetry={performCloudCheck}
        />
        <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />

        {/* Floating Pre-Login Cypher Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <motion.button
            onClick={() => setCypherDrawerOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 cursor-pointer relative"
            aria-label="Ask Cypher Helper"
            title="Ask Cypher Voice Helper"
          >
            <span className="absolute inset-0 rounded-full bg-primary/20 scale-125 blur-xs animate-pulse-glow" />
            <Mic className="h-6 w-6" />
          </motion.button>
        </div>

        {/* Right slide-out or Bottom drawer helper */}
        <PreLoginCypherDrawer
          isOpen={cypherDrawerOpen}
          onClose={() => setCypherDrawerOpen(false)}
          onOpenLegal={(id) => setLegal(id)}
        />
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
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
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
                  "group relative inline-flex h-16 min-w-[220px] items-center justify-center gap-3 rounded-2xl px-8 text-sm font-semibold uppercase tracking-widest transition-all cursor-pointer",
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
