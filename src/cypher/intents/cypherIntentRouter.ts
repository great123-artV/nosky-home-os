import { CypherIntent } from "../types";

export function parseCypherIntent(raw: string): CypherIntent {
  const t = raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  if (!t) return "UNKNOWN";

  const has = (...words: string[]) => words.every((w) => t.includes(w));
  const any = (...words: string[]) => words.some((w) => t.includes(w));

  // 1. Hardware Commands (avoiding TURN_ON/OFF substring overlap)
  if (
    (any("off") && any("bulb", "light", "it", "smart watt", "relay", "device")) ||
    has("switch", "off") ||
    has("turn", "off") ||
    has("power", "off") ||
    has("put", "off") ||
    has("shut", "down") ||
    has("shut", "off")
  ) {
    return "TURN_OFF";
  }

  if (
    (any("on") && any("bulb", "light", "it", "smart watt", "relay", "device")) ||
    has("switch", "on") ||
    has("turn", "on") ||
    has("power", "on") ||
    has("put", "on") ||
    has("light", "up")
  ) {
    return "TURN_ON";
  }

  // Unsupported Hardware commands check (vague hardware command we don't support)
  if (
    any(
      "fan",
      "heater",
      "air conditioner",
      "ac",
      "microwave",
      "fridge",
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
    return "UNKNOWN_HARDWARE";
  }

  if (any("status", "state") && any("bulb", "light")) return "GET_BULB_STATUS";
  if (has("is", "bulb") || has("is", "light")) return "GET_BULB_STATUS";
  if (has("current", "state")) return "GET_BULB_STATUS";

  if (
    any("online", "connected", "offline", "device status") &&
    any("device", "smart watt", "bulb", "it")
  ) {
    return "GET_DEVICE_STATUS";
  }

  if (any("settings", "preferences")) return "OPEN_SETTINGS";
  if (any("safety", "electrical", "wiring", "electric", "mains")) return "SAFETY_INFO";

  // 2. Knowledge-based intents
  if (
    has("what", "noskytech") ||
    has("who", "noskytech") ||
    has("tell", "noskytech") ||
    has("about", "noskytech")
  ) {
    return "EXPLAIN_NOSKYTECH";
  }
  if (
    has("what", "smart watt") ||
    has("what", "smartwatt") ||
    has("tell", "smart watt") ||
    has("about", "smart watt")
  ) {
    return "EXPLAIN_SMARTWATT";
  }
  if (
    has("what", "cypher") ||
    has("who", "are", "you") ||
    has("tell", "cypher") ||
    has("about", "cypher") ||
    has("your", "name")
  ) {
    return "EXPLAIN_CYPHER";
  }
  if (any("sign in", "login", "authenticate", "session", "how to sign")) {
    return "GUIDE_SIGNIN";
  }
  if (any("privacy", "policy", "gdpr", "personal data")) {
    return "OPEN_PRIVACY";
  }
  if (any("terms", "agreement", "conditions")) {
    return "OPEN_TERMS";
  }
  if (any("contact", "support", "help desk", "email", "support team")) {
    return "OPEN_CONTACT";
  }

  if (any("help", "what can you do", "commands", "how does this work")) return "HELP";

  // General conversational patterns
  if (any("hello", "hi", "hey", "greetings", "good morning", "good afternoon")) {
    return "CONVERSATION";
  }

  return "UNKNOWN";
}
