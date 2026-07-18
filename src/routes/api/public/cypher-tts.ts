// Secure ElevenLabs TTS proxy for Cypher.
// Runs on the TanStack Start server (Cloudflare Worker) so the API key never
// reaches the browser. Public route by convention — no auth required.
import { createFileRoute } from "@tanstack/react-router";

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — warm, natural
const MODEL_ID = "eleven_turbo_v2_5";

export const Route = createFileRoute("/api/public/cypher-tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "ElevenLabs is not configured on this server." }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          if (typeof body?.text === "string") text = body.text.trim();
        } catch {
          /* noop */
        }

        if (!text) {
          return new Response(JSON.stringify({ error: "Missing text." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        if (text.length > 1200) text = text.slice(0, 1200);

        try {
          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
            {
              method: "POST",
              headers: {
                "xi-api-key": apiKey,
                "content-type": "application/json",
                accept: "audio/mpeg",
              },
              body: JSON.stringify({
                text,
                model_id: MODEL_ID,
                voice_settings: {
                  stability: 0.55,
                  similarity_boost: 0.8,
                  style: 0.25,
                  use_speaker_boost: true,
                },
              }),
            },
          );

          if (!upstream.ok) {
            const detail = await upstream.text().catch(() => "");
            console.error("[cypher-tts] ElevenLabs error", upstream.status, detail);
            return new Response(
              JSON.stringify({ error: `ElevenLabs error ${upstream.status}` }),
              { status: 502, headers: { "content-type": "application/json" } },
            );
          }

          const audio = await upstream.arrayBuffer();
          return new Response(audio, {
            status: 200,
            headers: {
              "content-type": "audio/mpeg",
              "cache-control": "no-store",
            },
          });
        } catch (err) {
          console.error("[cypher-tts] fetch failed", err);
          return new Response(JSON.stringify({ error: "TTS request failed." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
