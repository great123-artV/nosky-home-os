import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Sliders, Info, MessageSquare, ExternalLink, Settings, ShieldAlert } from "lucide-react";
import { UseCypherReturn } from "../hooks/useCypher";
import { cypherHistoryService } from "../history/historyService";
import { QuickSettings } from "./QuickSettings";
import { Waveform } from "./Waveform";

interface CypherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cypher: UseCypherReturn;
}

export function CypherDrawer({ isOpen, onClose, cypher }: CypherDrawerProps) {
  const { state, history, statusMessage, transcript, interimTranscript, settings, followUpCountdown } = cypher;
  const historyEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Drawer Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black backdrop-blur-sm"
      />

      {/* Drawer Panel Container */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-[#07101F]/95 shadow-glow backdrop-blur-xl sm:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cypher-title"
      >
        {/* Drawer Header */}
        <header className="flex h-14 items-center justify-between border-b border-white/5 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <h2 id="cypher-title" className="font-display text-sm font-bold tracking-widest text-foreground">
              CYPHER VOICE LAYER
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Close Cypher"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable Contents */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6 sm:p-6 scrollbar-thin">
          {/* Active Listening / Speaking Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(249,115,22,0.1), transparent 70%)" }} />

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Session</p>
              {followUpCountdown !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-500">
                  Follow-up: {followUpCountdown}s
                </span>
              )}
            </div>

            <div className="min-h-[4rem] flex flex-col justify-center space-y-2">
              <p className="text-sm font-medium text-foreground">{statusMessage}</p>

              {/* Interim / Streaming Transcript Display */}
              {(transcript || interimTranscript) && (
                <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {transcript && <span className="text-foreground font-medium">"{transcript}"</span>}
                    {interimTranscript && <span className="text-muted-foreground/80 italic"> {interimTranscript}...</span>}
                  </p>
                </div>
              )}

              {/* Dynamic waveform rendering */}
              {state === "listening" && (
                <div className="pt-2">
                  <Waveform />
                </div>
              )}
            </div>

            {/* Stop Action Bar */}
            {(state !== "sleeping" && state !== "offline") && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => cypher.handleStop()}
                  className="rounded-lg bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-500 border border-red-500/20 hover:bg-red-600/20"
                >
                  Stop Cypher
                </button>
              </div>
            )}
          </div>

          {/* Quick Settings Panel */}
          <QuickSettings settings={settings} />

          {/* Conversation logs History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Recent Activity
              </span>
              {history.length > 0 && (
                <button
                  onClick={() => cypherHistoryService.clearHistory()}
                  className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-background/10 p-6 text-center">
                <p className="text-xs text-muted-foreground">No recent voice conversation logs.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[16rem] overflow-y-auto pr-1">
                {history.map((it) => (
                  <div key={it.id} className="rounded-xl border border-white/5 bg-background/30 p-3 flex justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">"{it.command}"</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{it.result}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        it.status === "Completed" ? "bg-success/15 text-success" :
                        it.status === "Answered" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                      }`}>
                        {it.status}
                      </span>
                      <p className="mt-1 text-[8px] text-muted-foreground">
                        {new Date(it.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            )}
          </div>

          {/* Full Settings & support link redirection buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                window.location.assign("/settings");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-background/40 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              <Settings className="h-4 w-4" /> Full Settings
            </button>
            <a
              href="https://noskytech.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-background/40 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              About Cypher <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Privacy statement warning */}
          <div className="rounded-xl border border-white/5 bg-background/40 p-3.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong>Privacy Disclosure:</strong> When Always-On Listening is enabled, Cypher keeps the microphone active during the current supported app session to detect its wake phrase. Browser and operating-system restrictions may stop listening in the background. Raw microphone recordings are never stored by default.
              </span>
            </p>
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
export default CypherDrawer;
