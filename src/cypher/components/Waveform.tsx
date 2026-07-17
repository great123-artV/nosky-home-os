import { motion } from "motion/react";

export function Waveform() {
  const bars = Array.from({ length: 9 });
  return (
    <div className="flex h-8 items-center justify-center gap-1">
      {bars.map((_, idx) => {
        // Create an organic fluid movement using varying animations and delays
        const duration = 0.6 + idx * 0.1;
        return (
          <motion.span
            key={idx}
            animate={{
              scaleY: [0.3, 1, 0.3],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1 rounded-full bg-primary"
            style={{
              height: "24px",
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
}
export default Waveform;
