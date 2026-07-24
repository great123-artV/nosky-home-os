import { CypherIntent } from "../types";

export interface IntentMatchResult {
  intent: CypherIntent;
  confidence: number;
  matchedPattern?: string;
  engine: "deterministic" | "knowledge" | "fallback";
}

export function parseCypherIntent(raw: string): IntentMatchResult {
  const t = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  if (!t) {
    return { intent: "UNKNOWN", confidence: 0, engine: "fallback" };
  }

  const has = (...words: string[]) => words.every((w) => t.includes(w));
  const any = (...words: string[]) => words.some((w) => t.includes(w));

  // Helper helper to return match result
  const match = (
    intent: CypherIntent,
    confidence: number = 1.0,
    pattern?: string,
  ): IntentMatchResult => ({
    intent,
    confidence,
    matchedPattern: pattern || t,
    engine: "deterministic",
  });

  // 1. CANCEL & STOP (highest priority)
  if (
    any("stop", "shut up", "quiet", "be quiet", "hush", "stop listening", "stop talking", "hold on")
  ) {
    return match("STOP", 1.0, "stop phrase");
  }

  if (any("cancel", "nevermind", "abort", "forget it", "forget about it", "no wait", "dismiss")) {
    return match("CANCEL", 1.0, "cancel phrase");
  }

  // 2. Hardware Control Commands (deterministic & ultra-reliable mapping)
  if (
    any(
      "turn off",
      "switch off",
      "power off",
      "put off",
      "shut down",
      "shut off",
      "disable light",
      "disable bulb",
    ) ||
    (any("off") && any("bulb", "light", "it", "smart watt", "relay", "device"))
  ) {
    return match("TURN_OFF", 1.0, "off command");
  }

  if (
    any("turn on", "switch on", "power on", "put on", "light up", "enable light", "enable bulb") ||
    (any("on") && any("bulb", "light", "it", "smart watt", "relay", "device"))
  ) {
    return match("TURN_ON", 1.0, "on command");
  }

  // Unsupported Hardware Command Detection
  if (
    any(
      "fan",
      "heater",
      "air conditioner",
      "ac",
      "microwave",
      "fridge",
      "refrigerator",
      "tv",
      "television",
      "charger",
      "plug",
      "socket",
      "outlet",
      "kettle",
    ) &&
    any("on", "off", "turn", "switch", "status", "online")
  ) {
    return match("UNKNOWN_HARDWARE", 1.0, "unsupported hardware device");
  }

  // 3. Status Queries & Manual Sync
  if (
    any("refresh", "sync", "reload status", "update status") &&
    any("device", "bulb", "light", "it", "smart watt")
  ) {
    return match("REFRESH_DEVICE", 1.0, "refresh device phrase");
  }

  if (
    (any("status", "state", "current state") && any("bulb", "light")) ||
    has("is", "bulb") ||
    has("is", "light") ||
    has("bulb", "on") ||
    has("bulb", "off")
  ) {
    return match("GET_BULB_STATUS", 0.95, "bulb status check");
  }

  if (
    any("online", "connected", "offline", "device status", "signal") &&
    any("device", "smart watt", "bulb", "it", "esp32")
  ) {
    return match("GET_DEVICE_STATUS", 0.95, "device network status check");
  }

  // 4. Navigation Commands
  if (any("settings", "preferences", "config", "options")) {
    return match("OPEN_SETTINGS", 1.0, "open settings");
  }

  if (any("dashboard", "home", "main page", "control center", "control panel")) {
    return match("GO_DASHBOARD", 1.0, "go home dashboard");
  }

  if (any("privacy", "gdpr", "personal data")) {
    return match("OPEN_PRIVACY", 1.0, "privacy policy shortcut");
  }

  if (any("terms", "conditions", "agreement", "user agreement")) {
    return match("OPEN_TERMS", 1.0, "terms of use shortcut");
  }

  // 5. Guides and Troubleshooting Help
  if (any("install", "installation", "wiring", "mains", "wiring guide") && any("help", "how to")) {
    return match("GUIDE_INSTALLATION", 0.9, "installation instructions");
  }

  if (
    any("pwa", "progressive web app", "install app", "add to home", "mobile app", "download app")
  ) {
    return match("GUIDE_PWA", 0.9, "pwa instructions");
  }

  if (any("sign in", "login", "how to log", "authenticate", "account session")) {
    return match("GUIDE_SIGNIN", 0.9, "sign in guidelines");
  }

  // 6. Knowledge Queries
  if (
    has("what", "noskytech") ||
    has("who", "noskytech") ||
    has("tell", "noskytech") ||
    has("about", "noskytech") ||
    has("built", "you") ||
    has("made", "you") ||
    has("created", "you")
  ) {
    return match("EXPLAIN_NOSKYTECH", 0.95, "about company");
  }

  if (
    has("what", "smart watt") ||
    has("what", "smartwatt") ||
    has("tell", "smart watt") ||
    has("about", "smart watt") ||
    has("how", "smart watt")
  ) {
    return match("EXPLAIN_SMARTWATT", 0.95, "about product smart watt");
  }

  if (
    has("what", "cypher") ||
    has("who", "are", "you") ||
    has("tell", "cypher") ||
    has("about", "cypher") ||
    has("your", "name")
  ) {
    return match("EXPLAIN_CYPHER", 0.95, "about voice assistant cypher");
  }

  if (any("safety", "electrical", "wiring", "electric", "mains", "danger", "hazardous")) {
    return match("SAFETY_INFO", 0.9, "electrical safety query");
  }

  if (any("contact", "support", "help desk", "email", "support team", "get help")) {
    return match("OPEN_CONTACT", 1.0, "contact details query");
  }

  if (any("help", "what can you do", "commands", "how does this work", "tutorial")) {
    return match("HELP", 1.0, "help menu request");
  }

  if (any("hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening")) {
    return match("CONVERSATION", 0.8, "greeting chat");
  }

  // If no high-confidence deterministic phrase matches, we treat it as UNKNOWN and forward to Knowledge Match
  return { intent: "UNKNOWN", confidence: 0.3, engine: "fallback" };
}
