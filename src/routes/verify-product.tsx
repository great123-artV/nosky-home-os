import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/verify-product")({
  ssr: false,
  component: VerifyProductScreen,
});

function VerifyProductScreen() {
  return (
    <div className="flex min-h-[80vh] flex-col justify-between py-12 px-4 sm:px-6 max-w-lg mx-auto">
      {/* Top Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center"
      >
        <Link
          to="/welcome"
          className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
      </motion.div>

      {/* Main Content Card */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-panel border border-white/[0.08] p-8 rounded-3xl w-full max-w-md shadow-card relative overflow-hidden"
        >
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-xl pointer-events-none" />

          <div className="relative mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="font-display text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
            Product Verification
          </h1>

          <p className="mt-3 text-sm text-muted-foreground/90 leading-relaxed">
            Product verification coming next.
          </p>
        </motion.div>
      </div>

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center text-[11px] text-muted-foreground/40"
      >
        © 2026 NoskyTech · Hardware Handshake Protocol
      </motion.div>
    </div>
  );
}
