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

    // Map long error messages to concise, natural spoken phrases
    const getConciseSpokenError = (msg?: string | null) => {
      if (!msg) return "I couldn't reach your SMART WATT device.";
      const lower = msg.toLowerCase();
      if (lower.includes("sign in") || lower.includes("login") || lower.includes("authenticate")) {
        return "Please sign in.";
      }
      if (lower.includes("offline") || lower.includes("internet") || lower.includes("connection")) {
        return "Your device is offline.";
      }
      return "I couldn't reach your SMART WATT device.";
    };

    // Default template mappings
    switch (intent) {
      case "TURN_ON":
        if (status === "success") {
          return {
            spokenText: "The bulb is now on.",
            uiText: "Living room bulb has successfully switched ON.",
          };
        } else if (status === "pending") {
          return {
            spokenText: "Toggling device.",
            uiText: "Sending command... Awaiting actual state handshake from physical device.",
          };
        } else {
          return {
            spokenText: getConciseSpokenError(context.errorMsg),
            uiText: `Command failed: ${context.errorMsg || "No response received from the ESP32 controller."}`,
          };
        }

      case "TURN_OFF":
        if (status === "success") {
          return {
            spokenText: "The bulb is now off.",
            uiText: "Living room bulb has successfully switched OFF.",
          };
        } else if (status === "pending") {
          return {
            spokenText: "Toggling device.",
            uiText: "Sending command... Awaiting actual state handshake from physical device.",
          };
        } else {
          return {
            spokenText: getConciseSpokenError(context.errorMsg),
            uiText: `Command failed: ${context.errorMsg || "No response received from the ESP32 controller."}`,
          };
        }

      case "GET_BULB_STATUS": {
        const stateStr = context.actualState ? "on" : "off";
        return {
          spokenText: `The bulb is ${stateStr}.`,
          uiText: `Bulb physical state is confirmed ${stateStr.toUpperCase()}.`,
        };
      }

      case "GET_DEVICE_STATUS": {
        const statusStr = context.deviceOnline ? "Your device is online." : "Your device is offline.";
        return {
          spokenText: statusStr,
          uiText: `Controller node is ${context.deviceOnline ? "ONLINE" : "OFFLINE"}.`,
        };
      }

      case "GUIDE_SIGNIN":
        return {
          spokenText: "Please sign in.",
          uiText: "Hardware control requires a verified session. Enter your credentials on the Home page to authenticate.",
        };

      case "HELP":
        return {
          spokenText: "I can control your bulb, show status, or answer questions.",
          uiText: "Try saying:\n• 'Turn on the bulb'\n• 'Is the device online?'\n• 'What is SMART WATT?'\n• 'Open settings'",
        };

      case "CONVERSATION":
        return {
          spokenText: "Welcome back. Your SMART WATT system is ready.",
          uiText: "Welcome back! I'm Cypher, your SMART WATT operating voice assistant. Ready for your instructions.",
        };

      case "UNKNOWN_HARDWARE":
        return {
          spokenText: "That device is not available in this version of SMART WATT.",
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
          spokenText: "I didn't hear anything.",
          uiText: "Command unrecognized. Please check suggestions inside the Cypher drawer.",
        };
    }
  },
};
