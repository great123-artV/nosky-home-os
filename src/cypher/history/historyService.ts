import { HistoryItem, CypherIntent } from "../types";

const HISTORY_KEY = "sw.cypher.history";

type HistoryListener = (history: HistoryItem[]) => void;
const listeners = new Set<HistoryListener>();

export const cypherHistoryService = {
  getHistory(): HistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("[CypherHistory] Failed to load history", e);
    }
    return [];
  },

  addHistoryItem(command: string, intent: CypherIntent, result: string, status: HistoryItem["status"]): HistoryItem[] {
    const current = this.getHistory();
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      command: command || "(Voice action)",
      intent,
      result,
      status,
    };

    // Store only up to 50 logs for performance and storage limits
    const updated = [newItem, ...current].slice(0, 50);

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("[CypherHistory] Failed to save history", e);
    }

    listeners.forEach((listener) => listener(updated));
    return updated;
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error("[CypherHistory] Failed to clear history", e);
    }
    listeners.forEach((listener) => listener([]));
  },

  subscribe(listener: HistoryListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
