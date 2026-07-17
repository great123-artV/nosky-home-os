import { motion } from "motion/react";
import { Mic, MicOff, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { UseCypherReturn } from "../hooks/useCypher";
import { cn } from "@/lib/utils";

interface CypherFloatingButtonProps {
  cypher: UseCypherReturn;
  onClick: () => void;
}

export function CypherFloatingButton({ cypher, onClick }: CypherFloatingButtonProps) {
  const { state, settings } = cypher;

  const isListening = state === "listening";
  const isBusy = state === "processing" || state === "executing";
  const isSpeaking = state === "speaking";
  const isError =
    state === "offline" || state === "permission_required" || state === "microphone_disabled";

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      {/* Glow rings container */}
      <div className="relative">
        {/* Breathing background glow circle when speaking */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30 filter blur-md"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Pulsing expand wave when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          </>
        )}

        {/* Master click button */}
        <button
          onClick={onClick}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full shadow-glow transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
            isListening
              ? "bg-primary text-primary-foreground"
              : isSpeaking
                ? "bg-primary text-primary-foreground"
                : isError
                  ? "bg-destructive text-destructive-foreground border border-destructive/50"
                  : settings.alwaysOnListening
                    ? "bg-[#07101F] text-primary border border-primary/50 hover:bg-primary/10"
                    : "bg-[#07101F] text-foreground border border-white/10 hover:bg-white/[0.05]",
          )}
          aria-label={isListening ? "Stop Cypher" : "Open Cypher menu"}
          title={isListening ? "Stop listening" : "Ask Cypher"}
        >
          {isBusy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-6 w-6" />
          ) : isSpeaking ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 animate-pulse" />
            </motion.div>
          ) : isError ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}

          {/* Active indicator dot if Always-On Listening is active and we are sleeping */}
          {settings.alwaysOnListening && state === "sleeping" && (
            <span className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
export default CypherFloatingButton;
