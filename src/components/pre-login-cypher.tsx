import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, MicOff, Loader2, X, Send } from "lucide-react";
import {
  getSpeechRecognitionCtor,
  speak,
} from "@/lib/cypher";
import { cn } from "@/lib/utils";

export type PreLoginCypherIntent =
  | "WHAT_IS_SMART_WATT"
  | "HOW_TO_SIGN_IN"
  | "OPEN_PRIVACY"
  | "OPEN_TERMS"
  | "OPEN_ELECTRICAL_SAFETY"
  | "SUPPORT_CONTACT"
  | "HELP"
  | "UNKNOWN";

function parsePreLoginIntent(raw: string): PreLoginCypherIntent {
  const t = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
  if (!t) return "UNKNOWN";

  const has = (...words: string[]) => words.every((w) => t.includes(w));
  const any = (...words: string[]) => words.some((w) => t.includes(w));

  if (any("what is", "about smart watt", "definition") && any("smart watt", "platform")) {
    return "WHAT_IS_SMART_WATT";
  }
  if (any("how to sign in", "how do i sign in", "sign in", "login", "log in")) {
    return "HOW_TO_SIGN_IN";
  }
  if (any("privacy", "policy", "personal data")) {
    return "OPEN_PRIVACY";
  }
  if (any("terms", "use", "conditions")) {
    return "OPEN_TERMS";
  }
  if (any("electrical", "safety", "hazard", "dangerous")) {
    return "OPEN_ELECTRICAL_SAFETY";
  }
  if (any("contact", "support", "noskytech", "email", "helpdesk")) {
    return "SUPPORT_CONTACT";
  }
  if (any("help", "commands", "options", "what can you do")) {
    return "HELP";
  }

  return "UNKNOWN";
}

export function PreLoginCypherDrawer({
  isOpen,
  onClose,
  onOpenLegal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal: (id: "privacy" | "terms" | "safety" | "about") => void;
}) {
  const [localState, setLocalState] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cypherResponse, setCypherResponse] = useState<string>("Hello, I am Cypher. Ask me what SMART WATT does or how to sign in!");
  const recogRef = useRef<any>(null);
  const supportsVoice = !!getSpeechRecognitionCtor();

  useEffect(() => {
    if (!isOpen) {
      cancel();
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      try {
        recogRef.current?.abort();
      } catch {
        /* noop */
      }
    },
    [],
  );

  function dispatch(text: string) {
    setTranscript(text);
    setLocalState("processing");
    const intent = parsePreLoginIntent(text);

    let reply = "";
    switch (intent) {
      case "WHAT_IS_SMART_WATT":
        reply = "SMART WATT is a connected control platform powered by NoskyTech for remotely controlling compatible devices.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        break;
      case "HOW_TO_SIGN_IN":
        reply = "Enter your registered email and password, then press Sign In.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        break;
      case "OPEN_PRIVACY":
        reply = "Opening Privacy Policy.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        onOpenLegal("privacy");
        break;
      case "OPEN_TERMS":
        reply = "Opening Terms of Use.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        onOpenLegal("terms");
        break;
      case "OPEN_ELECTRICAL_SAFETY":
        reply = "Opening Electrical Safety Notice.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        onOpenLegal("safety");
        break;
      case "SUPPORT_CONTACT":
        reply = "You can contact support at noskytech1@gmail.com or visit our website at noskytech.vercel.app.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        break;
      case "HELP":
        reply = "I can explain what SMART WATT is, how to sign in, open legal policies, or provide support contact details. Try asking: what is smart watt, or how to sign in.";
        setCypherResponse(reply);
        setLocalState("success");
        speak(reply, true);
        break;
      default:
        reply = "I did not understand that command. Try asking: what is smart watt, or how to sign in.";
        setError(reply);
        setCypherResponse(reply);
        setLocalState("error");
        speak(reply, true);
        break;
    }
  }

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice recognition is not supported in this browser.");
      setLocalState("error");
      return;
    }
    setError(null);
    setTranscript("");
    const r = new Ctor();
    r.lang = "en-NG";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (ev: any) => {
      const said = ev.results[0][0].transcript ?? "";
      dispatch(said);
    };
    r.onerror = (ev: any) => {
      const kind = ev.error ?? "unknown";
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
      speak("Cypher is listening.", true);
    } catch {
      setLocalState("idle");
    }
  }

  function cancel() {
    try {
      recogRef.current?.abort();
    } catch {
      /* noop */
    }
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

  const busy = localState === "listening" || localState === "processing";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
          />

          {/* Drawer Wrapper */}
          <motion.div
            initial={{ x: "100%", y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: "100%", y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "glass-strong fixed inset-y-0 right-0 z-[101] flex w-full flex-col border-l border-white/10 sm:max-w-md",
              "bottom-0 h-full rounded-l-3xl",
              // Mobile behavior - bottom sheet if responsive screen width is small
              "max-sm:top-auto max-sm:bottom-0 max-sm:h-[80vh] max-sm:rounded-t-3xl max-sm:border-t max-sm:border-l-0"
            )}
            // Make mobile sheet exit downwards
            style={typeof window !== "undefined" && window.innerWidth < 640 ? { transform: "translateY(100%)" } : undefined}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  Cypher · NoskyTech AI
                </h2>
                <p className="text-[11px] text-muted-foreground">Pre-login Interactive Helper</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Cypher"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Main Cypher Response Screen */}
              <div className="rounded-2xl border border-white/5 bg-background/40 p-4 min-h-[140px] flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Response</span>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {cypherResponse}
                  </p>
                </div>
                {localState === "listening" && (
                  <div className="flex items-center gap-2 text-xs text-primary mt-4 animate-pulse-glow">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Listening for voice input...
                  </div>
                )}
                {localState === "processing" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Analyzing Command...
                  </div>
                )}
              </div>

              {/* User transcript indicator */}
              <AnimatePresence>
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/5 bg-background/20 px-3 py-2 text-xs text-muted-foreground"
                  >
                    You said: <span className="font-medium text-foreground">"{transcript}"</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sample commands list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Try saying or typing:</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "What is Smart Watt?",
                    "How do I sign in?",
                    "Privacy policy",
                    "Support contact",
                    "Help"
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => dispatch(cmd)}
                      disabled={busy}
                      className="text-left text-xs bg-background/30 hover:bg-primary/10 border border-white/5 hover:border-primary/20 rounded-xl px-3 py-2.5 text-foreground/80 hover:text-foreground cursor-pointer transition-all"
                    >
                      "{cmd}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4 space-y-3">
              {/* Action Voice Button & Text Input */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={localState === "listening" ? cancel : startListening}
                  disabled={!supportsVoice}
                  aria-label={localState === "listening" ? "Stop Cypher" : "Ask Cypher"}
                  className={cn(
                    "relative grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-all cursor-pointer",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    localState === "listening"
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : localState === "error"
                        ? "border border-destructive/40 bg-destructive/10 text-destructive"
                        : localState === "success"
                          ? "border border-success/40 bg-success/10 text-success"
                          : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  {localState === "listening" ? (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-xl border-2 border-primary"
                        animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                      />
                      <MicOff className="h-5 w-5" />
                    </>
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>

                <form onSubmit={submitText} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      supportsVoice ? "Or type your question..." : "Type a command..."
                    }
                    disabled={busy}
                    className="h-12 flex-1 rounded-xl border border-border bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="submit"
                    disabled={busy || !textInput.trim()}
                    aria-label="Send command"
                    className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
              {!supportsVoice && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Voice recognition is unsupported in this browser — text command fallback is active.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
