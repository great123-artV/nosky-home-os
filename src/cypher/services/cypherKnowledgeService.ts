import knowledgeData from "../knowledge/noskytech-cypher-v1.json";

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  aliases: string[];
  keywords: string[];
  shortAnswer: string;
  fullAnswer: string;
  spokenAnswer: string;
  source: string;
  lastReviewed: string;
  allowedBeforeLogin: boolean;
  relatedTopics: string[];
}

// Convert JSON knowledge into a highly-searchable rich schema
const structuredKnowledge: KnowledgeItem[] = [
  {
    id: "noskytech_about",
    category: "company",
    title: "About NoskyTech",
    aliases: ["what is noskytech", "tell me about noskytech", "who is noskytech", "explain noskytech", "who built you", "who made you", "who created you"],
    keywords: ["noskytech", "nosky tech", "who is nosky", "company", "creator", "origin", "developer"],
    shortAnswer: knowledgeData.company.description,
    fullAnswer: `${knowledgeData.company.description} Our mission is: ${knowledgeData.company.mission}. Vision: ${knowledgeData.company.vision}`,
    spokenAnswer: "NoskyTech is a smart automation and technology company.",
    source: "NoskyTech Metadata",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["products", "services"],
  },
  {
    id: "noskytech_mission",
    category: "company",
    title: "NoskyTech Mission and Vision",
    aliases: ["what is noskytech mission", "mission", "vision", "brand positioning"],
    keywords: ["mission", "vision", "goal", "brand", "purpose"],
    shortAnswer: knowledgeData.company.mission,
    fullAnswer: `Mission: ${knowledgeData.company.mission}\nVision: ${knowledgeData.company.vision}\nBrand Positioning: ${knowledgeData.company.brand_positioning}`,
    spokenAnswer: "Our mission is to build practical intelligent technologies while demonstrating the strength of African innovation.",
    source: "NoskyTech Core",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["about"],
  },
  {
    id: "smart_watt_about",
    category: "products",
    title: "About SMART WATT",
    aliases: ["what is smart watt", "tell me about smart watt", "explain smart watt", "what is smartwatt", "tell me about smartwatt", "explain smartwatt", "what does this device do"],
    keywords: ["smart watt", "smartwatt", "connected bulb", "platform", "controller", "watt"],
    shortAnswer: knowledgeData.products.smart_watt.description,
    fullAnswer: `${knowledgeData.products.smart_watt.description} Current version: ${knowledgeData.products.smart_watt.current_capability}`,
    spokenAnswer: "SMART WATT is NoskyTech's intelligent system for controlling and monitoring electrical devices.",
    source: "SMART WATT Spec",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["device_setup", "limitations"],
  },
  {
    id: "cypher_about",
    category: "products",
    title: "About Cypher",
    aliases: ["what is cypher", "tell me about cypher", "explain cypher", "who are you", "what is your name"],
    keywords: ["cypher", "voice assistant", "ai assistant", "who are you", "your name"],
    shortAnswer: knowledgeData.products.cypher.description,
    fullAnswer: `${knowledgeData.products.cypher.description} It uses ElevenLabs voice technology and supports push-to-talk and always-on listening modes.`,
    spokenAnswer: "I am Cypher, your premium NoskyTech voice assistant.",
    source: "Cypher Documentation",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["smart_watt", "listening_modes"],
  },
  {
    id: "safety_info",
    category: "safety",
    title: "Electrical Safety Information",
    aliases: ["is it safe", "safety information", "electrical safety", "wiring", "mains", "danger", "hazardous"],
    keywords: ["safety", "electrical", "danger", "hazard", "install", "wiring", "electricians"],
    shortAnswer: knowledgeData.safety.voice_response,
    fullAnswer: `${knowledgeData.safety.general_notice} Prohibited actions: ${knowledgeData.safety.prohibited_guidance.join(", ")}`,
    spokenAnswer: "For safety, mains electrical wiring should be installed and maintained by a qualified person.",
    source: "Safety Guidelines",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["installation"],
  },
  {
    id: "support_contact",
    category: "support",
    title: "NoskyTech Support and Contact",
    aliases: ["contact", "support", "help desk", "email", "support team", "get help"],
    keywords: ["contact", "support", "email", "website", "reach out", "help"],
    shortAnswer: `You can contact NoskyTech support at ${knowledgeData.support.email} or visit ${knowledgeData.support.website}.`,
    fullAnswer: `For assistance, contact NoskyTech at ${knowledgeData.support.email}, visit ${knowledgeData.support.website} or look up password recovery at ${knowledgeData.support.password_recovery_message}`,
    spokenAnswer: "You can contact NoskyTech at noskytech1@gmail.com, or visit noskytech.vercel.app.",
    source: "Contact Directory",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["about"],
  },
  {
    id: "pwa_help",
    category: "PWA",
    title: "PWA Application Setup",
    aliases: ["how to install app", "pwa help", "install app", "pwa setup", "add to home screen"],
    keywords: ["pwa", "progressive web app", "install", "app", "home screen", "ios", "android"],
    shortAnswer: "To install SMART WATT as a mobile app, open the browser options menu and tap 'Add to Home Screen'.",
    fullAnswer: "SMART WATT is built as a Progressive Web App (PWA). You can install it on any mobile device or desktop browser without an App Store. Look for the install badge or tap 'Add to Home Screen' in Safari/Chrome settings.",
    spokenAnswer: "To install SMART WATT as an app, select Add to Home Screen in your browser options.",
    source: "PWA Standard",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: true,
    relatedTopics: ["smart_watt"],
  },
  {
    id: "device_setup",
    category: "device_setup",
    title: "Physical SMART WATT Pairing & Setup",
    aliases: ["how to set up device", "device setup", "pair device", "connect bulb", "configure esp32"],
    keywords: ["pair", "connect", "esp32", "relay", "bind", "setup"],
    shortAnswer: "Device SW-0001 can be configured and paired with your account directly inside Settings after secure sign in.",
    fullAnswer: "Physical setup requires pairing an ESP32 microcontroller with your SMART WATT account. Enter your device credentials inside Settings. For detailed hardware layout diagrams, contact NoskyTech support.",
    spokenAnswer: "Your SMART WATT device is pre-paired with your account. You can view its state in Settings.",
    source: "Setup Manual",
    lastReviewed: "2026-07-17",
    allowedBeforeLogin: false, // Requires authentication!
    relatedTopics: ["smart_watt", "support_contact"],
  },
];

export const cypherKnowledgeService = {
  /**
   * Search knowledge base deterministically using keywords, semantic categories, and exact alias matching.
   */
  queryKnowledge(text: string, isAuthenticated: boolean): { item: KnowledgeItem | null; error?: string } {
    const raw = text.toLowerCase().trim();
    if (!raw) return { item: null };

    // 1. Direct exact or substring match in aliases
    for (const item of structuredKnowledge) {
      const matchFound = item.aliases.some(
        (alias) => raw.includes(alias) || alias.includes(raw)
      );

      if (matchFound) {
        if (!item.allowedBeforeLogin && !isAuthenticated) {
          return { item: null, error: "AuthRequired" };
        }
        return { item };
      }
    }

    // 2. Keyword score matching
    let bestItem: KnowledgeItem | null = null;
    let bestScore = 0;

    for (const item of structuredKnowledge) {
      let score = 0;
      for (const kw of item.keywords) {
        if (raw.includes(kw)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    if (bestScore >= 2 && bestItem) {
      if (!bestItem.allowedBeforeLogin && !isAuthenticated) {
        return { item: null, error: "AuthRequired" };
      }
      return { item: bestItem };
    }

    return { item: null };
  },

  getFallbackMessage(): string {
    return "I don't have verified information about that yet. I can help with SMART WATT, Cypher, NoskyTech, device control, setup, safety, installation, privacy, and support.";
  },

  getPreLoginControlAttemptMessage(): string {
    return knowledgeData.fallback_rules.pre_login_control_attempt;
  },

  getUnsupportedDeviceMessage(): string {
    return knowledgeData.fallback_rules.unsupported_device;
  },

  getOfflineDeviceMessage(): string {
    return knowledgeData.fallback_rules.offline_device;
  },

  getNoConfirmationMessage(): string {
    return knowledgeData.fallback_rules.no_confirmation;
  },
};
