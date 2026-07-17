import { SpeechRecognitionService } from "./speechRecognitionService";
import { elevenLabsSpeechService } from "./elevenLabsSpeechService";
import { chimeService } from "./chimeService";
import { cypherSettingsService } from "../settings/settingsService";

let globalRecognitionInstance: SpeechRecognitionService | null = null;
let isSpeakingActive = false;

export const audioEngine = {
  /**
   * Initializes or fetches single speech recognition instance safely.
   */
  startSpeechRecognition(
    callbacks: {
      onResult: (text: string, isFinal: boolean) => void;
      onStateChange: (state: any) => void;
      onError: (errType: string, msg: string) => void;
      onEnd: () => void;
    },
    config: { isAlwaysOn: boolean; wakePhrase: string },
  ): SpeechRecognitionService {
    // Shutdown and destroy any existing instance first to guarantee single voice listener
    if (globalRecognitionInstance) {
      globalRecognitionInstance.destroy();
      globalRecognitionInstance = null;
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

    globalRecognitionInstance.start();
    return globalRecognitionInstance;
  },

  /**
   * Shuts down any active microphone sessions safely.
   */
  stopSpeechRecognition() {
    if (globalRecognitionInstance) {
      globalRecognitionInstance.destroy();
      globalRecognitionInstance = null;
    }
  },

  /**
   * Plays voice synthesis through the ElevenLabs proxy, with instant local synthesis fallbacks.
   */
  async speak(
    text: string,
    onStatusChange: (status: "elevenlabs" | "fallback" | "playing" | "stopped" | "failed") => void,
  ): Promise<boolean> {
    this.stopPlayback();
    isSpeakingActive = true;

    // Temporal microphone pause to prevent Cypher hearing herself speak
    const wasListening = globalRecognitionInstance && !isSpeakingActive;
    if (globalRecognitionInstance) {
      globalRecognitionInstance.abort();
    }

    try {
      const result = await elevenLabsSpeechService.speak(text, onStatusChange);
      isSpeakingActive = false;
      return result;
    } catch (e) {
      isSpeakingActive = false;
      onStatusChange("failed");
      return false;
    }
  },

  /**
   * Halts all active synthesis streams.
   */
  stopPlayback() {
    isSpeakingActive = false;
    elevenLabsSpeechService.stop();
  },

  /**
   * Plays the luxury chime sound.
   */
  async playActivationChime(): Promise<void> {
    const settings = cypherSettingsService.getSettings();
    if (settings.startupSound) {
      await chimeService.playActivationChime();
    }
  },

  /**
   * Shuts down all engines globally.
   */
  shutdownAll() {
    this.stopSpeechRecognition();
    this.stopPlayback();
  },
};
export default audioEngine;
