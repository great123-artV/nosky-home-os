import { createContext, useContext, useEffect, useState, useRef } from "react";

export interface PWAContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isSafari: boolean;
  hasUpdate: boolean;
  updateNow: () => Promise<void>;
  dismissUpdate: () => void;
  triggerInstall: () => Promise<boolean>;
  isUpdating: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

// Define type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // 1. Standalone detection
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 2. Platform/Browser detection
    const checkPlatform = () => {
      const ua = navigator.userAgent;
      const isAppleMobile = /iPhone|iPad|iPod/.test(ua);
      const isChrome = /Chrome|CriOS/.test(ua);
      const isSafariBrowser = /Safari/.test(ua) && !isChrome;

      setIsIOS(isAppleMobile);
      setIsSafari(isSafariBrowser);
    };
    checkPlatform();

    // 3. Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    // 4. Handle appinstalled
    const handleAppInstalled = () => {
      console.log("[SMART WATT PWA] App installed successfully");
      setIsInstallable(false);
      setIsStandalone(true);
      deferredPromptRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Register Service Worker in production
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swRegistrationRef.current = reg;
          console.log("[SMART WATT PWA] Service Worker registered:", reg.scope);

          // Handle updates
          const onNewServiceWorker = () => {
            console.log("[SMART WATT PWA] New Service Worker waiting (update available)");
            setHasUpdate(true);
          };

          if (reg.waiting) {
            onNewServiceWorker();
          }

          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  onNewServiceWorker();
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("[SMART WATT PWA] Service Worker registration failed:", err);
        });

      // Handle controller change (service worker activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          console.log("[SMART WATT PWA] Controller changed, reloading safely...");
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) {
      console.warn("[SMART WATT PWA] Installation prompt not available");
      return false;
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log(`[SMART WATT PWA] User prompt choice: ${choiceResult.outcome}`);
      deferredPromptRef.current = null;
      setIsInstallable(false);
      return choiceResult.outcome === "accepted";
    } catch (err) {
      console.error("[SMART WATT PWA] Error triggering native installation prompt:", err);
      return false;
    }
  };

  const updateNow = async () => {
    const reg = swRegistrationRef.current;
    if (!reg || !reg.waiting) {
      console.warn("[SMART WATT PWA] No waiting service worker found for update");
      return;
    }

    setIsUpdating(true);

    // Skip waiting command to let the service worker take over immediately
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isIOS,
        isSafari,
        hasUpdate,
        updateNow,
        dismissUpdate,
        triggerInstall,
        isUpdating,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
