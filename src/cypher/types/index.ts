export type CypherState =
  | "sleeping"
  | "listening"
  | "processing"
  | "executing"
  | "speaking"
  | "offline"
  | "permission_required"
  | "microphone_disabled"
  | "reconnecting";

export type CypherIntent =
  | "TURN_ON"
  | "TURN_OFF"
  | "GET_BULB_STATUS"
  | "GET_DEVICE_STATUS"
  | "OPEN_SETTINGS"
  | "HELP"
  | "SAFETY_INFO"
  | "UNKNOWN_HARDWARE"
  | "EXPLAIN_NOSKYTECH"
  | "EXPLAIN_SMARTWATT"
  | "EXPLAIN_CYPHER"
  | "GUIDE_SIGNIN"
  | "OPEN_PRIVACY"
  | "OPEN_TERMS"
  | "OPEN_CONTACT"
  | "CONVERSATION"
  | "UNKNOWN";

export type ListeningMode = "push_to_talk" | "always_on";

export interface CypherSettings {
  listeningMode: ListeningMode;
  alwaysOnListening: boolean;
  wakePhrase: "Hey Cypher" | "Cypher";
  voiceResponses: boolean;
  voiceVolume: number; // 0 to 1
  speechRate: number; // 0.5 to 2.0
  startupSound: boolean;
  browserVoiceFallback: boolean;
  conversationHistoryEnabled: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string; // ISO format
  command: string;
  intent: CypherIntent;
  result: string;
  status: "Completed" | "Answered" | "Failed" | "Pending";
}
