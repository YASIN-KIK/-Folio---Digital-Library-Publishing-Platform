import { apiUrl } from "./base";

export interface AssistantConfig {
  enabled: boolean;
  title: string;
  placement: "widget" | "page" | "both";
  greeting: string;
  starters: string[];
}

export async function fetchAssistantConfig(): Promise<AssistantConfig> {
  const res = await fetch(apiUrl("api/assistant"), { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/assistant failed: ${res.status}`);
  return res.json();
}

export interface AssistantEvent {
  type: "text" | "reasoning" | "tool" | "run_started" | "run_finished" | "error";
  delta?: string;
  message?: string;
  status?: "running" | "done";
  name?: string;
  tool_call_id?: string;
  args_delta?: string;
  result?: unknown;
  thread_id?: string;
  run_id?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamAssistant(
  messages: ChatMessage[],
  threadId: string | null,
  onEvent: (ev: AssistantEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(apiUrl("api/assistant/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, thread_id: threadId }),
    signal,
  });
  if (!res.ok || !res.body) {
    let detail = `/api/assistant/chat failed: ${res.status}`;
    try {
      const j = await res.json();
      if (j?.detail) detail = j.detail;
    } catch {
    }
    throw new Error(detail);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const raw of parts) {
      const line = raw.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as AssistantEvent);
      } catch {
      }
    }
  }
}
