import knowledgeData from "../knowledge/noskytech-cypher-v1.json";

export const cypherKnowledgeService = {
  /**
   * Evaluates the text input and returns the pre-approved answer, or null if no match found.
   */
  getAnswer(text: string): string | null {
    const raw = text.toLowerCase().trim();
    if (!raw) return null;

    // Direct exact / substring match on approved questions
    for (const item of knowledgeData.approved_answers) {
      for (const question of item.questions) {
        const qNormalized = question.toLowerCase().trim();
        if (raw.includes(qNormalized) || qNormalized.includes(raw)) {
          return item.answer;
        }
      }
    }

    // Contextual fallback checks matching key concepts
    if (this.matchesCompany(raw)) {
      return knowledgeData.company.description;
    }
    if (this.matchesSmartWatt(raw)) {
      return knowledgeData.products.smart_watt.description;
    }
    if (this.matchesCypher(raw)) {
      return knowledgeData.products.cypher.description;
    }

    return null;
  },

  matchesCompany(raw: string): boolean {
    return (
      raw.includes("noskytech") ||
      raw.includes("nosky tech") ||
      raw.includes("who is nosky") ||
      raw.includes("company")
    );
  },

  matchesSmartWatt(raw: string): boolean {
    return (
      raw.includes("smart watt") ||
      raw.includes("smartwatt") ||
      raw.includes("watt") ||
      raw.includes("connected bulb")
    );
  },

  matchesCypher(raw: string): boolean {
    return (
      raw.includes("cypher") ||
      raw.includes("assistant") ||
      raw.includes("who are you") ||
      raw.includes("what is your name")
    );
  },

  getFallbackMessage(): string {
    return knowledgeData.fallback_rules.unknown_company_question;
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
