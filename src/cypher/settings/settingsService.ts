import { CypherSettings } from "../types";

const SETTINGS_KEY = "sw.cypher.settings";

const defaultSettings: CypherSettings = {
  listeningMode: "push_to_talk",
  alwaysOnListening: false,
  wakePhrase: "Hey Cypher",
  voiceResponses: true,
  voiceVolume: 0.8,
  speechRate: 1.0,
  startupSound: true,
  browserVoiceFallback: true,
  conversationHistoryEnabled: true,
};

type SettingsListener = (settings: CypherSettings) => void;
const listeners = new Set<SettingsListener>();

export const cypherSettingsService = {
  getSettings(): CypherSettings {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("[CypherSettings] Failed to load settings", e);
    }
    return defaultSettings;
  },

  saveSettings(settings: Partial<CypherSettings>): CypherSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };

    // Synced fields with pre-existing legacy settings keys if any
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      localStorage.setItem("sw.voice", updated.listeningMode === "always_on" || updated.alwaysOnListening ? "on" : "on");
      localStorage.setItem("sw.speech", updated.voiceResponses ? "on" : "off");
    } catch (e) {
      console.error("[CypherSettings] Failed to save settings", e);
    }

    listeners.forEach((listener) => listener(updated));
    return updated;
  },

  subscribe(listener: SettingsListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
