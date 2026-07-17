import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Power, ShieldAlert, Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroBulbCardProps {
  on: boolean;          // actual/confirmed state
  desiredOn: boolean;   // commanded state
  pending: boolean;      // actual !== desired
  online: boolean;
  sending: boolean;
  onToggle: () => void;
  lastUpdated?: string;
  deviceCode: string;
}

export function HeroBulbCard({
  on,
  desiredOn,
  pending,
  online,
  sending,
  onToggle,
  lastUpdated,
  deviceCode,
}: HeroBulbCardProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  // Generate random particles for the holographic aura
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // center offset x
      y: Math.random() * -60 - 10,  // float upwards
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
    setParticles(newParticles);
  }, [on]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border transition-all duration-700 p-6 sm:p-8",
        on && online
          ? "border-amber-500/30 bg-gradient-to-br from-[#1E1710]/45 to-[#0A1020]/80 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
          : "border-white/10 bg-[#0A1020]/40 shadow-card",
      )}
    >
      {/* Soft internal glowing light that reflects bulb state */}
      <AnimatePresence>
        {on && online && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_35%_40%,_var(--color-warning),_transparent_65%)]"
          />
        )}
      </AnimatePresence>

      {/* Futuristic Background grid pattern for this card */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main card body with responsive two-column grid inside */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

        {/* LEFT COLUMN: THE PREMIUM GLASS BULB & HOLOGRAPHIC PLATFORM */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative min-h-[280px]">

          {/* Ambient Lighting & Shadows for the platform */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none">
            <AnimatePresence>
              {on && online ? (
                // Warm Amber glow
                <motion.div
                  key="on-glow"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 rounded-full blur-3xl opacity-60 bg-[radial-gradient(circle,_oklch(0.8_0.15_80),_transparent_70%)]"
                />
              ) : (
                // Soft blue standby glow
                <motion.div
                  key="off-glow"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.35, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 rounded-full blur-2xl bg-[radial-gradient(circle,_oklch(0.6_0.15_240),_transparent_75%)]"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Holographic Projection Beam (visible when on) */}
          <AnimatePresence>
            {on && online && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 0.12, height: 180 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-40 pointer-events-none bg-gradient-to-t from-cyan-500/80 via-cyan-500/10 to-transparent"
                style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" }}
              />
            )}
          </AnimatePresence>

          {/* BULB SVG COMPONENT - Floating with gentle hover effect */}
          <motion.div
            animate={on && online ? {
              y: [0, -6, 0],
            } : { y: 0 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-20 flex items-center justify-center"
          >
            <svg viewBox="0 0 120 160" className="w-40 h-40 sm:w-44 sm:h-44 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" fill="none">
              <defs>
                {/* ON STATE RADIAL GLOW */}
                <radialGradient id="bulbGlowRedesigned" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="oklch(0.98 0.12 85)" stopOpacity={on && online ? 1 : 0.05} />
                  <stop offset="40%" stopColor="oklch(0.88 0.14 78)" stopOpacity={on && online ? 0.7 : 0.02} />
                  <stop offset="100%" stopColor="oklch(0.62 0.19 256)" stopOpacity={0} />
                </radialGradient>
                {/* GLASS BASE REFLECTIONS */}
                <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
                  <stop offset="30%" stopColor="rgba(255, 255, 255, 0.05)" />
                  <stop offset="70%" stopColor="rgba(0, 0, 0, 0.4)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.03)" />
                </linearGradient>
              </defs>

              {/* Outer glass boundary */}
              <path
                d="M60 12c-22 0-38 16-38 38 0 15 8 25 16 33 5 5 8 10 8 17v6h28v-6c0-7 3-12 8-17 8-8 16-18 16-33 0-22-16-38-38-38z"
                fill="url(#bulbGlowRedesigned)"
                stroke={on && online ? "oklch(0.85 0.15 80)" : "rgba(255,255,255,0.15)"}
                strokeWidth={on && online ? 2 : 1}
                className="transition-all duration-700"
              />

              {/* Glass glare effect for 3D realism */}
              <path
                d="M60 12c-22 0-38 16-38 38 0 15 8 25 16 33 5 5 8 10 8 17v6h28v-6c0-7 3-12 8-17 8-8 16-18 16-33 0-22-16-38-38-38z"
                fill="url(#glassReflection)"
                className="mix-blend-overlay"
              />

              {/* Inner Filament */}
              <path
                d="M48 66 Q60 42 72 66 M50 74 Q60 84 70 74"
                stroke={on && online ? "oklch(0.98 0.15 85)" : "rgba(255,255,255,0.2)"}
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700"
              />

              {/* Filament vertical supports */}
              <line x1="48" y1="66" x2="48" y2="90" stroke={on && online ? "oklch(0.85 0.15 80)" : "rgba(255,255,255,0.1)"} strokeWidth={1.5} />
              <line x1="72" y1="66" x2="72" y2="90" stroke={on && online ? "oklch(0.85 0.15 80)" : "rgba(255,255,255,0.1)"} strokeWidth={1.5} />

              {/* Metal Screw Base */}
              <rect x="44" y="112" width="32" height="8" rx="2" fill="oklch(0.35 0.02 260)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
              <rect x="46" y="122" width="28" height="6" rx="1.5" fill="oklch(0.30 0.02 260)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
              <rect x="48" y="130" width="24" height="6" rx="1.5" fill="oklch(0.25 0.02 260)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
              <path d="M52 138 h16 l-4 8 h-8z" fill="oklch(0.20 0.02 260)" />
            </svg>
          </motion.div>

          {/* BLUE HOLOGRAPHIC PLATFORM */}
          <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 w-56 h-12 flex items-center justify-center pointer-events-none">
            {/* Base platform ellipse shadow */}
            <div className="absolute w-44 h-8 bg-black/60 rounded-full blur-sm transform -rotate-x-12" />

            {/* Inner holographic grid/ring 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className={cn(
                "absolute w-48 h-10 rounded-full border border-dashed transition-all duration-700",
                on && online ? "border-cyan-500/40" : "border-primary/15"
              )}
            />

            {/* Outer ring 2 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className={cn(
                "absolute w-56 h-12 rounded-full border transition-all duration-700",
                on && online
                  ? "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3),_inset_0_0_15px_rgba(6,182,212,0.3)]"
                  : "border-primary/10"
              )}
            />

            {/* Platform Bloom Core */}
            <div
              className={cn(
                "absolute w-36 h-6 rounded-full blur-[6px] transition-all duration-700",
                on && online ? "bg-cyan-500/25" : "bg-primary/5"
              )}
            />

            {/* Holographic Particles floating up */}
            <AnimatePresence>
              {on && online && particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-cyan-400"
                  style={{
                    width: p.size,
                    height: p.size,
                    boxShadow: "0 0 4px rgba(34, 211, 238, 0.8)",
                  }}
                  initial={{ opacity: 0, x: p.x, y: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    y: p.y,
                    x: p.x + (Math.random() * 20 - 10),
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: TESLA-INSPIRED CONTROL INTERACTION */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success animate-pulse" : "bg-destructive")} />
              Device Code: {deviceCode}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Nosky Bulb
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {online ? "Connected via secure Nosky Relay Core" : "Device currently offline. Commands will queue."}
            </p>
          </div>

          {/* LARGE POWER BUTTON CONTROL */}
          <div className="relative group">
            {/* Outer Halo Glow on Hover/On states */}
            <div
              className={cn(
                "absolute -inset-4 rounded-full filter blur-xl opacity-0 transition-all duration-500 group-hover:opacity-100 pointer-events-none",
                !online ? "bg-transparent" :
                on ? "bg-amber-500/20" : "bg-cyan-500/20"
              )}
            />

            {/* Custom Circular Tesla Button */}
            <button
              onClick={onToggle}
              disabled={sending || pending || !online}
              className={cn(
                "relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500 border focus:outline-none focus:ring-2 focus:ring-primary/40",
                !online
                  ? "bg-white/[0.02] border-white/5 text-muted-foreground cursor-not-allowed"
                  : pending
                    ? "bg-[#0A1020]/80 border-primary/40 text-primary"
                    : on
                      ? "bg-gradient-to-br from-[#1E1710]/90 to-[#3A2A1A]/95 border-amber-500/50 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                      : "bg-[#0F172A]/80 border-white/15 text-cyan-400 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              )}
            >
              {/* Spinning/rotating ring during waiting */}
              {pending && (
                <svg className="absolute inset-0 h-full w-full -rotate-90 animate-spin" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray="289"
                    strokeDashoffset="100"
                    className="text-primary"
                  />
                </svg>
              )}

              {/* Pulsing overlay ring when confirmed and on */}
              {on && online && !pending && (
                <motion.div
                  className="absolute inset-1 rounded-full border-2 border-amber-500/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Glowing core indicator */}
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500",
                  !online ? "bg-white/[0.02]" :
                  pending ? "bg-primary/5" :
                  on ? "bg-amber-500/10" : "bg-cyan-500/5"
                )}
              >
                {sending || pending ? (
                  <Loader2 className="h-8 w-8 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Power className="h-8 w-8" strokeWidth={2.5} />
                )}
              </div>
            </button>
          </div>

          {/* Status Label */}
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Command State
            </span>
            <span
              className={cn(
                "text-lg font-bold mt-0.5 tracking-wide",
                !online ? "text-muted-foreground" :
                pending ? "text-primary animate-pulse" :
                on ? "text-amber-400" : "text-cyan-400"
              )}
            >
              {!online ? "OFFLINE" : pending ? "SYNCING…" : on ? "CONFIRMED ON" : "CONFIRMED OFF"}
            </span>
          </div>
        </div>

      </div>

      {/* Footer metadata details inside card */}
      <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {pending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Transmitting state to cloud...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span>System synchronized</span>
            </>
          )}
        </span>
        {lastUpdated && (
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Last Synced: {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
}
export default HeroBulbCard;
