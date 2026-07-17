import { CypherIntent } from "../types";

export interface NavigationMatchResult {
  success: boolean;
  targetPath: string | null;
  modalTrigger?: string;
  speechMessage: string;
}

const APPROVED_ROUTES = {
  HOME: "/",
  DASHBOARD: "/",
  SETTINGS: "/settings",
  DEVICES: "/", // Devices card is embedded in home dashboard
  ACTIVITY: "/", // Activity timeline is embedded in home dashboard
  CYPHER: "/", // Cypher control drawer triggers globally
  PROFILE: "/settings", // Profile details inside settings
  PRIVACY: "privacy", // Modal trigger
  TERMS: "terms", // Modal trigger
  HELP: "safety", // Modal trigger
};

export const navigationEngine = {
  /**
   * Evaluates navigation intent and performs path routing or opens modals.
   */
  resolveNavigation(intent: CypherIntent, router: any): NavigationMatchResult {
    switch (intent) {
      case "GO_DASHBOARD":
        try {
          router.navigate({ to: "/" });
        } catch {
          window.location.assign("/");
        }
        return {
          success: true,
          targetPath: "/",
          speechMessage: "Navigating to your SMART WATT Dashboard.",
        };

      case "OPEN_SETTINGS":
        try {
          router.navigate({ to: "/settings" });
        } catch {
          window.location.assign("/settings");
        }
        return {
          success: true,
          targetPath: "/settings",
          speechMessage: "Opening settings page.",
        };

      case "OPEN_PRIVACY": {
        const trigger = document.querySelector('[data-legal-trigger="privacy"]') as HTMLButtonElement | null;
        if (trigger) trigger.click();
        return {
          success: true,
          targetPath: null,
          modalTrigger: "privacy",
          speechMessage: "Displaying privacy policy details.",
        };
      }

      case "OPEN_TERMS": {
        const trigger = document.querySelector('[data-legal-trigger="terms"]') as HTMLButtonElement | null;
        if (trigger) trigger.click();
        return {
          success: true,
          targetPath: null,
          modalTrigger: "terms",
          speechMessage: "Displaying terms of use details.",
        };
      }

      case "SAFETY_INFO": {
        const trigger = document.querySelector('[data-legal-trigger="safety"]') as HTMLButtonElement | null;
        if (trigger) trigger.click();
        return {
          success: true,
          targetPath: null,
          modalTrigger: "safety",
          speechMessage: "Displaying physical electrical safety guidance.",
        };
      }

      default:
        return {
          success: false,
          targetPath: null,
          speechMessage: "I couldn't find that section in this version of SMART WATT.",
        };
    }
  },
};
