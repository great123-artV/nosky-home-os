import { CypherIntent } from "../types";

export interface ResponseOutputs {
  spokenText: string;
  uiText: string;
}

export const responseEngine = {
  /**
   * Generates highly-polished, human-like voice responses paired with explicit UI text outputs.
   */
  generateResponse(
    intent: CypherIntent,
    status: "success" | "failure" | "pending" | "initializing",
    context: {
      userEmail?: string;
      deviceOnline?: boolean;
      actualState?: boolean | null;
      errorMsg?: string | null;
      customMessage?: string;
    } = {},
  ): ResponseOutputs {
    if (status === "initializing") {
      return {
        spokenText: "Restoring your SMART WATT session...",
        uiText: "Restoring your SMART WATT session...",
      };
    }

    // Default template mappings
    switch (intent) {
      case "TURN_ON":
        if (status === "success") {
          return {
            spokenText: "The SMART WATT bulb has been turned on.",
            uiText: "Living room bulb has successfully switched ON.",
          };
        } else if (status === "pending") {
          return {
            spokenText: "Turning the bulb on. Waiting for device handshake...",
            uiText: "Sending command... Awaiting actual state handshake from physical device.",
          };
        } else {
          return {
            spokenText: context.errorMsg || "I couldn't toggle the bulb. Please verify your connection status.",
            uiText: `Command failed: ${context.errorMsg || "No response received from the ESP32 controller."}`,
          };
        }

      case "TURN_OFF":
        if (status === "success") {
          return {
            spokenText: "The SMART WATT bulb is now turned off.",
            uiText: "Living room bulb has successfully switched OFF.",
          };
        } else if (status === "pending") {
          return {
            spokenText: "Turning the bulb off. Waiting for device handshake...",
            uiText: "Sending command... Awaiting actual state handshake from physical device.",
          };
        } else {
          return {
            spokenText: context.errorMsg || "I couldn't turn the bulb off. Please check if it's plugged in.",
            uiText: `Command failed: ${context.errorMsg || "No response received from the ESP32 controller."}`,
          };
        }

      case "GET_BULB_STATUS": {
        const stateStr = context.actualState ? "ON" : "OFF";
        return {
          spokenText: `Your SMART WATT bulb is currently ${stateStr}.`,
          uiText: `Bulb physical state is confirmed ${stateStr}.`,
        };
      }

      case "GET_DEVICE_STATUS": {
        const statusStr = context.deviceOnline ? "active and online" : "currently offline";
        return {
          spokenText: `Your SMART WATT controller is ${statusStr}.`,
          uiText: `Controller node is ${context.deviceOnline ? "ONLINE" : "OFFLINE"}.`,
        };
      }

      case "GUIDE_SIGNIN":
        return {
          spokenText: "To sign in, locate the email and password fields on the main page, input your credentials, and click Sign In.",
          uiText: "Hardware control requires a verified session. Enter your credentials on the Home page to authenticate.",
        };

      case "HELP":
        return {
          spokenText: "I can control your SMART WATT bulb, report telemetry status, navigate pages, and answer questions about NoskyTech.",
          uiText: "Try saying:\n• 'Turn on the bulb'\n• 'Is the device online?'\n• 'What is SMART WATT?'\n• 'Open settings'",
        };

      case "CONVERSATION":
        return {
          spokenText: "Hello! I am Cypher, your SMART WATT voice layer. How can I assist you with your home automation today?",
          uiText: "Hello! I'm Cypher. Let me know if you need help controlling hardware or configuring settings.",
        };

      case "UNKNOWN_HARDWARE":
        return {
          spokenText: "That appliance is not supported in this version of SMART WATT.",
          uiText: "Unsupported Hardware: Only single-relay bulb control is currently available.",
        };

      default:
        if (context.customMessage) {
          return {
            spokenText: context.customMessage,
            uiText: context.customMessage,
          };
        }
        return {
          spokenText: "I didn't understand that command. Please try again.",
          uiText: "Command unrecognized. Please check suggestions inside the Cypher drawer.",
        };
    }
  },
};
