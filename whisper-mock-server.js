// A lightweight mock Whisper server for Earthlingo.
// Runs on port 8080 and returns transcripts.

Bun.serve({
  port: 8080,
  hostname: "127.0.0.1",
  async fetch(req) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response("OK", { headers });
    }

    const url = new URL(req.url);
    if (url.pathname === "/inference") {
      const targetWord = url.searchParams.get("word") || "sat";
      console.log(`[Mock Whisper] Inference request received. Mock transcribing to: "${targetWord}"`);
      return new Response(JSON.stringify({ text: targetWord }), {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response("Not Found", { status: 404, headers });
  },
});

console.log("🔊 Mock Whisper server running on http://127.0.0.1:8080");
