import { useEffect, useRef, useState, useCallback } from "react";
import { CypherState, CypherIntent, CypherSettings, HistoryItem } from "../types";
import { cypherSettingsService } from "../settings/settingsService";
import { cypherHistoryService } from "../history/historyService";
import { parseCypherIntent } from "../intents/cypherIntentRouter";
import {
  speechRecognitionService,
  SpeechRecognitionService,
} from "../services/speechRecognitionService";
import { elevenLabsSpeechService } from "../services/elevenLabsSpeechService";
import { chimeService } from "../services/chimeService";
import { cypherKnowledgeService } from "../services/cypherKnowledgeService";
import { smartWattControlService } from "../services/smartWattControlService";
import { supabase } from "@/lib/supabase";

export function useCypher(isAuthenticated: boolean) {
  const [settings, setSettings] = useState<CypherSettings>(() =>
    cypherSettingsService.getSettings(),
  );
  const [history, setHistory] = useState<HistoryItem[]>(() => cypherHistoryService.getHistory());
  const [state, setState] = useState<CypherState>("sleeping");
  const [activeVoiceMode, setActiveVoiceMode] = useState<
    "none" | "elevenlabs" | "fallback" | "playing"
  >("none");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Sleeping");
  const [followUpCountdown, setFollowUpCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const isExecutingRef = useRef(false);
  const followUpTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Keep a ref of state to avoid React stale closure issues in the continuous listener callbacks
  const stateRef = useRef<CypherState>("sleeping");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync settings and history
  useEffect(() => {
    const unsubSettings = cypherSettingsService.subscribe(setSettings);
    const unsubHistory = cypherHistoryService.subscribe(setHistory);
    return () => {
      unsubSettings();
      unsubHistory();
    };
  }, []);

  // Shutdown voice engines
  const terminateVoiceEngines = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.destroy();
      recognitionRef.current = null;
    }
    elevenLabsSpeechService.stop();
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setFollowUpCountdown(null);
    isExecutingRef.current = false;
  }, []);

  // Stop / Cancel Current Action
  const handleStop = useCallback(() => {
    elevenLabsSpeechService.stop();
    setState("sleeping");
    setStatusMessage("Sleeping");
    terminateVoiceEngines();

    // If always-on is enabled, reset it back to sleeping (listening for wake word)
    if (settings.alwaysOnListening) {
      initiateSpeechRecognition();
    }
  }, [settings.alwaysOnListening, terminateVoiceEngines]);

  // Execute actual intent
  const executeIntent = useCallback(
    async (intent: CypherIntent, rawText: string) => {
      if (isExecutingRef.current) {
        setStatusMessage("Please wait while I complete the current command.");
        await elevenLabsSpeechService.speak(
          "Please wait while I complete the current command.",
          (v) => setActiveVoiceMode(v),
        );
        return;
      }
      isExecutingRef.current = true;
      setState("processing");
      setStatusMessage("Understanding command…");

      // Helper to log and output speech response
      const respond = async (
        text: string,
        histStatus: HistoryItem["status"],
        histResult: string,
      ) => {
        setState("speaking");
        setStatusMessage("Speaking…");
        cypherHistoryService.addHistoryItem(rawText, intent, histResult, histStatus);
        await elevenLabsSpeechService.speak(text, (v) => setActiveVoiceMode(v));
        isExecutingRef.current = false;

        // Post-response action: follow-up window (10 seconds)
        startFollowUpWindow();
      };

      // Before login restrictions
      if (!isAuthenticated) {
        const authRequiredIntents: CypherIntent[] = [
          "TURN_ON",
          "TURN_OFF",
          "GET_BULB_STATUS",
          "GET_DEVICE_STATUS",
        ];
        if (authRequiredIntents.includes(intent)) {
          const msg = cypherKnowledgeService.getPreLoginControlAttemptMessage();
          await respond(msg, "Failed", "Access Denied (Pre-login)");
          return;
        }
      }

      switch (intent) {
        case "TURN_ON":
        case "TURN_OFF": {
          const turnOn = intent === "TURN_ON";
          setState("executing");
          setStatusMessage(turnOn ? "Turning on the bulb…" : "Turning off the bulb…");

          // 1. Check if device is online
          const device = await smartWattControlService.getDevice();
          if (!device) {
            const msg = "I couldn't reach the server. Please check your connection.";
            await respond(msg, "Failed", "Network Error");
            return;
          }

          if (!device.online) {
            const msg = cypherKnowledgeService.getOfflineDeviceMessage();
            await respond(msg, "Failed", "Device Offline");
            return;
          }

          // 2. Set desired state
          const { success, error } = await smartWattControlService.setDesiredState(turnOn);
          if (!success) {
            const msg = `Failed to send command. ${error || ""}`;
            await respond(msg, "Failed", "Relay Command Failed");
            return;
          }

          // 3. Wait for actual_state confirmation
          setStatusMessage("Waiting for device confirmation…");
          const confirmed = await smartWattControlService.waitForDeviceConfirmation(turnOn);
          if (confirmed) {
            const msg = turnOn ? "The bulb is now on." : "The bulb is now off.";
            await respond(msg, "Completed", turnOn ? "Bulb ON" : "Bulb OFF");
          } else {
            const msg = cypherKnowledgeService.getNoConfirmationMessage();
            await respond(msg, "Failed", "Confirmation Timeout");
          }
          break;
        }

        case "GET_BULB_STATUS": {
          const device = await smartWattControlService.getDevice();
          if (!device) {
            await respond(
              "I couldn't read the bulb status right now.",
              "Failed",
              "Error reading state",
            );
            return;
          }
          const stateStr = device.actual_state ? "on" : "off";
          await respond(
            `The bulb is currently ${stateStr}.`,
            "Answered",
            `Bulb is ${stateStr.toUpperCase()}`,
          );
          break;
        }

        case "GET_DEVICE_STATUS": {
          const device = await smartWattControlService.getDevice();
          if (!device) {
            await respond("I couldn't reach the device status.", "Failed", "Network error");
            return;
          }
          const statusStr = device.online ? "online" : "offline";
          await respond(
            `The device is ${statusStr}.`,
            "Answered",
            `Device is ${statusStr.toUpperCase()}`,
          );
          break;
        }

        case "OPEN_SETTINGS": {
          window.location.assign("/settings");
          await respond("Opening settings.", "Completed", "Settings Opened");
          break;
        }

        case "HELP": {
          await respond(
            "I can turn the bulb on or off, report its status, check whether Smart Watt is online, open settings, and answer questions about NoskyTech.",
            "Answered",
            "Help provided",
          );
          break;
        }

        case "SAFETY_INFO": {
          await respond(
            "For safety, mains electrical wiring should be installed and maintained by a qualified person.",
            "Answered",
            "Safety info provided",
          );
          break;
        }

        case "UNKNOWN_HARDWARE": {
          const msg = cypherKnowledgeService.getUnsupportedDeviceMessage();
          await respond(msg, "Failed", "Unsupported Device Request");
          break;
        }

        case "EXPLAIN_NOSKYTECH": {
          const ans = cypherKnowledgeService.getAnswer("What is NoskyTech?") || "";
          await respond(ans, "Answered", "Explained NoskyTech");
          break;
        }

        case "EXPLAIN_SMARTWATT": {
          const ans = cypherKnowledgeService.getAnswer("What is SMART WATT?") || "";
          await respond(ans, "Answered", "Explained Smart Watt");
          break;
        }

        case "EXPLAIN_CYPHER": {
          const ans = cypherKnowledgeService.getAnswer("What is Cypher?") || "";
          await respond(ans, "Answered", "Explained Cypher");
          break;
        }

        case "GUIDE_SIGNIN": {
          await respond(
            "To sign in, locate the email and password fields on the main page, input your credentials, and click Sign In. Hardware control requires authentication.",
            "Answered",
            "Guided Sign-In",
          );
          break;
        }

        case "OPEN_PRIVACY": {
          // Find existing Legal modal triggers or link
          const trigger = document.querySelector(
            '[data-legal-trigger="privacy"]',
          ) as HTMLButtonElement | null;
          if (trigger) trigger.click();
          await respond("Displaying the privacy policy.", "Completed", "Privacy Policy Opened");
          break;
        }

        case "OPEN_TERMS": {
          const trigger = document.querySelector(
            '[data-legal-trigger="terms"]',
          ) as HTMLButtonElement | null;
          if (trigger) trigger.click();
          await respond("Displaying the terms of use.", "Completed", "Terms of Use Opened");
          break;
        }

        case "OPEN_CONTACT": {
          const trigger = document.querySelector(
            '[data-legal-trigger="contact"]',
          ) as HTMLButtonElement | null;
          if (trigger) trigger.click();
          await respond(
            "You can contact NoskyTech at noskytech1@gmail.com or visit noskytech.vercel.app.",
            "Answered",
            "Contact Info Provided",
          );
          break;
        }

        case "CONVERSATION": {
          await respond(
            "Hello, I am Cypher. How can I assist you with your Smart Watt automation today?",
            "Answered",
            "Greeting response",
          );
          break;
        }

        case "UNKNOWN":
        default: {
          const answer = cypherKnowledgeService.getAnswer(rawText);
          if (answer) {
            await respond(answer, "Answered", "Knowledge Answered");
          } else {
            const fb = cypherKnowledgeService.getFallbackMessage();
            await respond(fb, "Failed", "Unknown command fallback");
          }
          break;
        }
      }
    },
    [isAuthenticated, settings.alwaysOnListening],
  );

  // Handle follow-up countdown
  const startFollowUpWindow = useCallback(() => {
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setState("listening");
    setStatusMessage("Listening (Follow-up)");
    setFollowUpCountdown(10);

    // Re-init recognition for active listening
    initiateSpeechRecognition(true);

    let timeLeft = 10;
    countdownIntervalRef.current = setInterval(() => {
      timeLeft--;
      setFollowUpCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        setFollowUpCountdown(null);
      }
    }, 1000);

    followUpTimerRef.current = setTimeout(() => {
      setFollowUpCountdown(null);
      if (settings.alwaysOnListening) {
        // Return back to continuous wake phrase mode
        setState("sleeping");
        setStatusMessage("Sleeping (Always-On active)");
        initiateSpeechRecognition(false);
      } else {
        // PTT stops
        setState("sleeping");
        setStatusMessage("Sleeping");
        terminateVoiceEngines();
      }
    }, 10000);
  }, [settings.alwaysOnListening, terminateVoiceEngines]);

  // Initiate speech recognition service
  const initiateSpeechRecognition = useCallback(
    (isFollowUp = false) => {
      // If voice control disabled in preferences, block
      if (
        settings.listeningMode === "push_to_talk" &&
        !isFollowUp &&
        stateRef.current === "sleeping"
      ) {
        // Don't listen automatically in PTT sleep mode
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.destroy();
      }

      // Always-on is continuous unless it's a dedicated follow-up window (which allows wake-phrase bypass)
      const alwaysOnActive = settings.alwaysOnListening && !isFollowUp;

      recognitionRef.current = new SpeechRecognitionService(
        {
          onResult: (text, isFinal) => {
            const lower = text.toLowerCase();

            if (alwaysOnActive && stateRef.current === "sleeping") {
              // Check for wake word
              const hasWake = lower.includes("hey cypher") || lower.includes("cypher");
              if (hasWake) {
                // Play premium chime
                void chimeService.playActivationChime();
                setState("listening");
                setStatusMessage("Listening…");
                setTranscript("");
                setInterimTranscript("");

                // Strip wake phrase from command if present in exact stream
                const cleanText = text
                  .replace(/hey cypher/gi, "")
                  .replace(/cypher/gi, "")
                  .trim();
                if (cleanText) {
                  setTranscript(cleanText);
                }
              }
              return;
            }

            if (isFinal) {
              setTranscript(text);
              setInterimTranscript("");

              // Clear any active follow-up timers once a command is received
              if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setFollowUpCountdown(null);

              // Execute the matched command
              const intent = parseCypherIntent(text);
              void executeIntent(intent, text);
            } else {
              setInterimTranscript(text);
            }
          },
          onStateChange: (recState) => {
            if (recState === "listening") {
              if (alwaysOnActive) {
                setState("sleeping");
                setStatusMessage("Always-On listening for wake word…");
              } else if (isFollowUp) {
                setState("listening");
                setStatusMessage("Listening (Follow-up)");
              } else {
                setState("listening");
                setStatusMessage("Listening…");
              }
            } else if (recState === "paused_access") {
              setState("reconnecting");
              setStatusMessage("Cypher paused because the browser stopped microphone access.");
            } else if (recState === "error") {
              setState("microphone_disabled");
              setStatusMessage("Microphone permission required.");
            }
          },
          onError: (errType, msg) => {
            if (errType === "permission-denied") {
              setState("permission_required");
              setStatusMessage("Microphone permission is required.");
            } else {
              setStatusMessage(msg);
            }
          },
          onEnd: () => {
            setInterimTranscript("");
          },
        },
        {
          isAlwaysOn: alwaysOnActive,
          wakePhrases: [settings.wakePhrase],
          lang: "en-NG",
        },
      );

      recognitionRef.current.start();
    },
    [settings, executeIntent],
  );

  // Activate microphone manually (Push-To-Talk trigger or manual wakeup)
  const handleMicrophoneClick = useCallback(() => {
    const curState = stateRef.current;
    if (
      curState === "listening" ||
      curState === "processing" ||
      curState === "executing" ||
      curState === "speaking"
    ) {
      handleStop();
    } else {
      // Clear followups
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setFollowUpCountdown(null);

      // Play chime
      void chimeService.playActivationChime();
      setTranscript("");
      setInterimTranscript("");
      setState("listening");
      setStatusMessage("Listening…");
      initiateSpeechRecognition(true); // Initiate a single command-listening session
    }
  }, [handleStop, initiateSpeechRecognition]);

  // Sync Always-On preference with listener lifetime
  useEffect(() => {
    if (settings.alwaysOnListening) {
      initiateSpeechRecognition(false);
    } else {
      terminateVoiceEngines();
    }
    return () => {
      terminateVoiceEngines();
    };
  }, [settings.alwaysOnListening]);

  // Re-sync listener when browser window gets refocused or restored
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      if (
        settings.alwaysOnListening &&
        stateRef.current === "sleeping" &&
        !recognitionRef.current
      ) {
        initiateSpeechRecognition(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [settings.alwaysOnListening, initiateSpeechRecognition]);

  return {
    state,
    settings,
    history,
    transcript,
    interimTranscript,
    statusMessage,
    activeVoiceMode,
    followUpCountdown,
    handleMicrophoneClick,
    handleStop,
    executeIntent,
  };
}
export type UseCypherReturn = ReturnType<typeof useCypher>;
