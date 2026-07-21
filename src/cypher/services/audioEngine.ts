import { SpeechRecognitionService } from "./speechRecognitionService";
import { elevenLabsSpeechService } from "./elevenLabsSpeechService";
import { chimeService } from "./chimeService";
import { cypherSettingsService } from "../settings/settingsService";

let globalRecognitionInstance: SpeechRecognitionService | null = null;

// Global "Cypher is currently speaking" flag. Consumed by the speech recognition
// service to block any auto-restart while TTS is playing — this is what
// eliminates the ding-dong feedback loop where the mic re-triggers the wake
// word on Cypher's own voice.
let speakingActive = false;
export function isCypherSpeaking(): boolean {
  return speakingActive;
}

// Guard: only one speak() call at a time; the newest one wins.
let speakCounter = 0;

export const audioEngine = {
  startSpeechRecognition(
    callbacks: {
      onResult: (text: string, isFinal: boolean) => void;
      onStateChange: (state: any) => void;
      onError: (errType: string, msg: string) => void;
      onEnd: () => void;
    },
    config: { isAlwaysOn: boolean; wakePhrase: string },
  ): SpeechRecognitionService {
    if (globalRecognitionInstance) {
      globalRecognitionInstance.destroy();
      globalRecognitionInstance = null;
    }

    // Never start the mic while Cypher is speaking.
    if (speakingActive) {
      // Return a no-op-ish placeholder by scheduling start after speech ends.
      const wait = () => {
        if (!speakingActive) {
          this.startSpeechRecognition(callbacks, config);
        } else {
          setTimeout(wait, 150);
        }
      };
      setTimeout(wait, 150);
      // Still create the instance so callers have a reference; will restart soon.
    }

    const settings = cypherSettingsService.getSettings();

    globalRecognitionInstance = new SpeechRecognitionService(
      {
        onResult: callbacks.onResult,
        onStateChange: callbacks.onStateChange,
        onError: callbacks.onError,
        onEnd: callbacks.onEnd,
      },
      {
        isAlwaysOn: config.isAlwaysOn,
        wakePhrases: [config.wakePhrase || settings.wakePhrase],
        lang: "en-NG",
      },
    );

    if (!speakingActive) {
      globalRecognitionInstance.start();
    }
    return globalRecognitionInstance;
  },

  stopSpeechRecognition() {
    if (globalRecognitionInstance) {
      globalRecognitionInstance.destroy();
      globalRecognitionInstance = null;
    }
  },

  async speak(
    text: string,
    onStatusChange: (status: "elevenlabs" | "fallback" | "playing" | "stopped" | "failed") => void,
  ): Promise<boolean> {
    // Stop anything already speaking; the newest utterance wins.
    this.stopPlayback();

    const myCall = ++speakCounter;
    speakingActive = true;

    // Fully release the mic while we speak so it can't hear Cypher.
    if (globalRecognitionInstance) {
      globalRecognitionInstance.abort();
      globalRecognitionInstance = null;
    }

    try {
      const ok = await elevenLabsSpeechService.speak(text, onStatusChange);
      // Only clear the flag if a newer speak() call didn't take over.
      if (myCall === speakCounter) {
        speakingActive = false;
      }
      return ok;
    } catch (err) {
      console.warn("[AudioEngine] speak failed", err);
      if (myCall === speakCounter) speakingActive = false;
      onStatusChange("failed");
      return false;
    }
  },

  stopPlayback() {
    speakingActive = false;
    elevenLabsSpeechService.stop();
  },

  async playActivationChime(): Promise<void> {
    const settings = cypherSettingsService.getSettings();
    if (settings.startupSound) {
      await chimeService.playActivationChime();
    }
  },

  shutdownAll() {
    this.stopSpeechRecognition();
    this.stopPlayback();
  },
};
export default audioEngine;
