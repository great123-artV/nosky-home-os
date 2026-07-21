import { cypherSettingsService } from "../settings/settingsService";

// Safe, reusable system phrases that are completely free from dynamic/personalized data
const SAFE_PHRASES = new Set([
  "The bulb is now on.",
  "The bulb is now off.",
  "Your device is offline.",
  "Please sign in.",
  "I didn't hear anything.",
  "Microphone access is blocked.",
]);

// Cached blob URLs for identical safe system utterances (avoids repeat API calls & billing).
const utteranceCache = new Map<string, string>();
const CACHE_LIMIT = 40;

let currentAudio: HTMLAudioElement | null = null;
let fallbackUtterance: SpeechSynthesisUtterance | null = null;
let activeAbortController: AbortController | null = null;

type Status = "elevenlabs" | "fallback" | "playing" | "stopped" | "failed";

async function fetchElevenLabsAudio(text: string): Promise<string | null> {
  const settings = cypherSettingsService.getSettings();
  const voiceId = settings.voiceId || "21m00Tcm4TlvDq8ikWAM";
  const modelId = settings.modelId || "eleven_turbo_v2_5";

  const isSafeToCache = SAFE_PHRASES.has(text);
  const cacheKey = `${voiceId}:${modelId}:${text}`;
  if (isSafeToCache) {
    const cached = utteranceCache.get(cacheKey);
    if (cached) return cached;
  }

  // Cancel any obsolete in-flight requests before starting a new one
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  try {
    const res = await fetch("/api/public/cypher-tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, voiceId, modelId }),
      signal,
    });
    if (!res.ok) {
      console.warn("[ElevenLabsSpeech] Server responded", res.status);
      return null;
    }
    const blob = await res.blob();
    if (!blob.size) return null;
    const url = URL.createObjectURL(blob);

    if (isSafeToCache) {
      if (utteranceCache.size >= CACHE_LIMIT) {
        const firstKey = utteranceCache.keys().next().value;
        if (firstKey !== undefined) {
          const oldUrl = utteranceCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          utteranceCache.delete(firstKey);
        }
      }
      utteranceCache.set(cacheKey, url);
    }
    return url;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log(
        "[ElevenLabsSpeech] Fetch request cancelled because a newer response replaced it.",
      );
    } else {
      console.warn("[ElevenLabsSpeech] fetch failed", err);
    }
    return null;
  } finally {
    if (activeAbortController?.signal === signal) {
      activeAbortController = null;
    }
  }
}

export const elevenLabsSpeechService = {
  async speak(text: string, onStatus: (status: Status) => void): Promise<boolean> {
    this.stop();

    const settings = cypherSettingsService.getSettings();
    if (!settings.voiceResponses || !text.trim()) {
      onStatus("stopped");
      return false;
    }

    if (!settings.browserVoiceFallback) {
      onStatus("elevenlabs");
      const url = await fetchElevenLabsAudio(text);
      if (url) {
        const played = await new Promise<boolean>((resolve) => {
          const audio = new Audio(url);
          audio.volume = Math.max(0, Math.min(1, settings.voiceVolume));
          audio.playbackRate = Math.max(0.5, Math.min(2, settings.speechRate));
          currentAudio = audio;

          audio.onplay = () => onStatus("playing");
          audio.onended = () => {
            currentAudio = null;
            resolve(true);
          };
          audio.onerror = () => {
            currentAudio = null;
            resolve(false);
          };

          audio.play().catch((err) => {
            console.warn("[ElevenLabsSpeech] Autoplay blocked / play() rejected", err);
            currentAudio = null;
            resolve(false);
          });
        });
        if (played) return true;
        // fall through to browser fallback
      }
    }

    return this.speakFallback(text, onStatus);
  },

  speakFallback(text: string, onStatus: (status: Status) => void): Promise<boolean> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onStatus("failed");
      return Promise.resolve(false);
    }
    onStatus("fallback");

    return new Promise<boolean>((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const settings = cypherSettingsService.getSettings();
        utterance.volume = settings.voiceVolume;
        utterance.rate = settings.speechRate;
        utterance.pitch = 1.0;

        utterance.onstart = () => onStatus("playing");
        utterance.onend = () => {
          fallbackUtterance = null;
          resolve(true);
        };
        utterance.onerror = () => {
          fallbackUtterance = null;
          onStatus("failed");
          resolve(false);
        };

        fallbackUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("[ElevenLabsSpeech] Fallback crashed", err);
        onStatus("failed");
        resolve(false);
      }
    });
  },

  stop() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.src = "";
      } catch {
        /* noop */
      }
      currentAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
      fallbackUtterance = null;
    }
  },
};
