import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Premium SVG bulb whose glow reflects the confirmed physical state. */
export function BulbVisual({
  on,
  pending,
  online,
}: {
  on: boolean;
  pending: boolean;
  online: boolean;
}) {
  return (
    <div className="relative mx-auto grid h-56 w-56 place-items-center sm:h-64 sm:w-64">
      {/* Warm halo when ON */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.7 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.9 0.14 85 / 0.55), transparent 60%)",
        }}
      />
      {/* Cool electric ring when online */}
      <div
        className={cn(
          "absolute inset-6 rounded-full border transition-all duration-500",
          online ? "border-primary/40" : "border-border",
        )}
        style={{
          boxShadow: online
            ? "0 0 40px oklch(0.62 0.19 256 / 0.35), inset 0 0 30px oklch(0.62 0.19 256 / 0.18)"
            : "none",
        }}
      />
      {/* Pending pulse between cloud and bulb */}
      {pending && online && (
        <motion.div
          aria-hidden
          className="absolute inset-8 rounded-full border-2 border-primary/60"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Bulb SVG */}
      <svg viewBox="0 0 120 160" className="relative h-40 w-40 sm:h-44 sm:w-44" fill="none">
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="oklch(0.98 0.12 90)" stopOpacity={on ? 1 : 0.05} />
            <stop offset="55%" stopColor="oklch(0.86 0.14 82)" stopOpacity={on ? 0.6 : 0.02} />
            <stop offset="100%" stopColor="oklch(0.5 0.05 260)" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="bulbGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(1 0 0 / 0.15)" />
            <stop offset="100%" stopColor="oklch(1 0 0 / 0.03)" />
          </linearGradient>
        </defs>
        {/* Bulb body */}
        <path
          d="M60 12c-22 0-38 16-38 38 0 15 8 25 16 33 5 5 8 10 8 17v6h28v-6c0-7 3-12 8-17 8-8 16-18 16-33 0-22-16-38-38-38z"
          fill="url(#bulbGlow)"
          stroke={on ? "oklch(0.85 0.12 82)" : "oklch(0.5 0.03 258)"}
          strokeWidth={1.5}
        />
        <path
          d="M60 12c-22 0-38 16-38 38 0 15 8 25 16 33 5 5 8 10 8 17v6h28v-6c0-7 3-12 8-17 8-8 16-18 16-33 0-22-16-38-38-38z"
          fill="url(#bulbGlass)"
        />
        {/* Filament */}
        <path
          d="M48 66 Q60 46 72 66 M50 74 Q60 84 70 74"
          stroke={on ? "oklch(0.95 0.15 88)" : "oklch(0.55 0.03 258)"}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        {/* Base */}
        <rect x="44" y="112" width="32" height="8" rx="2" fill="oklch(0.4 0.02 260)" />
        <rect x="46" y="122" width="28" height="6" rx="1.5" fill="oklch(0.35 0.02 260)" />
        <rect x="48" y="130" width="24" height="6" rx="1.5" fill="oklch(0.3 0.02 260)" />
        <path d="M52 138 h16 l-4 8 h-8z" fill="oklch(0.28 0.02 260)" />
      </svg>
    </div>
  );
}
