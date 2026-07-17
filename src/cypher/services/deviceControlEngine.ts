import { supabase, type SmartWattDevice, supabaseConfigured } from "@/lib/supabase";

export type CommandLifecycleState =
  | "received"
  | "validated"
  | "pending"
  | "sent"
  | "awaiting_confirmation"
  | "confirmed"
  | "failed"
  | "timed_out"
  | "cancelled";

export interface DeviceControlEngineResult {
  success: boolean;
  state: CommandLifecycleState;
  error?: string;
  responseMessage: string;
}

export const deviceControlEngine = {
  /**
   * Dispatches command to toggle physical state and waits for real-time confirmation.
   * If simulationMode is active, it handles simulated timings and responses instead.
   */
  async executeBulbCommand(
    nextState: boolean,
    sessionContext: any, // Pass full sessionContext state
  ): Promise<DeviceControlEngineResult> {
    const isSim = sessionContext.simulationMode;

    // 1. Validation phase
    if (!sessionContext.isAuthenticated) {
      return {
        success: false,
        state: "failed",
        error: "Unauthenticated",
        responseMessage: "Please sign in before controlling the bulb.",
      };
    }

    const deviceId = sessionContext.deviceId;
    if (!deviceId && !isSim) {
      return {
        success: false,
        state: "failed",
        error: "NoDevicePaired",
        responseMessage: "No SMART WATT device is paired with this account yet.",
      };
    }

    if (!sessionContext.deviceOnline) {
      return {
        success: false,
        state: "failed",
        error: "DeviceOffline",
        responseMessage: `I'm signed in, but your SMART WATT device is currently offline, so I couldn't turn the bulb ${nextState ? "on" : "off"}.`,
      };
    }

    if (!sessionContext.networkOnline) {
      return {
        success: false,
        state: "failed",
        error: "NetworkOffline",
        responseMessage: "Your smartphone is currently offline. Please check your internet connection.",
      };
    }

    if (!isSim && !sessionContext.realtimeConnected) {
      // Polling backup if realtime disconnected but we still want to send command
      return {
        success: false,
        state: "failed",
        error: "RealtimeDisconnected",
        responseMessage: "I'm connected to your account, but live device confirmation is unavailable right now.",
      };
    }

    // 2. Sent & Awaiting Confirmation Phase
    try {
      const { success, error } = await sessionContext.sendDeviceCommand(nextState);

      if (!success) {
        return {
          success: false,
          state: "failed",
          error: error || "HandshakeError",
          responseMessage: `I sent the command, but the SMART WATT controller returned an error: ${error || "Unknown response"}.`,
        };
      }

      // Wait for device confirmation
      const start = Date.now();
      const timeoutMs = isSim ? sessionContext.simulationState.delayMs + 1000 : 12000;

      while (Date.now() - start < timeoutMs) {
        // Query current state directly from live context
        if (sessionContext.actualState === nextState) {
          return {
            success: true,
            state: "confirmed",
            responseMessage: `The bulb has been turned ${nextState ? "on" : "off"} successfully.`,
          };
        }

        // Wait a small interval before re-checking
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Check one last time
      if (sessionContext.actualState === nextState) {
        return {
          success: true,
          state: "confirmed",
          responseMessage: `The bulb has been turned ${nextState ? "on" : "off"} successfully.`,
        };
      }

      // If timeout reached
      return {
        success: false,
        state: "timed_out",
        error: "Timeout",
        responseMessage: "I sent the command, but SMART WATT did not confirm the change.",
      };
    } catch (e: any) {
      return {
        success: false,
        state: "failed",
        error: e.message || "ExecutionFailed",
        responseMessage: "A system error occurred while delivering the hardware instruction.",
      };
    }
  },
};
