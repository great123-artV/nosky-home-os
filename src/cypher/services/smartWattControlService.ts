import { supabase, type SmartWattDevice } from "@/lib/supabase";

const DEVICE_CODE = "SW-0001";
const CMD_CONFIRMATION_TIMEOUT_MS = 12000;

export const smartWattControlService = {
  /**
   * Retrieves the current device status.
   */
  async getDevice(): Promise<SmartWattDevice | null> {
    try {
      const { data, error } = await supabase
        .from("smart_watt_devices")
        .select("*")
        .eq("device_code", DEVICE_CODE)
        .maybeSingle();

      if (error || !data) return null;
      return data as SmartWattDevice;
    } catch {
      return null;
    }
  },

  /**
   * Triggers the target desired_state update in Supabase.
   */
  async setDesiredState(nextState: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("smart_watt_devices")
        .update({ desired_state: nextState })
        .eq("device_code", DEVICE_CODE);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Unknown error" };
    }
  },

  /**
   * Subscribes to realtime updates of the device and monitors until actual_state matches the requested nextState.
   * If not confirmed within timeout, resolves with false.
   */
  waitForDeviceConfirmation(nextState: boolean, onProgress?: () => void): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let isResolved = false;
      let timer: any = null;

      const finish = (result: boolean) => {
        if (isResolved) return;
        isResolved = true;
        if (timer) clearTimeout(timer);
        supabase.removeChannel(channel);
        resolve(result);
      };

      // Set timeout fallback
      timer = setTimeout(() => {
        finish(false);
      }, CMD_CONFIRMATION_TIMEOUT_MS);

      // Create a dedicated channel subscription
      const channel = supabase
        .channel(`cypher_ctrl_${Math.random().toString(36).substring(2, 9)}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "smart_watt_devices",
            filter: `device_code=eq.${DEVICE_CODE}`,
          },
          (payload) => {
            const next = payload.new as SmartWattDevice | undefined;
            if (next && next.device_code === DEVICE_CODE) {
              if (onProgress) onProgress();
              if (next.actual_state === nextState) {
                finish(true);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            // Polling backup if subscription fails
            const interval = setInterval(async () => {
              if (isResolved) {
                clearInterval(interval);
                return;
              }
              const dev = await this.getDevice();
              if (dev && dev.actual_state === nextState) {
                clearInterval(interval);
                finish(true);
              }
            }, 1500);
          }
        });
    });
  }
};
