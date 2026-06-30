// AMA's brain connection — talks to the LOCAL Ollama server (localhost:11434).
// Nothing here calls the cloud; all inference is on-device.
//
// This is the direct-to-Ollama path for the first working conversation. Later
// phases route through Hermes (sub-agents, permissions, memory) instead.

export const OLLAMA_URL = "http://localhost:11434";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Tells AMA who it is and — truthfully — what it's running, so "what model are
// you?" gets a correct answer. `model` is injected live from the server.
export function systemPrompt(model: string): string {
  return [
    "You are AMA, a personal assistant that runs entirely on the user's own machine.",
    `Your brain is the "${model}" model, served locally by Ollama on an Apple M4 Mac Mini (24GB). Nothing you process is sent to the cloud — you are private and work offline.`,
    "Keep replies concise, warm, and natural to hear spoken aloud (a few sentences unless asked for more).",
    "If asked what model, brain, or hardware you're running, answer truthfully: " +
      `the ${model} model via Ollama, locally on the Mac.`,
  ].join(" ");
}

/** List models the local Ollama server actually has. Empty array if unreachable. */
export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

/** True if the local Ollama server is reachable. */
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Stream a chat completion from Ollama. Calls onToken for each chunk and
 * resolves with the full text. Throws if the server is unreachable.
 */
export async function chat(
  model: string,
  messages: ChatMessage[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Ollama returned ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Ollama streams newline-delimited JSON objects.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed) as {
          message?: { content?: string };
          done?: boolean;
        };
        const piece = obj.message?.content;
        if (piece) {
          full += piece;
          onToken(piece);
        }
      } catch {
        // ignore partial/non-JSON lines
      }
    }
  }
  return full;
}
