import { NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM = `You are Ritual Assistant — an expert guide for Ritual Chain, the first blockchain where smart contracts can think, see, hear, and act.

Answer questions using the provided context from Ritual documentation. Be precise with:
- Precompile addresses (e.g. 0x0801 for HTTP, 0x0802 for LLM)
- Exact Solidity types and ABI field names
- The 7 properties of autonomous agents

If the user asks about use cases, respond with the relevant "Use Cases — What Becomes Possible" section from the provided docs, including its headings and bullet text. Do not invent extra use cases or add unrelated content.

If context doesn't cover the question, say: "That's not in my current docs. Check docs.ritual.net for the latest."

Keep answers focused, technical, and accurate. Mention which doc section info comes from.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://ritual-assistant.vercel.app",
          "X-Title": "Ritual Assistant",
        },
        body: JSON.stringify({
          model: process.env.CHAT_MODEL || "anthropic/claude-haiku-4-5",
          messages: [{ role: "system", content: SYSTEM }, ...messages],
          stream: true,
          temperature: 0.2,
          max_tokens: 1200,
        }),
      },
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json({ error: err }, { status: upstream.status });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
