import { useEffect, useRef, useState, useCallback } from "react";
import { CypherState, CypherIntent, CypherSettings, HistoryItem } from "../types";
import { cypherSettingsService } from "../settings/settingsService";
import { cypherHistoryService } from "../history/historyService";
import { parseCypherIntent } from "../intents/cypherIntentRouter";
import { useSessionContext } from "../context/SessionContext";
import { deviceControlEngine } from "../services/deviceControlEngine";
import { cypherKnowledgeService } from "../services/cypherKnowledgeService";
import { navigationEngine } from "../services/navigationEngine";
import { responseEngine } from "../services/responseEngine";
import { audioEngine } from "../services/audioEngine";
import { useRouter } from "@tanstack/react-router";

export function useCypher() {
  const sessionCtx = useSessionContext();
  const router = useRouter();

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

  const isExecutingRef = useRef(false);
  const followUpTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Keep state reference up-to-date
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

  // Set initial status message depending on auth state
  useEffect(() => {
    if (sessionCtx.authStatus === "initializing") {
      setState("sleeping");
      setStatusMessage("Restoring your SMART WATT session…");
    } else {
      if (stateRef.current === "sleeping") {
        setStatusMessage("Sleeping");
      }
    }
  }, [sessionCtx.authStatus]);

  // Shutdown voice engines completely
  const terminateVoiceEngines = useCallback(() => {
    audioEngine.stopSpeechRecognition();
    audioEngine.stopPlayback();
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setFollowUpCountdown(null);
    isExecutingRef.current = false;
    sessionCtx.setSpeechRecognitionActive(false);
  }, [sessionCtx]);

  // Stop / Cancel active actions
  const handleStop = useCallback(() => {
    audioEngine.stopPlayback();
    setState("sleeping");
    setStatusMessage("Sleeping");
    terminateVoiceEngines();

    if (settings.alwaysOnListening) {
      initiateSpeechRecognition();
    }
  }, [settings.alwaysOnListening, terminateVoiceEngines]);

  // Unified voice/text intent executor
  const executeIntent = useCallback(
    async (intent: CypherIntent, rawText: string) => {
      if (isExecutingRef.current) {
        setStatusMessage("Please wait while I complete the current command.");
        await audioEngine.speak(
          "Please wait while I complete the current command.",
          (v) => {
            if (v === "playing") setActiveVoiceMode("playing");
            else if (v === "stopped" || v === "failed") setActiveVoiceMode("none");
          }
        );
        return;
      }

      isExecutingRef.current = true;
      setState("processing");
      setStatusMessage("Understanding command…");

      const handleResponseOutput = async (
        spokenText: string,
        uiText: string,
        histStatus: HistoryItem["status"],
        histResult: string,
      ) => {
        setState("speaking");
        setStatusMessage(uiText);
        cypherHistoryService.addHistoryItem(rawText, intent, histResult, histStatus);

        await audioEngine.speak(spokenText, (v) => {
          if (v === "playing") setActiveVoiceMode("playing");
          else if (v === "stopped" || v === "failed") setActiveVoiceMode("none");
        });

        isExecutingRef.current = false;
        startFollowUpWindow();
      };

      // Restoring protection gate: Block commands during session loading
      if (sessionCtx.authStatus === "initializing") {
        await handleResponseOutput(
          "Restoring your SMART WATT session...",
          "Restoring your SMART WATT session...",
          "Failed",
          "Session Initializing"
        );
        return;
      }

      // Pre-login protection gates for hardware controls
      const authRequiredIntents: CypherIntent[] = [
        "TURN_ON",
        "TURN_OFF",
        "GET_BULB_STATUS",
        "GET_DEVICE_STATUS",
        "REFRESH_DEVICE",
      ];

      if (authRequiredIntents.includes(intent) && !sessionCtx.isAuthenticated) {
        const msg = "Connect your NoskyTech account and products to control your smart ecosystem.";
        await handleResponseOutput(
          msg,
          msg,
          "Failed",
          "Access Denied (Unauthenticated)"
        );
        return;
      }

      // Handle Cancel / Stop Intents
      if (intent === "STOP" || intent === "CANCEL") {
        setState("sleeping");
        setStatusMessage("Sleeping");
        audioEngine.stopPlayback();
        isExecutingRef.current = false;
        if (settings.alwaysOnListening) {
          initiateSpeechRecognition(false);
        } else {
          terminateVoiceEngines();
        }
        return;
      }

      // Subsystem Routers
      switch (intent) {
        case "TURN_ON":
        case "TURN_OFF": {
          const turnOn = intent === "TURN_ON";
          setState("executing");
          setStatusMessage(turnOn ? "Turning on the bulb…" : "Turning off the bulb…");

          const res = await deviceControlEngine.executeBulbCommand(turnOn, sessionCtx);
          await handleResponseOutput(
            res.responseMessage,
            res.responseMessage,
            res.success ? "Completed" : "Failed",
            res.success ? (turnOn ? "Bulb ON" : "Bulb OFF") : (res.error || "Execution Error")
          );
          break;
        }

        case "GET_BULB_STATUS": {
          const outputs = responseEngine.generateResponse(intent, "success", {
            actualState: sessionCtx.actualState,
          });
          await handleResponseOutput(
            outputs.spokenText,
            outputs.uiText,
            "Answered",
            `Bulb state is ${sessionCtx.actualState ? "ON" : "OFF"}`
          );
          break;
        }

        case "GET_DEVICE_STATUS": {
          const outputs = responseEngine.generateResponse(intent, "success", {
            deviceOnline: sessionCtx.deviceOnline,
          });
          await handleResponseOutput(
            outputs.spokenText,
            outputs.uiText,
            "Answered",
            `Device online: ${sessionCtx.deviceOnline}`
          );
          break;
        }

        case "REFRESH_DEVICE": {
          setStatusMessage("Refreshing system metrics…");
          await sessionCtx.refreshDevice();
          await handleResponseOutput(
            "System telemetry successfully refreshed.",
            "Manual Sync completed. Device telemetry verified.",
            "Completed",
            "Metrics Synchronized"
          );
          break;
        }

        case "GO_DASHBOARD":
        case "OPEN_SETTINGS":
        case "OPEN_PRIVACY":
        case "OPEN_TERMS":
        case "SAFETY_INFO": {
          const res = navigationEngine.resolveNavigation(intent, router);
          await handleResponseOutput(
            res.speechMessage,
            res.speechMessage,
            res.success ? "Completed" : "Failed",
            intent
          );
          break;
        }

        case "UNKNOWN_HARDWARE": {
          const msg = cypherKnowledgeService.getUnsupportedDeviceMessage();
          const outputs = responseEngine.generateResponse(intent, "failure", {
            errorMsg: msg,
          });
          await handleResponseOutput(
            outputs.spokenText,
            outputs.uiText,
            "Failed",
            "Unsupported Hardware Request"
          );
          break;
        }

        case "EXPLAIN_NOSKYTECH":
        case "EXPLAIN_SMARTWATT":
        case "EXPLAIN_CYPHER":
        case "GUIDE_SIGNIN":
        case "GUIDE_INSTALLATION":
        case "GUIDE_PWA":
        case "OPEN_CONTACT":
        case "HELP": {
          // Resolve query using structured Knowledge Engine
          const queryText = rawText || intent;
          const { item, error } = cypherKnowledgeService.queryKnowledge(queryText, sessionCtx.isAuthenticated);

          if (error === "AuthRequired") {
            const msg = "Please sign in to access device configuration information.";
            await handleResponseOutput(msg, msg, "Failed", "Auth Restricted Knowledge");
            return;
          }

          if (item) {
            await handleResponseOutput(
              item.spokenAnswer,
              item.fullAnswer,
              "Answered",
              item.title
            );
          } else {
            // Fallback templates from JSON rules
            const fallText = cypherKnowledgeService.getFallbackMessage();
            await handleResponseOutput(fallText, fallText, "Answered", "General Help Menu");
          }
          break;
        }

        case "CONVERSATION": {
          const outputs = responseEngine.generateResponse(intent, "success");
          await handleResponseOutput(
            outputs.spokenText,
            outputs.uiText,
            "Answered",
            "Conversation Greeting"
          );
          break;
        }

        case "UNKNOWN":
        default: {
          const { item, error } = cypherKnowledgeService.queryKnowledge(rawText, sessionCtx.isAuthenticated);

          if (error === "AuthRequired") {
            const msg = "Please sign in to view private system answers.";
            await handleResponseOutput(msg, msg, "Failed", "Auth Restricted Query");
            return;
          }

          if (item) {
            await handleResponseOutput(
              item.spokenAnswer,
              item.fullAnswer,
              "Answered",
              item.title
            );
          } else {
            const fb = cypherKnowledgeService.getFallbackMessage();
            await handleResponseOutput(fb, fb, "Failed", "Unknown command fallback");
          }
          break;
        }
      }
    },
    [sessionCtx, settings, router],
  );

  // Implement 10-seconds Follow-Up activation
  const startFollowUpWindow = useCallback(() => {
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setState("listening");
    setStatusMessage("Listening (Follow-up)");
    setFollowUpCountdown(10);

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
        setState("sleeping");
        setStatusMessage("Sleeping (Always-On active)");
        initiateSpeechRecognition(false);
      } else {
        setState("sleeping");
        setStatusMessage("Sleeping");
        terminateVoiceEngines();
      }
    }, 10000);
  }, [settings.alwaysOnListening, terminateVoiceEngines]);

  // Initiate Audio Engine recognition loop
  const initiateSpeechRecognition = useCallback(
    (isFollowUp = false) => {
      if (settings.listeningMode === "push_to_talk" && !isFollowUp && stateRef.current === "sleeping") {
        return; // Push to talk mode stays sleeping
      }

      const alwaysOnActive = settings.alwaysOnListening && !isFollowUp;

      sessionCtx.setSpeechRecognitionActive(true);

      audioEngine.startSpeechRecognition(
        {
          onResult: (text, isFinal) => {
            const lower = text.toLowerCase();

            if (alwaysOnActive && stateRef.current === "sleeping") {
              const hasWake = lower.includes("hey cypher") || lower.includes("cypher");
              if (hasWake) {
                void audioEngine.playActivationChime();
                setState("listening");
                setStatusMessage("Listening…");
                setTranscript("");
                setInterimTranscript("");

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

              if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setFollowUpCountdown(null);

              const parsed = parseCypherIntent(text);
              void executeIntent(parsed.intent, text);
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
          wakePhrase: settings.wakePhrase,
        }
      );
    },
    [settings, executeIntent, sessionCtx],
  );

  // Manual Microphone Button Click trigger (PTT)
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
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setFollowUpCountdown(null);

      void audioEngine.playActivationChime();
      setTranscript("");
      setInterimTranscript("");
      setState("listening");
      setStatusMessage("Listening…");
      initiateSpeechRecognition(true);
    }
  }, [handleStop, initiateSpeechRecognition]);

  // Sync Always-On listener preference
  useEffect(() => {
    if (settings.alwaysOnListening) {
      initiateSpeechRecognition(false);
    } else {
      terminateVoiceEngines();
    }
    return () => {
      terminateVoiceEngines();
    };
  }, [settings.alwaysOnListening, initiateSpeechRecognition, terminateVoiceEngines]);

  // Sync window focus listener to restore always-on
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      if (
        settings.alwaysOnListening &&
        stateRef.current === "sleeping" &&
        sessionCtx.speechRecognitionActive === false
      ) {
        initiateSpeechRecognition(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [settings.alwaysOnListening, initiateSpeechRecognition, sessionCtx.speechRecognitionActive]);

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
