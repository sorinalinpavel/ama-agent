// Bridge to the Hermes agent, exposed by the Electron preload as window.ama.
// When present, AMA's brain runs through Hermes (agent + tools) instead of the
// direct-to-Ollama path.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = typeof window !== "undefined" ? (window as any).ama : undefined;

export const hasHermes = !!api?.hermesChat;

export function hermesChat(prompt: string, onToken: (chunk: string) => void): Promise<string> {
  return api.hermesChat(prompt, onToken);
}
