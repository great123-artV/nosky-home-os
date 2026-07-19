import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Sparkles } from "lucide-react";
import { useSessionContext } from "@/cypher/context/SessionContext";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  component: WelcomeScreen,
});

function WelcomeScreen() {
  const sessionCtx = useSessionContext();
  const navigate = useNavigate();

  // Redirect if session is already authenticated
  useEffect(() => {
    if (sessionCtx.authStatus === "authenticated") {
      navigate({ to: "/ecosystem" });
    }
  }, [sessionCtx.authStatus, navigate]);

  return (
    <div className="flex min-h-[80vh] flex-col justify-between py-12 px-4 sm:px-6">
      {/* Top Section: Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center space-y-2"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-display text-xs font-bold tracking-[0.25em] text-foreground uppercase">
            NoskyTech
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
            NOSKY SMART
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60 tracking-widest uppercase">
            <Sparkles className="h-2.5 w-2.5" /> Powered by Cypher
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center my-8">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl"
        >
          Your NoskyTech
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
            ecosystem starts here.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-4 text-sm leading-relaxed text-muted-foreground/90 max-w-md"
        >
          Connect, control and manage every NoskyTech product from one intelligent account.
        </motion.p>
      </div>

      {/* Action Area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center max-w-sm mx-auto w-full space-y-4"
      >
        <Link
          to="/verify-product"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-[0.99]"
        >
          Get Started
        </Link>

        <Link
          to="/sign-in"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-bold tracking-wide text-foreground transition-all hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.99]"
        >
          Sign In
        </Link>

        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 text-center pt-2">
          One account. Every NoskyTech product.
        </p>
      </motion.div>
    </div>
  );
}
