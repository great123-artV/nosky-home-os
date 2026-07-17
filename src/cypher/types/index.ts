export type AudioEngineState =
  | "idle"
  | "requesting_permission"
  | "ready"
  | "starting"
  | "listening"
  | "transcript_received"
  | "processing"
  | "executing"
  | "generating_voice"
  | "speaking"
  | "paused"
  | "stopped"
  | "unsupported"
  | "permission_denied"
  | "error";

export type CypherState = AudioEngineState; // Align visual states with our core engine states

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

export interface AudioDiagnostics {
  browserName: string;
  browserVersion: string;
  isPWA: boolean;
  recognitionSupported: boolean;
  activeRecognitionCount: number;
  microphonePermission: string;
  audioState: AudioEngineState;
  conversationMode: boolean;
  restartCount: number;
  lastRecognitionError: string;
  lastStartBlockReason: string;
  lastInterimTranscript: string;
  lastFinalTranscript: string;
  duplicateTranscriptPrevented: boolean;
  ttsProvider: "elevenlabs" | "browser" | "text-only";
  elevenLabsStatus: string;
  elevenLabsLatency: number;
  playbackStatus: string;
  autoplayUnlocked: boolean;
  activeTimersCount: number;
  currentRequestId: string;
}
