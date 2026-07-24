import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Redesigned Flagship 3D Glassmorphic Bulb with detailed metallic screw base,
 * glowing filament, 3D refraction overlays, controlled warm bloom spillover,
 * and an animated rotating holographic platform underneath.
 */
export function BulbVisual({
  on,
  pending,
  online,
}: {
  on: boolean;
  pending: boolean;
  online: boolean;
}) {
  const isOffline = !online;

  return (
    <div className="relative mx-auto flex h-72 w-full flex-col items-center justify-center overflow-visible">
      {/* 1. Controlled warm bloom spillover / floor reflection when ON */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{
          opacity: on && online ? 1 : 0,
          scale: on && online ? 1.15 : 0.6,
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-[10%] h-48 w-48 rounded-full blur-[44px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.14 85 / 0.45) 0%, oklch(0.62 0.19 256 / 0.05) 50%, transparent 75%)",
        }}
      />

      {/* 2. Soft Rim Lighting / Ambient Platform base glow */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{
          opacity: online ? (on ? 0.85 : 0.4) : 0.1,
          scale: on ? 1.05 : 0.95,
        }}
        className={cn(
          "absolute bottom-[10%] h-14 w-48 rounded-full blur-md opacity-30 transition-all duration-700 pointer-events-none",
          on ? "bg-amber-500/20" : "bg-primary/20",
        )}
      />

      {/* 3. Holographic Platform & Subtle Orbiting Rings underneath */}
      <div className="absolute bottom-[2%] flex h-16 w-64 items-center justify-center pointer-events-none [perspective:1000px] [transform-style:preserve-3d]">
        {/* Deep Platform Shadow */}
        <div className="absolute h-4 w-44 rounded-full bg-black/60 blur-[6px] [transform:rotateX(75deg)_translateZ(-10px)]" />

        {/* Primary Holographic Ring */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn(
            "absolute h-16 w-52 rounded-full border border-dashed transition-colors duration-700 [transform:rotateX(75deg)]",
            isOffline
              ? "border-white/5"
              : on
                ? "border-amber-400/30 shadow-[0_0_12px_oklch(0.82_0.14_85_/_15%)]"
                : "border-primary/25 shadow-[0_0_12px_oklch(0.62_0.19_256_/_10%)]",
          )}
        />

        {/* Reverse rotating Inner Ring */}
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className={cn(
            "absolute h-10 w-36 rounded-full border border-double transition-colors duration-700 [transform:rotateX(75deg)]",
            isOffline ? "border-white/5" : on ? "border-amber-400/40" : "border-primary/30",
          )}
        />

        {/* Solid glowing platform core disc */}
        <div
          className={cn(
            "absolute h-14 w-44 rounded-full border border-white/[0.04] transition-all duration-700 [transform:rotateX(75deg)]",
            isOffline
              ? "bg-white/[0.01]"
              : on
                ? "bg-amber-400/[0.04] shadow-[0_0_20px_oklch(0.82_0.14_85_/_20%)]"
                : "bg-primary/[0.03] shadow-[0_0_20px_oklch(0.62_0.19_256_/_15%)]",
          )}
        />

        {/* Dynamic pending state progress ring */}
        {pending && online && (
          <motion.div
            aria-hidden
            className="absolute h-16 w-52 rounded-full border-[2px] border-primary"
            initial={{ scale: 0.8, opacity: 0.9, rotateX: 75 }}
            animate={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>

      {/* 4. High-Fidelity 3D-feeling Bulb SVG */}
      <motion.svg
        viewBox="0 0 140 180"
        className={cn(
          "relative z-10 h-44 w-44 transition-all duration-700",
          isOffline && "opacity-45 grayscale-[20%]",
          on && online ? "animate-float" : "",
        )}
        fill="none"
      >
        <defs>
          {/* Main 3D glass bulb glow */}
          <radialGradient id="bulbGlow" cx="50%" cy="42%" r="55%">
            <stop
              offset="0%"
              stopColor="oklch(0.96 0.14 85)"
              stopOpacity={on && online ? 1 : 0.05}
            />
            <stop
              offset="30%"
              stopColor="oklch(0.88 0.16 80)"
              stopOpacity={on && online ? 0.85 : 0.02}
            />
            <stop
              offset="70%"
              stopColor="oklch(0.62 0.19 256)"
              stopOpacity={on && online ? 0.35 : 0.01}
            />
            <stop offset="100%" stopColor="oklch(0.12 0.025 256)" stopOpacity={0} />
          </radialGradient>

          {/* Glass shading reflection overlays */}
          <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="40%" stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="black" stopOpacity="0.45" />
          </linearGradient>

          {/* Luminous Core / Filament glow */}
          <radialGradient id="filamentGlow" cx="50%" cy="48%" r="40%">
            <stop offset="0%" stopColor="white" stopOpacity={on && online ? 1 : 0.1} />
            <stop
              offset="60%"
              stopColor="oklch(0.85 0.16 85)"
              stopOpacity={on && online ? 0.9 : 0.05}
            />
            <stop offset="100%" stopColor="oklch(0.82 0.14 85)" stopOpacity={0} />
          </radialGradient>

          {/* High resolution metallic screw gradient */}
          <linearGradient id="metallicBase" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.35 0.02 256)" />
            <stop offset="25%" stopColor="oklch(0.65 0.02 256)" />
            <stop offset="50%" stopColor="oklch(0.45 0.02 256)" />
            <stop offset="75%" stopColor="oklch(0.75 0.02 256)" />
            <stop offset="100%" stopColor="oklch(0.28 0.02 256)" />
          </linearGradient>

          {/* Specular highlights for realistic 3D feel */}
          <linearGradient id="specularGlint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient shadow inside the bulb shell */}
        <path
          d="M70 15c-26 0-44 19-44 44 0 17 9 29 18 38 6 6 9 12 9 20v6h34v-6c0-8 3-14 9-20 9-9 18-21 18-38 0-25-18-44-44-44z"
          fill="oklch(1 0 0 / 1.5%)"
        />

        {/* Glow fill layer when bulb is ON */}
        <path
          d="M70 15c-26 0-44 19-44 44 0 17 9 29 18 38 6 6 9 12 9 20v6h34v-6c0-8 3-14 9-20 9-9 18-21 18-38 0-25-18-44-44-44z"
          fill="url(#bulbGlow)"
        />

        {/* Realistic Glassmorphic Overlay Shell */}
        <path
          d="M70 15c-26 0-44 19-44 44 0 17 9 29 18 38 6 6 9 12 9 20v6h34v-6c0-8 3-14 9-20 9-9 18-21 18-38 0-25-18-44-44-44z"
          fill="url(#glassReflection)"
          stroke={on && online ? "oklch(0.85 0.12 82 / 40%)" : "oklch(1 0 0 / 12%)"}
          strokeWidth="1.5"
        />

        {/* Glossy Curved Highlight (Outer 3D Glass refraction glint) */}
        <path
          d="M32 55c0-18 13-33 30-37-12 5-21 17-21 32 0 11 5 19 11 25-5-5-10-12-10-20z"
          fill="url(#specularGlint)"
          className="opacity-70"
        />

        {/* Filament Glowing Core */}
        <g className="transition-transform duration-500">
          {/* Filament Base Support Wires */}
          <path d="M58 115 L62 82 M82 115 L78 82" stroke="oklch(0.45 0.02 256)" strokeWidth="1.2" />

          {/* Active core emitter aura */}
          <circle
            cx="70"
            cy="70"
            r="20"
            fill="url(#filamentGlow)"
            className="pointer-events-none"
          />

          {/* Premium Coiled Filament Wire */}
          <path
            d="M61 82 Q70 60 79 82 M64 90 Q70 100 76 90"
            stroke={on && online ? "oklch(0.96 0.15 85)" : "oklch(0.55 0.03 258 / 50%)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="filter drop-shadow-[0_0_4px_oklch(0.85_0.14_85_/_80%)]"
          />
        </g>

        {/* Metallic Base Shading - detailed realistic E27 screw base */}
        <g>
          {/* Thread 1 */}
          <path
            d="M51 123 h38 c2 0, 4 2, 4 4 v4 c0 2, -2 4, -4 4 h-38 c-2 0, -4 -2, -4 -4 v-4 c0 -2, 2 -4, 4 -4z"
            fill="url(#metallicBase)"
          />
          {/* Thread 2 */}
          <path
            d="M53 133 h34 c2 0, 4 2, 4 4 v4 c0 2, -2 4, -4 4 h-34 c-2 0, -4 -2, -4 -4 v-4 c0 -2, 2 -4, 4 -4z"
            fill="url(#metallicBase)"
          />
          {/* Thread 3 */}
          <path
            d="M55 143 h30 c2 0, 4 2, 4 4 v4 c0 2, -2 4, -4 4 h-30 c-2 0, -4 -2, -4 -4 v-4 c0 -2, 2 -4, 4 -4z"
            fill="url(#metallicBase)"
          />
          {/* Bottom contact terminal */}
          <path d="M59 153 h22 l-4 8 h-14z" fill="oklch(0.2 0.01 256)" />
        </g>
      </motion.svg>
    </div>
  );
}
