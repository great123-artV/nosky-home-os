export type CypherIntent =
  | "TURN_ON"
  | "TURN_OFF"
  | "GET_BULB_STATUS"
  | "GET_DEVICE_STATUS"
  | "OPEN_SETTINGS"
  | "HELP"
  | "SAFETY_INFORMATION"
  | "UNKNOWN";

/** Deterministic intent matcher — never route to a database write from natural language. */
export function parseCypherIntent(raw: string): CypherIntent {
  const t = raw.toLowerCase().trim().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ");
  if (!t) return "UNKNOWN";

  const has = (...words: string[]) => words.every((w) => t.includes(w));
  const any = (...words: string[]) => words.some((w) => t.includes(w));

  // TURN OFF (check before ON — "turn off" contains "on" trap avoided by order)
  if (
    (any("off") && any("bulb", "light", "it", "smart watt")) ||
    has("switch", "off") || has("turn", "off") ||
    has("power", "off") || has("put", "off") ||
    has("shut", "down") || has("shut", "off")
  ) {
    return "TURN_OFF";
  }

  if (
    (any("on") && any("bulb", "light", "it", "smart watt")) ||
    has("switch", "on") || has("turn", "on") ||
    has("power", "on") || has("put", "on") ||
    has("light", "up")
  ) {
    return "TURN_ON";
  }

  if (any("status", "state") && any("bulb", "light")) return "GET_BULB_STATUS";
  if (has("is", "bulb") || has("is", "light")) return "GET_BULB_STATUS";
  if (any("online", "connected", "offline") && any("device", "smart watt", "bulb", "it"))
    return "GET_DEVICE_STATUS";
  if (has("current", "state")) return "GET_BULB_STATUS";

  if (any("settings", "preferences")) return "OPEN_SETTINGS";

  if (any("safety", "electrical")) return "SAFETY_INFORMATION";
  if (has("what", "can", "you", "do") || any("help") || has("how", "work"))
    return "HELP";

  return "UNKNOWN";
}

// Typed shim for browser SpeechRecognition
type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

export function getSpeechRecognitionCtor(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speak(text: string, enabled = true) {
  if (!enabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* noop */
  }
}
