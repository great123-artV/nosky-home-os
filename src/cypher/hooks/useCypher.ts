import { useEffect, useRef, useState, useCallback } from "react";
import { CypherState, CypherIntent, CypherSettings, HistoryItem, AudioDiagnostics } from "../types";
import { cypherSettingsService } from "../settings/settingsService";
import { cypherHistoryService } from "../history/historyService";
import { CypherAudioEngine } from "../services/cypherAudioEngine";
import { cypherKnowledgeService } from "../services/cypherKnowledgeService";
import { smartWattControlService } from "../services/smartWattControlService";
import { chimeService } from "../services/chimeService";

export function useCypher(isAuthenticated: boolean) {
  const engine = CypherAudioEngine.getInstance();

  const [state, setState] = useState<CypherState>(() => engine.getState());
  const [settings, setSettings] = useState<CypherSettings>(() => cypherSettingsService.getSettings());
  const [history, setHistory] = useState<HistoryItem[]>(() => cypherHistoryService.getHistory());
  const [statusMessage, setStatusMessage] = useState("Sleeping");
  const [followUpCountdown, setFollowUpCountdown] = useState<number | null>(null);

  // Streaming transcripts from the engine
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics | null>(null);

  const followUpTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // 1. Sync global engine state and settings
  useEffect(() => {
    const unsubState = engine.subscribe((engineState) => {
      setState(engineState);

      // Update human-friendly status messages based on our core state-machine
      switch (engineState) {
        case "idle":
          setStatusMessage(settings.alwaysOnListening ? "Always-On listening active. Say 'Hey Cypher'." : "Sleeping. Tap microphone to speak.");
          break;
        case "requesting_permission":
          setStatusMessage("Acquiring microphone access...");
          break;
        case "starting":
          setStatusMessage("Activating microphone...");
          break;
        case "listening":
          setStatusMessage("Cypher is listening...");
          break;
        case "transcript_received":
          setStatusMessage("Command received!");
          break;
        case "processing":
          setStatusMessage("Processing request...");
          break;
        case "executing":
          setStatusMessage("Executing hardware action...");
          break;
        case "generating_voice":
          setStatusMessage("Generating speech response...");
          break;
        case "speaking":
          setStatusMessage("Speaking...");
          break;
        case "permission_denied":
          setStatusMessage("Microphone permission is blocked in your browser.");
          break;
        case "unsupported":
          setStatusMessage("Voice recognition is not supported in this browser.");
          break;
        default:
          setStatusMessage("Ready");
          break;
      }
    });

    const unsubDiag = engine.subscribeDiagnostics((diag) => {
      setDiagnostics(diag);
      setTranscript(diag.lastFinalTranscript);
      setInterimTranscript(diag.lastInterimTranscript);
    });

    const unsubSettings = cypherSettingsService.subscribe(setSettings);
    const unsubHistory = cypherHistoryService.subscribe(setHistory);

    return () => {
      unsubState();
      unsubDiag();
      unsubSettings();
      unsubHistory();
    };
  }, [engine, settings.alwaysOnListening]);

  // Handle Stop/Cancel trigger
  const handleStop = useCallback(() => {
    engine.stopListening();
    engine.stopSpeaking();
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setFollowUpCountdown(null);
  }, [engine]);

  // Execute actual command logic matched from the engine's pipeline
  const executeIntent = useCallback(async (intent: CypherIntent, rawText: string, requestId: string) => {
    // Helper to log and synthesize speech response with high quality voice separation
    const respond = async (
      displayText: string,
      spokenText: string,
      histStatus: HistoryItem["status"],
      histResult: string,
      responseType: "command_confirmation" | "knowledge" | "error" | "greeting"
    ) => {
      engine.stopListening();
      cypherHistoryService.addHistoryItem(rawText, intent, histResult, histStatus);

      // Perform speech synthesize securely
      await engine.speak(displayText, spokenText);

      // Post-response action: initiate follow-up window (10 seconds)
      startFollowUpWindow();
    };

    // Pre-login safety restrictions check
    if (!isAuthenticated) {
      const authRequiredIntents: CypherIntent[] = ["TURN_ON", "TURN_OFF", "GET_BULB_STATUS", "GET_DEVICE_STATUS"];
      if (authRequiredIntents.includes(intent)) {
        const msg = cypherKnowledgeService.getPreLoginControlAttemptMessage();
        await respond(msg, msg, "Failed", "Access Denied (Pre-login)", "error");
        return;
      }
    }

    switch (intent) {
      case "TURN_ON":
      case "TURN_OFF": {
        const turnOn = intent === "TURN_ON";

        // 1. Check if device is online
        const device = await smartWattControlService.getDevice();
        if (!device) {
          const msg = "I couldn't reach the server. Please check your connection.";
          await respond(msg, msg, "Failed", "Network Error", "error");
          return;
        }

        if (!device.online) {
          const msg = cypherKnowledgeService.getOfflineDeviceMessage();
          await respond(msg, msg, "Failed", "Device Offline", "error");
          return;
        }

        // 2. Set desired state
        const updateRes = await smartWattControlService.setDesiredState(turnOn);
        if (!updateRes.success) {
          const msg = `Failed to send command. ${updateRes.error || ""}`;
          await respond(msg, msg, "Failed", "Relay Command Failed", "error");
          return;
        }

        // 3. Wait for actual_state confirmation
        const confirmed = await smartWattControlService.waitForDeviceConfirmation(turnOn);
        if (confirmed) {
          const msg = turnOn ? "The bulb is now on." : "The bulb is now off.";
          await respond(msg, msg, "Completed", turnOn ? "Bulb ON" : "Bulb OFF", "command_confirmation");
        } else {
          const msg = cypherKnowledgeService.getNoConfirmationMessage();
          await respond(msg, msg, "Failed", "Confirmation Timeout", "error");
        }
        break;
      }

      case "GET_BULB_STATUS": {
        const device = await smartWattControlService.getDevice();
        if (!device) {
          const msg = "I couldn't read the bulb status right now.";
          await respond(msg, msg, "Failed", "Error reading state", "error");
          return;
        }
        const stateStr = device.actual_state ? "on" : "off";
        await respond(`The bulb is currently ${stateStr}.`, `The bulb is currently ${stateStr}.`, "Answered", `Bulb is ${stateStr.toUpperCase()}`, "knowledge");
        break;
      }

      case "GET_DEVICE_STATUS": {
        const device = await smartWattControlService.getDevice();
        if (!device) {
          const msg = "I couldn't reach the device status.";
          await respond(msg, msg, "Failed", "Network error", "error");
          return;
        }
        const statusStr = device.online ? "online" : "offline";
        await respond(`The device is ${statusStr}.`, `The device is ${statusStr}.`, "Answered", `Device is ${statusStr.toUpperCase()}`, "knowledge");
        break;
      }

      case "OPEN_SETTINGS": {
        window.location.assign("/settings");
        await respond("Opening settings.", "Opening settings.", "Completed", "Settings Opened", "knowledge");
        break;
      }

      case "HELP": {
        const disp = "I can turn the bulb on or off, report its status, check whether Smart Watt is online, open settings, and answer questions about NoskyTech.";
        const spok = "I can control your bulb, check status, or answer questions about NoskyTech.";
        await respond(disp, spok, "Answered", "Help provided", "knowledge");
        break;
      }

      case "SAFETY_INFO": {
        const disp = "For safety, mains electrical wiring should be installed and maintained by a qualified person.";
        const spok = "For safety, electrical wiring should be installed by a qualified person.";
        await respond(disp, spok, "Answered", "Safety info provided", "knowledge");
        break;
      }

      case "UNKNOWN_HARDWARE": {
        const msg = cypherKnowledgeService.getUnsupportedDeviceMessage();
        await respond(msg, msg, "Failed", "Unsupported Device Request", "error");
        break;
      }

      case "EXPLAIN_NOSKYTECH": {
        const disp = cypherKnowledgeService.getAnswer("What is NoskyTech?") || "";
        const spok = "NoskyTech is a technology company focused on smart automation, the Internet of Things, and African innovation.";
        await respond(disp, spok, "Answered", "Explained NoskyTech", "knowledge");
        break;
      }

      case "EXPLAIN_SMARTWATT": {
        const disp = cypherKnowledgeService.getAnswer("What is SMART WATT?") || "";
        const spok = "SMART WATT is NoskyTech's secure system for remotely controlling supported electrical loads.";
        await respond(disp, spok, "Answered", "Explained Smart Watt", "knowledge");
        break;
      }

      case "EXPLAIN_CYPHER": {
        const disp = cypherKnowledgeService.getAnswer("What is Cypher?") || "";
        const spok = "I am Cypher, your premium NoskyTech voice assistant, designed for smart automation.";
        await respond(disp, spok, "Answered", "Explained Cypher", "knowledge");
        break;
      }

      case "GUIDE_SIGNIN": {
        const disp = "To sign in, locate the email and password fields on the main page, input your credentials, and click Sign In. Hardware control requires authentication.";
        const spok = "Please enter your email and password on the main page to sign in.";
        await respond(disp, spok, "Answered", "Guided Sign-In", "knowledge");
        break;
      }

      case "OPEN_PRIVACY": {
        const trigger = document.querySelector('[data-legal-trigger="privacy"]') as HTMLButtonElement | null;
        if (trigger) trigger.click();
        await respond("Displaying the privacy policy.", "Displaying the privacy policy.", "Completed", "Privacy Policy Opened", "knowledge");
        break;
      }

      case "OPEN_TERMS": {
        const trigger = document.querySelector('[data-legal-trigger="terms"]') as HTMLButtonElement | null;
        if (trigger) trigger.click();
        await respond("Displaying the terms of use.", "Displaying the terms of use.", "Completed", "Terms of Use Opened", "knowledge");
        break;
      }

      case "OPEN_CONTACT": {
        const disp = "You can contact NoskyTech at noskytech1@gmail.com or visit noskytech.vercel.app.";
        const spok = "You can contact NoskyTech at noskytech1@gmail.com.";
        await respond(disp, spok, "Answered", "Contact Info Provided", "knowledge");
        break;
      }

      case "CONVERSATION": {
        const msg = "Hello, I am Cypher. How can I assist you with your Smart Watt automation today?";
        await respond(msg, msg, "Answered", "Greeting response", "greeting");
        break;
      }

      case "UNKNOWN":
      default: {
        const answer = cypherKnowledgeService.getAnswer(rawText);
        if (answer) {
          await respond(answer, answer, "Answered", "Knowledge Answered", "knowledge");
        } else {
          const fb = cypherKnowledgeService.getFallbackMessage();
          await respond(fb, fb, "Failed", "Unknown command fallback", "error");
        }
        break;
      }
    }
  }, [isAuthenticated, engine]);

  // Coordinate Intent matching with global events emitted by the engine
  useEffect(() => {
    const handleMatchedIntent = (e: any) => {
      const { intent, transcript: rawText, requestId } = e.detail;
      void executeIntent(intent, rawText, requestId);
    };

    window.addEventListener("cypherIntentMatched", handleMatchedIntent);
    return () => {
      window.removeEventListener("cypherIntentMatched", handleMatchedIntent);
    };
  }, [executeIntent]);

  // Handle follow-up countdown
  const startFollowUpWindow = useCallback(() => {
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setFollowUpCountdown(10);
    engine.startListening();

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
      // Return back to continuous wake phrase mode if always-on is enabled, else stay idle
      if (!settings.alwaysOnListening) {
        engine.stopListening();
      }
    }, 10000);
  }, [settings.alwaysOnListening, engine]);

  // Activate microphone manually (Push-To-Talk trigger or manual wakeup)
  const handleMicrophoneClick = useCallback(async () => {
    const isMicGranted = await engine.requestMicrophonePermission();
    if (!isMicGranted) return;

    if (state === "listening" || state === "starting" || state === "speaking" || state === "generating_voice") {
      handleStop();
    } else {
      // Clear active follow-ups
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setFollowUpCountdown(null);

      // Play chime sound
      void chimeService.playActivationChime();
      engine.startListening();
    }
  }, [state, handleStop, engine]);

  // Cleanup on unmount or session log out
  useEffect(() => {
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return {
    state,
    settings,
    history,
    transcript,
    interimTranscript,
    statusMessage,
    activeVoiceMode: diagnostics?.ttsProvider || "text-only",
    followUpCountdown,
    diagnostics,
    handleMicrophoneClick,
    handleStop,
    executeIntent,
  };
}
export type UseCypherReturn = ReturnType<typeof useCypher>;
