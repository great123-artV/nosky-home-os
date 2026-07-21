import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Power,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Cloud,
  Server,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { InstallPwaButton } from "./install-pwa";

interface SignInProps {
  onLegal: (docId: "terms" | "privacy") => void;
  onSuccess?: () => void;
}

export function SignIn({ onLegal, onSuccess }: SignInProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSignUpSuccess(false);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;

        // If the user is immediately signed in (auto-confirm enabled)
        if (data.session) {
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // Requires email confirmation
          setSignUpSuccess(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onSuccess) {
          onSuccess();
        }
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
              <p className="font-display text-lg font-bold tracking-[0.2em] text-foreground">
                SMART WATT
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80">
                NoskyTech OS
              </p>
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
            <FeatureChip
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Zero Anonymous Access"
            />
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
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
                {isSignUp ? "Create an account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isSignUp
                  ? "Get started with your NoskyTech unified account."
                  : "Sign in to control your SMART WATT device."}
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary lg:hidden">
              <Zap className="h-4.5 w-4.5" strokeWidth={2.4} />
            </span>
          </div>

          {/* Premium tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.02] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErr(null);
                setSignUpSuccess(false);
              }}
              className={`rounded-lg py-2 text-xs font-bold tracking-wide transition-all ${
                !isSignUp
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErr(null);
                setSignUpSuccess(false);
              }}
              className={`rounded-lg py-2 text-xs font-bold tracking-wide transition-all ${
                isSignUp
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {signUpSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
            >
              <Sparkles className="mx-auto h-8 w-8 text-primary animate-pulse" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Verification email sent!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please check your inbox at{" "}
                <span className="text-foreground font-semibold">{email}</span> and click the
                confirmation link to complete your signup.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setSignUpSuccess(false);
                }}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Back to Sign In
              </button>
            </motion.div>
          ) : (
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
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPw((v) => !v);
                    }}
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
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {busy
                  ? "Processing…"
                  : isSignUp
                    ? "Create NoskyTech Account"
                    : "Sign in to SMART WATT"}
              </button>
            </form>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              or
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <div className="mt-5 flex justify-center">
            <InstallPwaButton variant="ghost" label="Install SMART WATT" />
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By signing in, you agree to the SMART WATT{" "}
            <button
              type="button"
              onClick={() => onLegal("terms")}
              className="text-primary hover:underline"
            >
              Terms of Use
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => onLegal("privacy")}
              className="text-primary hover:underline"
            >
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
