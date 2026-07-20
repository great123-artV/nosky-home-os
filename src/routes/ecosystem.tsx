import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { LayoutDashboard, LogOut, ShieldCheck, Mail, ArrowRight, PlusCircle } from "lucide-react";
import { useSessionContext } from "@/cypher/context/SessionContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/ecosystem")({
  ssr: false,
  component: EcosystemScreen,
});

function EcosystemScreen() {
  const sessionCtx = useSessionContext();
  const navigate = useNavigate();

  // Route protection - Redirect unauthenticated guests to /welcome
  useEffect(() => {
    if (sessionCtx.authStatus === "unauthenticated" || sessionCtx.authStatus === "expired") {
      navigate({ to: "/welcome" });
    }
  }, [sessionCtx.authStatus, navigate]);

  // Loading indicator to prevent flashing of unauthenticated UI elements
  if (sessionCtx.authStatus === "initializing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <span className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-muted-foreground/80 tracking-widest animate-pulse">
          Loading Ecosystem...
        </p>
      </div>
    );
  }

  // Double check authorization gate
  if (!sessionCtx.isAuthenticated) {
    return null;
  }

  const userEmail = sessionCtx.user?.email || "";

  return (
    <div className="flex min-h-[70vh] flex-col justify-center py-12 px-4 sm:px-6 max-w-lg mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel-elevated relative overflow-hidden border border-white/[0.08] p-6 sm:p-8 rounded-3xl w-full shadow-card text-center"
      >
        {/* Glow backdrop */}
        <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-xl pointer-events-none" />

        {/* Premium badge */}
        <div className="relative mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>

        {/* Main Heading */}
        <h1 className="font-display text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
          Welcome to your Nosky Smart ecosystem.
        </h1>

        {/* Sub-text containing Email */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-2 text-xs text-muted-foreground max-w-full">
          <Mail className="h-3.5 w-3.5 text-primary" />
          <span className="truncate">{userEmail}</span>
        </div>

        {/* Buttons section */}
        <div className="mt-8 space-y-3">
          <Link
            to="/"
            className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-sm font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.99]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Open SMART WATT Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
          </Link>

          <Link
            to="/verify-product"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-sm font-bold tracking-wide text-primary hover:bg-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlusCircle className="h-4 w-4" />
            Add NoskyTech Product
          </Link>

          <button
            onClick={() => supabase.auth.signOut()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-bold tracking-wide text-muted-foreground hover:text-foreground hover:bg-white/[0.05] hover:border-white/[0.12] transition-all active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4 text-destructive/80" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
