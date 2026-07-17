import { AudioEngineState, CypherSettings, AudioDiagnostics, CypherIntent } from "../types";
import { cypherSettingsService } from "../settings/settingsService";
import { cypherHistoryService } from "../history/historyService";
import { parseCypherIntent } from "../intents/cypherIntentRouter";
import { chimeService } from "./chimeService";
import { elevenLabsSpeechService } from "./elevenLabsSpeechService";
import { getSpeechRecognitionCtor } from "@/lib/cypher";

// Single coordinated Global CypherAudioEngine
export class CypherAudioEngine {
  private static instance: CypherAudioEngine | null = null;

  // Active listeners
  private listeners: Set<(state: AudioEngineState) => void> = new Set();
  private diagnosticsListeners: Set<(diag: AudioDiagnostics) => void> = new Set();

  // Engine state variables
  private state: AudioEngineState = "idle";
  private isConversationActive: boolean = false;
  private settings: CypherSettings;
  private currentTranscript: string = "";
  private currentInterimTranscript: string = "";
  private lastFinalTranscript: string = "";

  // Speech Recognition instance
  private recognition: any = null;
  private startLock: boolean = false;
  private activeRecognitionCount: number = 0;

  // Audio Playback Elements
  private audioPlayer: HTMLAudioElement | null = null;
  private audioUnlocked: boolean = false;

  // Restart & Error handling parameters
  private retryCount: number = 0;
  private restartTimeout: any = null;
  private consecutiveErrors: number = 0;
  private lastError: string = "";
  private lastStartBlockReason: string = "";
  private activeRequestId: string = "";

  // Duplicate Prevention Cache
  private duplicateCache: Map<string, number> = new Map();

  // Diagnostics Metrics
  private elevenLabsLatency: number = 0;
  private elevenLabsStatus: string = "idle";
  private ttsProvider: "elevenlabs" | "browser" | "text-only" = "elevenlabs";

  private constructor() {
    this.settings = cypherSettingsService.getSettings();
    this.detectBrowserInfo();
    this.setupLifecycleListeners();

    // Subscribe to settings changes automatically
    cypherSettingsService.subscribe((updated) => {
      this.settings = updated;
      this.logDev("Settings updated inside global audio engine");
    });
  }

  public static getInstance(): CypherAudioEngine {
    if (!CypherAudioEngine.instance) {
      CypherAudioEngine.instance = new CypherAudioEngine();
    }
    return CypherAudioEngine.instance;
  }

  // --- 1. STATE TRANSITIONS ---
  public getState(): AudioEngineState {
    return this.state;
  }

  private transitionTo(newState: AudioEngineState) {
    const allowedTransitions: Record<AudioEngineState, AudioEngineState[]> = {
      idle: ["requesting_permission", "unsupported", "starting", "listening", "stopped", "error"],
      requesting_permission: ["ready", "permission_denied", "error", "idle"],
      ready: ["starting", "listening", "generating_voice", "speaking", "stopped", "idle", "error"],
      starting: ["listening", "stopped", "error", "idle"],
      listening: ["transcript_received", "processing", "generating_voice", "speaking", "stopped", "idle", "error"],
      transcript_received: ["processing", "generating_voice", "speaking", "stopped", "idle", "error"],
      processing: ["executing", "generating_voice", "speaking", "stopped", "idle", "error"],
      executing: ["generating_voice", "speaking", "stopped", "idle", "error"],
      generating_voice: ["speaking", "stopped", "idle", "error"],
      speaking: ["listening", "idle", "stopped", "error", "ready"],
      paused: ["listening", "speaking", "idle", "stopped"],
      stopped: ["idle", "starting", "listening"],
      unsupported: [],
      permission_denied: ["requesting_permission", "idle"],
      error: ["idle", "starting", "listening", "requesting_permission"]
    };

    const allowed = allowedTransitions[this.state];
    if (allowed && allowed.includes(newState)) {
      this.logDev(`State transition: ${this.state} -> ${newState}`);
      this.state = newState;
      this.notifyListeners();
    } else {
      this.logDev(`BLOCKED invalid state transition: ${this.state} -> ${newState}`);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
    this.notifyDiagnostics();
  }

  public subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeDiagnostics(listener: (diag: AudioDiagnostics) => void): () => void {
    this.diagnosticsListeners.add(listener);
    this.notifyDiagnostics();
    return () => {
      this.diagnosticsListeners.delete(listener);
    };
  }

  // --- 2. USER GESTURE AUDIO UNLOCK ---
  public unlockAudio() {
    if (this.audioUnlocked) return;
    try {
      this.logDev("Unlocking browser Audio Context...");
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        ctx.resume();
      }
      this.audioUnlocked = true;
      this.notifyDiagnostics();
    } catch (e) {
      this.logDev("Audio unlock failed: " + e);
    }
  }

  // --- 3. MICROPHONE PERMISSIONS FLOW ---
  public async requestMicrophonePermission(): Promise<boolean> {
    this.transitionTo("requesting_permission");
    this.logDev("Requesting user microphone permission...");

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      this.lastError = "Microphone APIs not supported in this browser.";
      this.transitionTo("unsupported");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop temporary tracks immediately to avoid keeping microphone active icon permanently
      stream.getTracks().forEach((track) => track.stop());

      this.transitionTo("ready");
      this.logDev("Microphone permission granted successfully!");
      return true;
    } catch (error: any) {
      console.warn("[CypherAudioEngine] Microphone access denied:", error);
      this.lastError = error.message || "Microphone access blocked.";
      this.transitionTo("permission_denied");
      return false;
    }
  }

  // --- 4. CONTROLLED SPEECH RECOGNITION ---
  public async startListening() {
    this.unlockAudio();

    if (this.state === "listening" || this.state === "starting") {
      this.lastStartBlockReason = "Already listening or starting.";
      this.logDev(`Start listening BLOCKED: ${this.lastStartBlockReason}`);
      return;
    }

    // Safety check: SpeechSynthesis or playbacks must be stopped first
    this.stopSpeaking();

    // Verify permission first
    if (this.state === "permission_denied") {
      this.lastStartBlockReason = "Microphone permission is denied.";
      this.logDev(this.lastStartBlockReason);
      return;
    }

    this.transitionTo("starting");
    this.startLock = true;
    this.currentTranscript = "";
    this.currentInterimTranscript = "";

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.lastStartBlockReason = "Web Speech Recognition not supported in this browser.";
      this.transitionTo("unsupported");
      this.startLock = false;
      return;
    }

    // Lazy load the SpeechRecognition singleton
    if (!this.recognition) {
      this.logDev("Creating new SpeechRecognition engine instance...");
      this.recognition = new Ctor();
      this.activeRecognitionCount = 1;
      this.setupRecognitionCallbacks();
    }

    // Apply strict configuration
    this.recognition.continuous = false; // Push-To-Talk is continuous false for premium Android/iOS support
    this.recognition.interimResults = true;
    this.recognition.lang = "en-NG"; // Configured preference
    this.recognition.maxAlternatives = 1;

    try {
      this.logDev("Invoking recognition.start()...");
      this.recognition.start();
    } catch (e: any) {
      this.logDev("Failed to start speech recognition: " + e.message);
      this.handleRecognitionError("aborted", e.message);
      this.startLock = false;
    }
  }

  public stopListening() {
    this.logDev("stopListening requested.");
    this.isConversationActive = false;
    this.startLock = false;
    this.clearRestartTimers();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        /* noop */
      }
    }
    this.transitionTo("idle");
  }

  public cancelListening() {
    this.logDev("cancelListening requested.");
    this.isConversationActive = false;
    this.startLock = false;
    this.clearRestartTimers();

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        /* noop */
      }
    }
    this.transitionTo("idle");
  }

  private setupRecognitionCallbacks() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.logDev("Recognition started!");
      this.consecutiveErrors = 0;
      this.startLock = false;
      this.transitionTo("listening");
    };

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      this.currentInterimTranscript = interim;
      if (final) {
        this.currentTranscript = final.trim();
        this.logDev(`Result received: "${this.currentTranscript}" (isFinal: true)`);
        this.processTranscript(this.currentTranscript);
      } else {
        this.notifyDiagnostics();
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error || "unknown";
      this.logDev(`Recognition error: ${error}`);
      this.handleRecognitionError(error, event.message || "");
    };

    this.recognition.onend = () => {
      this.logDev("Recognition ended.");
      this.startLock = false;

      // If we received transcript or are speaking/processing, we don't restart here
      if (this.state === "listening" || this.state === "starting") {
        this.transitionTo("idle");
      }

      // Continuous always-on restart logic under strict conditions
      if (this.isConversationActive && this.state === "idle" && !this.startLock) {
        this.scheduleRestart();
      }
    };
  }

  private handleRecognitionError(error: string, originalMessage: string) {
    this.consecutiveErrors++;
    this.lastError = error;

    let userFriendlyMsg = "Voice error. Please try again.";

    switch (error) {
      case "not-allowed":
        this.isConversationActive = false;
        userFriendlyMsg = "Microphone access is blocked. Allow microphone permission in your browser settings, then try again.";
        this.transitionTo("permission_denied");
        break;
      case "service-not-allowed":
        this.isConversationActive = false;
        userFriendlyMsg = "I couldn't access voice services. Browser speech recognition is temporarily unavailable.";
        this.transitionTo("unsupported");
        break;
      case "audio-capture":
        this.isConversationActive = false;
        userFriendlyMsg = "I couldn't access your phone's microphone. Another app may be using it.";
        this.transitionTo("error");
        break;
      case "network":
        userFriendlyMsg = "Voice recognition needs a stable internet connection.";
        this.transitionTo("error");
        break;
      case "no-speech":
        userFriendlyMsg = "I didn't hear anything. Tap the microphone and try again.";
        this.transitionTo("idle");
        break;
      case "aborted":
        // Usually deliberate cancel
        userFriendlyMsg = "";
        this.transitionTo("idle");
        break;
      default:
        this.transitionTo("error");
        break;
    }

    if (userFriendlyMsg) {
      this.logDev(`User visible message: ${userFriendlyMsg}`);
    }

    // Stop continuous loop if consecutive failures are too high
    if (this.consecutiveErrors >= 4) {
      this.logDev("Consecutive errors exceeded threshold. Disabling continuous mode.");
      this.isConversationActive = false;
      this.clearRestartTimers();
    }
  }

  private scheduleRestart() {
    this.clearRestartTimers();

    const backoffs = [800, 1500, 3000, 5000];
    const delay = backoffs[Math.min(this.retryCount, backoffs.length - 1)];
    this.retryCount++;

    this.logDev(`Scheduling restart in ${delay}ms... (Attempt ${this.retryCount})`);
    this.restartTimeout = setTimeout(() => {
      this.startListening();
    }, delay);
  }

  private clearRestartTimers() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  // --- 5. TRANSCRIPT PIPELINE & DEDUPLICATION ---
  private async processTranscript(text: string) {
    const normalized = text.toLowerCase().trim();
    if (!normalized) return;

    // Check duplicate cache
    const now = Date.now();
    const lastSeen = this.duplicateCache.get(normalized);
    if (lastSeen && now - lastSeen < 2500) {
      this.logDev(`DUPLICATE transcript prevented: "${normalized}"`);
      return;
    }
    this.duplicateCache.set(normalized, now);

    this.transitionTo("transcript_received");
    this.lastFinalTranscript = text;

    // Generate unique Request ID
    this.activeRequestId = "req_" + Math.random().toString(36).substring(2, 9);
    this.transitionTo("processing");

    // Stop Speech Recognition before processing/speaking begins!
    this.stopListening();

    // Trigger intent parsing
    const intent = parseCypherIntent(text);
    this.logDev(`Processing intent: ${intent} for Request ${this.activeRequestId}`);

    // Dispatch custom event to React hooks
    const customEvent = new CustomEvent("cypherIntentMatched", {
      detail: { intent, transcript: text, requestId: this.activeRequestId }
    });
    window.dispatchEvent(customEvent);
  }

  // --- 6. PREMIUM ELEVENLABS SPEAK MANAGER ---
  public async speak(displayText: string, spokenText: string) {
    this.stopSpeaking();
    this.transitionTo("generating_voice");

    if (!this.settings.voiceResponses) {
      this.logDev("Speech synthesize blocked: Voice responses are muted in preferences.");
      this.transitionTo("idle");
      return;
    }

    this.ttsProvider = this.settings.browserVoiceFallback ? "browser" : "elevenlabs";
    this.logDev(`Starting TTS Synthesis using provider: ${this.ttsProvider}`);

    const startAt = Date.now();
    this.elevenLabsStatus = "generating";
    this.notifyDiagnostics();

    try {
      // Direct integration to secure proxy or fallback syntheses
      await elevenLabsSpeechService.speak(spokenText, (status) => {
        if (status === "playing") {
          this.transitionTo("speaking");
          this.elevenLabsStatus = "playing";
          this.elevenLabsLatency = Date.now() - startAt;
        } else if (status === "stopped") {
          this.transitionTo("idle");
          this.elevenLabsStatus = "stopped";
        } else if (status === "failed") {
          this.transitionTo("error");
          this.elevenLabsStatus = "failed";
        }
        this.notifyDiagnostics();
      });

      this.consecutiveErrors = 0;
      this.retryCount = 0;

      // Re-enable always-on/follow-up after speaking completes
      if (this.isConversationActive) {
        this.startListening();
      } else {
        this.transitionTo("idle");
      }
    } catch (e) {
      this.logDev("TTS generation failed: " + e);
      this.transitionTo("error");
    }
  }

  public stopSpeaking() {
    this.logDev("stopSpeaking requested.");
    elevenLabsSpeechService.stop();
    if (this.state === "speaking" || this.state === "generating_voice") {
      this.transitionTo("idle");
    }
  }

  // --- 7. CONVERSATION MODE WRAPPERS ---
  public enableConversationMode() {
    this.isConversationActive = true;
    this.retryCount = 0;
    this.startListening();
  }

  public disableConversationMode() {
    this.isConversationActive = false;
    this.stopListening();
  }

  // --- 8. LIFECYCLE COORDINATION ---
  private setupLifecycleListeners() {
    if (typeof window === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        this.logDev("App hidden. Pausing microphones...");
        this.cancelListening();
      } else {
        this.logDev("App visible again.");
        if (this.isConversationActive) {
          this.startListening();
        }
      }
    };

    const handleNetwork = () => {
      this.notifyDiagnostics();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleNetwork);
    window.addEventListener("offline", handleNetwork);
  }

  // --- 9. DIAGNOSTICS & TELEMETRY ---
  private browserName = "Unknown";
  private browserVersion = "Unknown";
  private isPWA = false;

  private detectBrowserInfo() {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    this.isPWA = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;

    if (ua.includes("Chrome")) {
      this.browserName = "Google Chrome";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      this.browserName = "Safari iOS/macOS";
    } else if (ua.includes("SamsungBrowser")) {
      this.browserName = "Samsung Internet";
    }
  }

  private notifyDiagnostics() {
    const diag: AudioDiagnostics = {
      browserName: this.browserName,
      browserVersion: this.browserVersion,
      isPWA: this.isPWA,
      recognitionSupported: !!getSpeechRecognitionCtor(),
      activeRecognitionCount: this.activeRecognitionCount,
      microphonePermission: this.state === "permission_denied" ? "denied" : this.state === "unsupported" ? "unsupported" : "granted",
      audioState: this.state,
      conversationMode: this.isConversationActive,
      restartCount: this.retryCount,
      lastRecognitionError: this.lastError,
      lastStartBlockReason: this.lastStartBlockReason,
      lastInterimTranscript: this.currentInterimTranscript,
      lastFinalTranscript: this.lastFinalTranscript,
      duplicateTranscriptPrevented: false,
      ttsProvider: this.ttsProvider,
      elevenLabsStatus: this.elevenLabsStatus,
      elevenLabsLatency: this.elevenLabsLatency,
      playbackStatus: this.elevenLabsStatus,
      autoplayUnlocked: this.audioUnlocked,
      activeTimersCount: this.restartTimeout ? 1 : 0,
      currentRequestId: this.activeRequestId
    };

    this.diagnosticsListeners.forEach((listener) => listener(diag));
  }

  private logDev(msg: string) {
    console.log(`[CypherAudioEngine] [${this.state.toUpperCase()}] ${msg}`);
    this.notifyDiagnostics();
  }

  public destroy() {
    this.clearRestartTimers();
    this.cancelListening();
    this.stopSpeaking();
    this.listeners.clear();
    this.diagnosticsListeners.clear();
    CypherAudioEngine.instance = null;
  }
}
