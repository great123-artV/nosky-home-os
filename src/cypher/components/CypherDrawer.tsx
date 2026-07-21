import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trash2,
  Sliders,
  Info,
  MessageSquare,
  ExternalLink,
  Settings,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { UseCypherReturn } from "../hooks/useCypher";
import { cypherHistoryService } from "../history/historyService";
import { useSessionContext } from "../context/SessionContext";
import { parseCypherIntent } from "../intents/cypherIntentRouter";
import { cypherKnowledgeService } from "../services/cypherKnowledgeService";
import { QuickSettings } from "./QuickSettings";
import { Waveform } from "./Waveform";

interface CypherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cypher: UseCypherReturn;
}

export function CypherDrawer({ isOpen, onClose, cypher }: CypherDrawerProps) {
  const {
    state,
    history,
    statusMessage,
    transcript,
    interimTranscript,
    settings,
    followUpCountdown,
  } = cypher;

  const sessionCtx = useSessionContext();
  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  // Deriving real-time intent match results for Developer Diagnostics panel
  const currentText = transcript || interimTranscript || "";
  const parsedIntent = currentText ? parseCypherIntent(currentText) : null;
  const knowledgeMatch = currentText
    ? cypherKnowledgeService.queryKnowledge(currentText, sessionCtx.isAuthenticated)
    : null;

  // Sanitize and copy diagnostics report
  const handleCopyDiagnostics = () => {
    const report = {
      rawTranscript: currentText || "None",
      normalizedTranscript: currentText ? currentText.toLowerCase().trim() : "None",
      detectedIntent: parsedIntent?.intent || "UNKNOWN",
      matchedPattern: parsedIntent?.matchedPattern || "None",
      confidence: parsedIntent?.confidence ?? 0,
      selectedEngine: parsedIntent?.engine || "fallback",
      authStatus: sessionCtx.authStatus,
      userIdSanitized: sessionCtx.user?.id
        ? `USR-${sessionCtx.user.id.substring(0, 8)}...`
        : "Unauthenticated",
      deviceId: sessionCtx.deviceId || "None",
      deviceOnline: sessionCtx.deviceOnline ? "ONLINE" : "OFFLINE",
      realtimeConnected: sessionCtx.realtimeConnected ? "CONNECTED" : "DISCONNECTED",
      networkOnline: sessionCtx.networkOnline ? "ONLINE" : "OFFLINE",
      desiredState: sessionCtx.desiredState ? "ON" : "OFF",
      actualState: sessionCtx.actualState ? "ON" : "OFF",
      pendingCommand: sessionCtx.pendingCommand
        ? JSON.stringify(sessionCtx.pendingCommand)
        : "None",
      knowledgeMatchKey: knowledgeMatch?.item?.id || "None",
      knowledgeSource: knowledgeMatch?.item?.source || "None",
      microphoneStatus: sessionCtx.microphonePermission,
      lastError: sessionCtx.lastError || "None",
      environment: import.meta.env.MODE,
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <h2
              id="cypher-title"
              className="font-display text-sm font-bold tracking-widest text-foreground"
            >
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
            <div
              className="absolute top-0 right-0 h-20 w-20 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(249,115,22,0.1), transparent 70%)",
              }}
            />

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Active Session
              </p>
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
                    {transcript && (
                      <span className="text-foreground font-medium">"{transcript}"</span>
                    )}
                    {interimTranscript && (
                      <span className="text-muted-foreground/80 italic">
                        {" "}
                        {interimTranscript}...
                      </span>
                    )}
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
            {state !== "sleeping" && state !== "offline" && (
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
                  <div
                    key={it.id}
                    className="rounded-xl border border-white/5 bg-background/30 p-3 flex justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">"{it.command}"</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {it.result}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          it.status === "Completed"
                            ? "bg-success/15 text-success"
                            : it.status === "Answered"
                              ? "bg-primary/15 text-primary"
                              : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {it.status}
                      </span>
                      <p className="mt-1 text-[8px] text-muted-foreground">
                        {new Date(it.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
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
              className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#050914]/40 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              About Cypher <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Hidden Developer Panel (Diagnostics tab) - Rendered only in Development (Requirement 4) */}
          {import.meta.env.DEV && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 space-y-3">
              <button
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-widest text-emerald-400"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 animate-pulse" />
                  Developer Diagnostics
                </span>
                <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400">
                  {showDiagnostics ? "Hide" : "Show"}
                </span>
              </button>

              <AnimatePresence>
                {showDiagnostics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3.5 pt-2 border-t border-emerald-500/10"
                  >
                    <div className="space-y-2 text-[10px] font-mono text-emerald-300 leading-relaxed max-h-[14rem] overflow-y-auto pr-1">
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Raw Transcript:</span>
                        <span className="text-foreground max-w-[200px] truncate text-right">
                          "{currentText || "None"}"
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Detected Intent:</span>
                        <span className="text-white font-bold">
                          {parsedIntent?.intent || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Confidence Score:</span>
                        <span className="text-white">{parsedIntent?.confidence ?? 0}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Engine Selected:</span>
                        <span className="text-white capitalize">
                          {parsedIntent?.engine || "fallback"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Auth Flow State:</span>
                        <span className="text-white uppercase">{sessionCtx.authStatus}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>User UUID:</span>
                        <span className="text-white truncate max-w-[180px]">
                          {sessionCtx.user?.id || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Target Device ID:</span>
                        <span className="text-white">{sessionCtx.deviceId || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Device Online State:</span>
                        <span
                          className={sessionCtx.deviceOnline ? "text-emerald-400" : "text-red-400"}
                        >
                          {sessionCtx.deviceOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Realtime Status:</span>
                        <span
                          className={
                            sessionCtx.realtimeConnected ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {sessionCtx.realtimeConnected ? "CONNECTED" : "DISCONNECTED"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Client Internet Connection:</span>
                        <span className="text-white">
                          {sessionCtx.networkOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Relay (Desired vs Actual):</span>
                        <span className="text-white">
                          Desired: {sessionCtx.desiredState ? "ON" : "OFF"} | Actual:{" "}
                          {sessionCtx.actualState ? "ON" : "OFF"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Pending Handshake Cmd:</span>
                        <span className="text-white truncate max-w-[150px]">
                          {sessionCtx.pendingCommand
                            ? JSON.stringify(sessionCtx.pendingCommand)
                            : "None"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Knowledge Match Key:</span>
                        <span className="text-white">{knowledgeMatch?.item?.id || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Knowledge Match Source:</span>
                        <span className="text-white">{knowledgeMatch?.item?.source || "None"}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Voice Output Mode:</span>
                        <span className="text-white uppercase">{cypher.activeVoiceMode}</span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Microphone Status:</span>
                        <span className="text-white capitalize">
                          {sessionCtx.microphonePermission}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-emerald-500/5 pb-1">
                        <span>Last Captured Error:</span>
                        <span className="text-red-400 truncate max-w-[180px]">
                          {sessionCtx.lastError || "None"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCopyDiagnostics}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Sanatized Report Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Diagnostics Report
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Privacy statement warning */}
          <div className="rounded-xl border border-white/5 bg-background/40 p-3.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong>Privacy Disclosure:</strong> When Always-On Listening is enabled, Cypher
                keeps the microphone active during the current supported app session to detect its
                wake phrase. Browser and operating-system restrictions may stop listening in the
                background. Raw microphone recordings are never stored by default.
              </span>
            </p>
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
export default CypherDrawer;
