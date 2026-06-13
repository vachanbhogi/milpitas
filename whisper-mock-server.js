// A lightweight mock Whisper server for Earthlingo.
// Runs on port 8080 and returns a random word from a pool.
// The server has no knowledge of the "correct" answer — just like a real
// Whisper model, it transcribes audio independently.

const WORD_POOL = [
  "sun", "moon", "star", "cat", "dog", "hat", "apple",
  "ball", "fish", "frog", "tree", "book", "ship", "cup",
];

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
      const transcript = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];

      console.log(`[Mock Whisper] returning: "${transcript}"`);
      return new Response(JSON.stringify({ text: transcript }), {
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
