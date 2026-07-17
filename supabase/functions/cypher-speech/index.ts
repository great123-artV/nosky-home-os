// Supabase Edge Function: cypher-speech
// Securely proxies text-to-speech generation requests to ElevenLabs.
// Strictly validates incoming payload schema and credentials before querying.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Approved stable premium voice IDs
const APPROVED_VOICES = [
  "21m00Tcm4TlvDq8ikWAM", // Rachel (Female, premium)
  "AZnzlk1XhkunfNOf1fkM", // Nicole (Female, natural)
  "EXAVITQu4vr4xnSDxMaL", // Bella
  "ErXwobaYiN019PkySvjV", // Antoni (Male, calm)
];

const APPROVED_RESPONSE_TYPES = [
  "command_confirmation",
  "knowledge",
  "error",
  "greeting"
];

serve(async (req) => {
  // Handle CORS Preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key is not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Parse and validate input schema
    const body = await req.json();
    const { text, voiceId, requestId, responseType } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' input parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 500) {
      return new Response(
        JSON.stringify({ error: "Text exceeds maximum allowed length of 500 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize optional voiceId, fallback to premium Rachel
    let targetVoiceId = "21m00Tcm4TlvDq8ikWAM";
    if (voiceId && APPROVED_VOICES.includes(voiceId)) {
      targetVoiceId = voiceId;
    }

    // Strictly enforce default ElevenLabs model parameters (client cannot supply raw overrides)
    const modelId = "eleven_monolingual_v1";
    const voiceSettings = {
      stability: 0.75,
      similarity_boost: 0.75,
    };

    console.log(`[CypherSpeech] Request ${requestId || "none"}: Synthesizing type "${responseType || "unknown"}" with voice ID ${targetVoiceId}`);

    // Call ElevenLabs TTS endpoint securely
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API returned error ${response.status}: ${errText}`);
    }

    // Convert raw audio array buffer to base64 stream string
    const audioBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({ audio: base64Audio }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[CypherSpeechFunction] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process speech generation." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
