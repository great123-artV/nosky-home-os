import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, MicOff, Loader2, X, Send } from "lucide-react";
import { getSpeechRecognitionCtor, parseCypherIntent, speak, type CypherIntent } from "@/lib/cypher";
import { cn } from "@/lib/utils";

export type CypherState = "idle" | "listening" | "processing" | "sending" | "waiting" | "success" | "error";

export type CypherAction = {
  intent: CypherIntent;
  transcript: string;
};

/**
 * Cypher panel — voice control + text fallback. Never routes free-form text into the database.
 * The consumer decides what to do with the (validated) intent via `onIntent`.
 */
export function CypherPanel({
  voiceEnabled,
  speechEnabled,
  language,
  externalState,
  externalMessage,
  onIntent,
}: {
  voiceEnabled: boolean;
  speechEnabled: boolean;
  language: string;
  /** Consumer-driven state after an intent has been dispatched. */
  externalState?: CypherState;
  externalMessage?: string;
  onIntent: (action: CypherAction) => void;
}) {
  const [localState, setLocalState] = useState<CypherState>("idle");
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSpeechRecognitionCtor>>> | null>(null);
  const supportsVoice = !!getSpeechRecognitionCtor();

  // Derive live state
  const state: CypherState = externalState && externalState !== "idle" ? externalState : localState;
  const message =
    externalMessage ??
    (state === "listening"
      ? "Listening…"
      : state === "processing"
        ? "Understanding command…"
        : state === "sending"
          ? "Sending command…"
          : state === "waiting"
            ? "Waiting for BULB confirmation…"
            : state === "success"
              ? "Command confirmed"
              : state === "error"
                ? error ?? "Something went wrong"
                : "Ask Cypher");

  useEffect(() => () => {
    try { recogRef.current?.abort(); } catch { /* noop */ }
  }, []);

  function dispatch(text: string) {
    setTranscript(text);
    setLocalState("processing");
    const intent = parseCypherIntent(text);
    if (intent === "UNKNOWN") {
      const msg = "I did not understand that command. Please say turn on the bulb or turn off the bulb.";
      setError(msg);
      setLocalState("error");
      speak(msg, speechEnabled);
      return;
    }
    setLocalState("idle");
    onIntent({ intent, transcript: text });
  }

  function startListening() {
    if (!voiceEnabled) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice recognition is not supported in this browser.");
      setLocalState("error");
      return;
    }
    setError(null);
    setTranscript("");
    const r = new Ctor();
    r.lang = language || "en-NG";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (ev) => {
      const e = ev as unknown as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      const said = e.results[0][0].transcript ?? "";
      dispatch(said);
    };
    r.onerror = (ev) => {
      const e = ev as unknown as { error?: string };
      const kind = e.error ?? "unknown";
      const msg =
        kind === "not-allowed"
          ? "Microphone permission was denied."
          : kind === "no-speech"
            ? "I didn't catch that. Please try again."
            : `Voice error: ${kind}`;
      setError(msg);
      setLocalState("error");
    };
    r.onend = () => {
      setLocalState((s) => (s === "listening" ? "idle" : s));
    };
    recogRef.current = r;
    try {
      r.start();
      setLocalState("listening");
      speak("Cypher is listening.", speechEnabled);
    } catch {
      setLocalState("idle");
    }
  }

  function cancel() {
    try { recogRef.current?.abort(); } catch { /* noop */ }
    setLocalState("idle");
    setError(null);
  }

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    const v = textInput.trim();
    if (!v) return;
    setTextInput("");
    dispatch(v);
  }

  const busy = state === "listening" || state === "processing" || state === "sending" || state === "waiting";

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={state === "listening" ? cancel : startListening}
          disabled={!voiceEnabled || !supportsVoice}
          aria-label={state === "listening" ? "Stop Cypher" : "Ask Cypher"}
          className={cn(
            "relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all",
            "disabled:cursor-not-allowed disabled:opacity-40",
            state === "listening"
              ? "bg-primary text-primary-foreground shadow-glow"
              : state === "error"
                ? "border border-destructive/40 bg-destructive/10 text-destructive"
                : state === "success"
                  ? "border border-success/40 bg-success/10 text-success"
                  : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
          )}
        >
          {state === "listening" && (
            <>
              <motion.span
                className="absolute inset-0 rounded-2xl border-2 border-primary"
                animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
              <MicOff className="h-6 w-6" />
            </>
          )}
          {(state === "processing" || state === "sending" || state === "waiting") && (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
          {(state === "idle" || state === "success" || state === "error") && (
            <Mic className="h-6 w-6" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cypher · NoskyTech AI
          </p>
          <p
            className={cn(
              "truncate text-sm font-medium",
              state === "error"
                ? "text-destructive"
                : state === "success"
                  ? "text-success"
                  : "text-foreground",
            )}
          >
            {message}
          </p>
        </div>

        {state === "listening" && (
          <button
            type="button"
            onClick={cancel}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.p
            key={transcript}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-white/5 bg-background/40 px-3 py-2 text-xs text-muted-foreground"
          >
            You said: <span className="font-medium text-foreground">"{transcript}"</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Text fallback */}
      <form onSubmit={submitText} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={supportsVoice ? "Or type: turn on the bulb" : "Type a command: turn on the bulb"}
          disabled={busy}
          className="h-10 flex-1 rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={busy || !textInput.trim()}
          aria-label="Send command"
          className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {!supportsVoice && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Voice recognition is not supported in this browser — text commands still work.
        </p>
      )}
    </div>
  );
}
