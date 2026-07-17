import { supabase } from "@/lib/supabase";
import { cypherSettingsService } from "../settings/settingsService";

let currentAudio: HTMLAudioElement | null = null;
let fallbackUtterance: SpeechSynthesisUtterance | null = null;

export const elevenLabsSpeechService = {
  /**
   * Speaks the text. Resolves with true when finished speaking, or false if canceled/failed.
   */
  async speak(
    text: string,
    onStatus: (status: "elevenlabs" | "fallback" | "playing" | "stopped" | "failed") => void,
    options?: { responseType?: string; requestId?: string }
  ): Promise<boolean> {
    this.stop();

    const settings = cypherSettingsService.getSettings();
    if (!settings.voiceResponses) {
      onStatus("stopped");
      return false;
    }

    // Try ElevenLabs Edge Function first (unless browserVoiceFallback is forced or we run in local mode without it)
    if (!settings.browserVoiceFallback) {
      try {
        const requestId = options?.requestId || "req_" + Math.random().toString(36).substring(2, 9);
        const responseType = options?.responseType || "knowledge";

        const { data, error } = await supabase.functions.invoke("cypher-speech", {
          body: {
            text,
            voiceId: "21m00Tcm4TlvDq8ikWAM", // Default premium Rachel voice
            requestId,
            responseType
          },
        });

        if (error) throw error;

        if (data && data.audio) {
          return new Promise<boolean>((resolve) => {
            onStatus("playing");
            // Standard base64 audio play
            const audioSrc = `data:audio/mpeg;base64,${data.audio}`;
            const audio = new Audio(audioSrc);
            audio.volume = settings.voiceVolume;
            audio.playbackRate = settings.speechRate;
            currentAudio = audio;

            audio.onended = () => {
              currentAudio = null;
              resolve(true);
            };

            audio.onerror = (e) => {
              console.error("[ElevenLabsSpeech] Audio element play error:", e);
              currentAudio = null;
              // Trigger browser fallback if audio play fails
              this.speakFallback(text, onStatus).then(resolve);
            };

            audio.play().catch((err) => {
              console.error("[ElevenLabsSpeech] Play promise error:", err);
              currentAudio = null;
              this.speakFallback(text, onStatus).then(resolve);
            });
          });
        }
      } catch (err) {
        console.warn("[ElevenLabsSpeech] Primary speech failed, falling back to browser synthesis.", err);
      }
    }

    // Fallback Speech Synthesis
    return this.speakFallback(text, onStatus);
  },

  speakFallback(
    text: string,
    onStatus: (status: "elevenlabs" | "fallback" | "playing" | "stopped" | "failed") => void
  ): Promise<boolean> {
    this.stop();
    onStatus("fallback");

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onStatus("failed");
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const settings = cypherSettingsService.getSettings();

        utterance.volume = settings.voiceVolume;
        utterance.rate = settings.speechRate;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          onStatus("playing");
        };

        utterance.onend = () => {
          fallbackUtterance = null;
          resolve(true);
        };

        utterance.onerror = (e) => {
          console.error("[SpeechSynthesisFallback] Error event:", e);
          fallbackUtterance = null;
          onStatus("failed");
          resolve(false);
        };

        fallbackUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("[SpeechSynthesisFallback] Crash error:", err);
        onStatus("failed");
        resolve(false);
      }
    });
  },

  stop() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio = null;
      } catch {
        /* noop */
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        fallbackUtterance = null;
      } catch {
        /* noop */
      }
    }
  },
};
