import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, HelpCircle, CornerDownLeft, AlertCircle } from "lucide-react";
import { UseCypherReturn } from "@/cypher/hooks/useCypher";
import { Waveform } from "@/cypher/components/Waveform";
import { cn } from "@/lib/utils";

interface CypherCardProps {
  cypher: UseCypherReturn;
}

export function CypherCard({ cypher }: CypherCardProps) {
  const {
    state,
    statusMessage,
    transcript,
    interimTranscript,
    settings,
    handleMicrophoneClick,
    executeIntent,
  } = cypher;

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isError = state === "offline" || state === "permission_required" || state === "microphone_disabled";
  const isSleeping = state === "sleeping";

  // Recommended commands to inspire interaction
  const suggestions = [
    { text: "Turn on the bulb", label: "Turn ON" },
    { text: "Turn off the bulb", label: "Turn OFF" },
    { text: "Tell me about NoskyTech", label: "About NoskyTech" },
    { text: "Is the bulb online?", label: "Status Check" },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border transition-all duration-500 p-5 sm:p-6 shadow-card hover:shadow-glow",
        isListening
          ? "border-primary/40 bg-gradient-to-br from-[#0A1020]/80 to-[#101E35]/45"
          : "border-white/10 bg-[#0A1020]/40"
      )}
    >
      {/* Outer pulsing glow for AI status states */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-primary"
          />
        )}
      </AnimatePresence>

      {/* Futuristic backdrop layout indicators */}
      <div className="absolute right-4 top-4 text-[10px] text-muted-foreground/30 font-mono select-none">
        VOICE LAYER V2.5
      </div>

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Mic className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-foreground">
              CYPHER COGNITION
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Universal voice interface
            </p>
          </div>
        </div>

        {/* Dynamic State Pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-all duration-300",
            isListening ? "border-primary/30 bg-primary/20 text-primary animate-pulse" :
            isSpeaking ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
            isError ? "border-destructive/30 bg-destructive/15 text-destructive" :
            "border-white/5 bg-white/[0.02] text-muted-foreground"
          )}
        >
          {isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isError ? "ATTENTION" : "READY"}
        </span>
      </div>

      {/* Central Visual Area: Animated Avatar & Status Message */}
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <div className="relative">
          {/* Outer Breathing rings around avatar */}
          <AnimatePresence>
            {(isListening || isSpeaking) && (
              <>
                <motion.div
                  className="absolute -inset-4 rounded-full border border-primary/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-primary/10"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Interactive AI Avatar Orb */}
          <button
            onClick={handleMicrophoneClick}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 border focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-inner",
              isListening
                ? "bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border-cyan-500/60 text-cyan-400"
                : isSpeaking
                  ? "bg-gradient-to-tr from-amber-500/20 to-orange-600/30 border-amber-500/60 text-amber-400"
                  : "bg-white/[0.02] border-white/10 hover:border-primary/40 text-foreground"
            )}
          >
            {isListening ? (
              <Sparkles className="h-8 w-8 animate-pulse text-cyan-400" />
            ) : isSpeaking ? (
              <Volume2 className="h-8 w-8 animate-bounce text-amber-400" />
            ) : (
              <Mic className="h-8 w-8 text-primary" />
            )}
          </button>
        </div>

        {/* Action Instruction / State Details */}
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground">
            {statusMessage}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {settings.alwaysOnListening
              ? `Always-On active. Say "Hey Cypher"`
              : "Tap the avatar or floating trigger to speak"}
          </p>
        </div>

        {/* Live Audio Transcript Streaming Panel */}
        <AnimatePresence>
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-xs rounded-xl bg-black/40 p-3 border border-white/5 text-center"
            >
              <p className="text-xs text-foreground leading-relaxed italic font-medium">
                {transcript && <span className="text-foreground">"{transcript}"</span>}
                {interimTranscript && <span className="text-muted-foreground/80"> {interimTranscript}...</span>}
              </p>
              {isListening && (
                <div className="mt-2 flex justify-center">
                  <Waveform />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Voice Triggers */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Suggested commands</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((cmd) => (
            <button
              key={cmd.text}
              onClick={() => {
                const triggerIntent = cmd.text.toLowerCase().includes("turn on") ? "TURN_ON" as const :
                                     cmd.text.toLowerCase().includes("turn off") ? "TURN_OFF" as const :
                                     cmd.text.toLowerCase().includes("online") ? "GET_DEVICE_STATUS" as const : "EXPLAIN_NOSKYTECH" as const;
                void executeIntent(triggerIntent, cmd.text);
              }}
              className="flex items-center justify-between text-left p-2 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 group"
            >
              <span className="text-[10px] font-medium text-muted-foreground truncate group-hover:text-foreground">
                {cmd.label}
              </span>
              <CornerDownLeft className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default CypherCard;
