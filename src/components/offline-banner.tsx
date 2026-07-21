import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOnline } from "@/hooks/use-online";
import { useSessionContext } from "@/cypher/context/SessionContext";

export function OfflineBanner() {
  const online = useOnline();
  const ctx = useSessionContext();

  // We consider "live control unavailable" when either browser is offline,
  // realtime channel is not connected, or the physical device is offline.
  const browserOffline = !online;
  const cloudDown = online && !ctx.realtimeConnected && ctx.isAuthenticated;
  const deviceDown =
    online && ctx.isAuthenticated && ctx.deviceRecord !== null && !ctx.deviceOnline;

  const visible = browserOffline || cloudDown || deviceDown;
  if (!visible) return null;

  const lastState = ctx.actualState === null ? "unknown" : ctx.actualState ? "ON" : "OFF";
  const lastSeen = ctx.lastUpdated
    ? new Date(ctx.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const title = browserOffline
    ? "You're offline"
    : cloudDown
      ? "Reconnecting to Cloud…"
      : "Device is offline";

  const description = browserOffline
    ? "Live commands are disabled until your connection is restored."
    : cloudDown
      ? "Live realtime channel is re-establishing. Commands are paused."
      : "Waiting for the device to come back online.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 sm:p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            {browserOffline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{title}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Last known: <span className="text-foreground font-bold">{lastState}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span>{lastSeen}</span>
          </div>
          <button
            onClick={() => ctx.refreshDevice()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition hover:border-primary/40"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Convenience predicate for gating commands. */
export function useLiveControlAvailable() {
  const online = useOnline();
  const ctx = useSessionContext();
  return (
    online &&
    ctx.isAuthenticated &&
    ctx.deviceOnline &&
    (ctx.realtimeConnected || ctx.simulationMode)
  );
}
