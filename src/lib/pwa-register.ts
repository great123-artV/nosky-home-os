/**
 * Production-safe service worker registration wrapper.
 * Refuses to register in dev, iframes, Lovable preview hosts, or with ?sw=off.
 * In refused contexts, actively unregisters any pre-existing /sw.js registration.
 */
const SW_PATH = "/sw.js";

function isBlockedHost(host: string) {
  if (!host) return false;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter(
          (r) =>
            r.active?.scriptURL?.endsWith(SW_PATH) ||
            r.installing?.scriptURL?.endsWith(SW_PATH) ||
            r.waiting?.scriptURL?.endsWith(SW_PATH),
        )
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const killSwitch = url.searchParams.get("sw") === "off";
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const isDev = !import.meta.env.PROD;

  if (killSwitch || inIframe || isDev || isBlockedHost(host)) {
    void unregisterExisting();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .catch((err) => console.warn("[pwa] SW registration failed", err));
  });
}
