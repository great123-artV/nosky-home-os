import { getSpeechRecognitionCtor } from "@/lib/cypher";
import { isCypherSpeaking } from "./audioEngine";



export interface SpeechRecognitionEvents {
  onResult: (transcript: string, isFinal: boolean) => void;
  onStateChange: (state: "idle" | "listening" | "processing" | "error" | "paused_access") => void;
  onError: (errorType: string, message: string) => void;
  onEnd: () => void;
}

// Global active instance tracker to prevent duplicate listeners/instances
let activeInstance: SpeechRecognitionService | null = null;

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isAlwaysOn: boolean = false;
  private wakePhrases: string[] = ["hey cypher", "cypher"];
  private callbacks: SpeechRecognitionEvents;
  private lang: string = "en-NG";
  private isDeactivated: boolean = false;
  private restartTimeout: any = null;
  private retryCount: number = 0;
  private maxRetries: number = 5;

  constructor(
    callbacks: SpeechRecognitionEvents,
    config?: { isAlwaysOn?: boolean; wakePhrases?: string[]; lang?: string },
  ) {
    this.callbacks = callbacks;
    this.isAlwaysOn = config?.isAlwaysOn ?? false;
    this.wakePhrases = config?.wakePhrases?.map((p) => p.toLowerCase()) ?? ["hey cypher", "cypher"];
    this.lang = config?.lang ?? "en-NG";

    if (activeInstance) {
      activeInstance.destroy();
    }
    activeInstance = this;

    this.initRecognition();
  }

  private initRecognition() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.callbacks.onError("unsupported", "Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recog = new Ctor();
      recog.lang = this.lang;
      recog.interimResults = true; // Required for wake phrase streaming and reactive display
      recog.continuous = false; // We manual-cycle continuous to avoid browser timeout hanging

      recog.onstart = () => {
        this.isListening = true;
        this.retryCount = 0;
        this.callbacks.onStateChange("listening");
      };

      recog.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullTranscript = (finalTranscript || interimTranscript).trim();
        if (fullTranscript) {
          this.callbacks.onResult(fullTranscript, !!finalTranscript);
        }
      };

      recog.onerror = (event: any) => {
        const error = event.error || "unknown";
        console.warn("[CypherSpeechRecognition] Error received:", error);

        if (error === "not-allowed") {
          this.callbacks.onStateChange("error");
          this.callbacks.onError("permission-denied", "Microphone permission is required.");
          this.isDeactivated = true;
        } else if (error === "no-speech") {
          // Silent failure in always-on, we just restart cycle
        } else {
          this.callbacks.onError(error, `Voice error: ${error}`);
        }
      };

      recog.onend = () => {
        this.isListening = false;
        this.callbacks.onEnd();

        if (this.isAlwaysOn && !this.isDeactivated) {
          this.handleAlwaysOnRestart();
        } else if (!this.isAlwaysOn) {
          this.callbacks.onStateChange("idle");
        }
      };

      this.recognition = recog;
    } catch (e) {
      console.error("[CypherSpeechRecognition] Initialization failed", e);
      this.callbacks.onError("init-failed", "Could not initialize voice recognition.");
    }
  }

  private handleAlwaysOnRestart() {
    if (this.isDeactivated) return;

    // Never restart while Cypher is speaking — this is what stops the
    // ding-dong feedback loop where the mic re-hears the wake word on
    // Cypher's own voice.
    if (isCypherSpeaking()) {
      if (this.restartTimeout) clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => this.handleAlwaysOnRestart(), 400);
      return;
    }

    const backoff = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
    this.retryCount++;

    if (this.retryCount > this.maxRetries) {
      this.callbacks.onStateChange("paused_access");
      this.callbacks.onError(
        "paused_access",
        "Cypher paused because the browser stopped microphone access.",
      );
      return;
    }

    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      this.start();
    }, backoff);
  }


  public start() {
    if (this.recognition && !this.isListening) {
      this.isDeactivated = false;
      try {
        this.recognition.start();
      } catch (e) {
        console.error("[CypherSpeechRecognition] Error starting speech recognition", e);
      }
    }
  }

  public stop() {
    this.isDeactivated = true;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        /* noop */
      }
    }
  }

  public abort() {
    this.isDeactivated = true;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        /* noop */
      }
    }
    this.isListening = false;
  }

  public updateConfig(config: { isAlwaysOn: boolean; lang: string }) {
    this.isAlwaysOn = config.isAlwaysOn;
    this.lang = config.lang;
    if (this.recognition) {
      this.recognition.lang = this.lang;
    }
  }

  public destroy() {
    this.abort();
    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}
export function getActiveSpeechRecognitionInstance() {
  return activeInstance;
}
