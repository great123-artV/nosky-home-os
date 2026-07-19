import { useState } from "react";
import { Download, Share, Plus, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

interface InstallButtonProps {
  className?: string;
  label?: string;
  variant?: "primary" | "ghost" | "compact";
}

export function InstallPwaButton({ className, label = "Install SMART WATT", variant = "primary" }: InstallButtonProps) {
  const { canPrompt, promptInstall, showIOSInstructions, installed } = usePwaInstall();
  const [showIOS, setShowIOS] = useState(false);

  if (installed) return null;
  if (!canPrompt && !showIOSInstructions) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
    } else if (showIOSInstructions) {
      setShowIOS(true);
    }
  };

  const base =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-11 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_oklch(0.62_0.19_256_/_40%)]"
      : variant === "compact"
        ? "inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 h-8 text-[11px] font-semibold text-primary hover:bg-primary/15"
        : "inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 h-11 text-sm font-semibold text-foreground hover:border-primary/40";

  return (
    <>
      <button type="button" onClick={handleClick} className={cn(base, className)}>
        <Download className={cn(variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {label}
      </button>
      <IOSInstallSheet open={showIOS} onClose={() => setShowIOS(false)} />
    </>
  );
}

export function IOSInstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-white/[0.08] bg-[#050914] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
                    Install on iPhone
                  </p>
                  <p className="text-[11px] text-muted-foreground">Add SMART WATT to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                  1
                </span>
                <span className="flex items-center gap-2">
                  Tap the <Share className="inline h-4 w-4 text-primary" /> Share button in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                  2
                </span>
                <span className="flex items-center gap-2">
                  Scroll and choose <Plus className="inline h-4 w-4 text-primary" /> <b>Add to Home Screen</b>.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                  3
                </span>
                <span>
                  Tap <b>Add</b> — SMART WATT will appear as an app on your Home Screen.
                </span>
              </li>
            </ol>

            <p className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Note: iOS only supports installation from <b>Safari</b>. If you're inside Chrome or another
              browser, open this page in Safari first.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
