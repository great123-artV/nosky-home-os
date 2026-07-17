import { cypherSettingsService } from "../settings/settingsService";

let audioContext: AudioContext | null = null;

export const chimeService = {
  /**
   * Generates a soft, premium futuristic chime using the Web Audio API.
   * Plays a quick, pleasant 3-tone arpeggio (e.g., G4 -> C5 -> E5).
   */
  async playActivationChime(): Promise<void> {
    const settings = cypherSettingsService.getSettings();
    if (!settings.voiceResponses || !settings.startupSound) return;

    if (typeof window === "undefined") return;

    try {
      // Lazy init AudioContext to meet browser user-gesture restrictions
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const now = audioContext.currentTime;
      const destination = audioContext.destination;

      // Master Volume Gain Node
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0, now);
      // Soft entry, fade out
      masterGain.gain.linearRampToValueAtTime(settings.voiceVolume * 0.15, now + 0.05);
      masterGain.gain.setValueAtTime(settings.voiceVolume * 0.15, now + 0.4);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      masterGain.connect(destination);

      // We play 3 premium, soft sine wave notes in sequence
      const notes = [392.00, 523.25, 659.25]; // G4, C5, E5 (pleasant major chord progression)
      const noteStarts = [0, 0.1, 0.2];
      const noteDurations = [0.4, 0.45, 0.5];

      notes.forEach((freq, idx) => {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();

        // Use standard round sine waves for smooth professional look
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + noteStarts[idx]);

        // Smooth individual envelope
        noteGain.gain.setValueAtTime(0, now + noteStarts[idx]);
        noteGain.gain.linearRampToValueAtTime(0.3, now + noteStarts[idx] + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteStarts[idx] + noteDurations[idx]);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + noteStarts[idx]);
        osc.stop(now + noteStarts[idx] + noteDurations[idx]);
      });

    } catch (e) {
      console.warn("[ChimeService] Web Audio API chime could not play due to user gesture requirement or engine failure.", e);
    }
  }
};
