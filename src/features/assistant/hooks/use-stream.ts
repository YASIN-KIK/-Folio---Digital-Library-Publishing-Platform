import { useCallback } from "react";
import { apiUrl } from "@/lib/base";
import { useAssistantChatStore } from "../store/chat-store";
import type { IslandBlock, IslandMessage, PlanItem } from "../types";

function parsePlanItems(text: string | undefined): PlanItem[] | null {
    if (!text) return null;
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed as PlanItem[];
        if (parsed && Array.isArray(parsed.items)) return parsed.items as PlanItem[];
    } catch {}
    return null;
}

function canonicalizeBlocks(blocks: IslandBlock[]): IslandBlock[] {
    let text = "";
    const rest: IslandBlock[] = [];
    const toolIdx = new Map<string, number>();
    for (const b of blocks) {
        if (b.kind === "text") {
            text += b.content;
            continue;
        }
        if (b.kind === "tool") {
            const prev = toolIdx.get(b.toolCallId);
            if (prev !== undefined) {
                if (b.resultText !== undefined || b.status !== "running") {
                    rest[prev] = b;
                }
                continue;
            }
            toolIdx.set(b.toolCallId, rest.length);
            rest.push(b);
            continue;
        }
        rest.push(b.kind === "reasoning" ? { ...b, streaming: false } : b);
    }
    if (text) rest.push({ kind: "text", content: text, streaming: false });
    return rest;
}

const PLAN_TOOL_NAMES = new Set(["todo-write", "todo_write", "TodoWrite"]);

const abortRef: { current: AbortController | null } = { current: null };

export interface SendArgs {
    chatId: string;
    assistantMessageId: string;
    messages: Array<{ role: string; content: string }>;
    threadId: string | null;
    runtimeConfig: Record<string, unknown> | null;
    mode: "plan" | "act";
    attachments?: Array<{
        id: string;
        name: string;
        mimeType: string;
        size: number;
        presignedUrl: string;
    }>;
}

export function useAssistantStream() {
    const setStreaming = useAssistantChatStore((s) => s.setStreaming);

    const send = useCallback(
        async ({
            chatId,
            assistantMessageId,
            messages,
            threadId,
            runtimeConfig,
            mode,
            attachments,
        }: SendArgs): Promise<string | null> => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setStreaming(chatId);

            const startedAt = Date.now();
            const toolStarts: Record<string, { startedAt: number; name: string }> = {};
            let resolvedThreadId: string | null = threadId;

            const apply = (mutator: (blocks: IslandBlock[]) => IslandBlock[]) => {
                useAssistantChatStore.getState().updateMessage(
                    chatId,
                    assistantMessageId,
                    (m: IslandMessage) => ({
                        ...m,
                        streaming: true,
                        blocks: mutator(m.blocks ?? []),
                    })
                );
            };

            try {
                const res = await fetch(apiUrl("api/assistant/chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages,
                        thread_id: threadId,
                        runtime_config: runtimeConfig,
                        mode,
                        ...(attachments?.length ? { attachments } : {}),
                    }),
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    let detail = `Request failed: ${res.status}`;
                    try {
                        const j = await res.json();
                        if (j?.detail) detail = j.detail;
                    } catch {}
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

                        let ev: Record<string, unknown>;
                        try {
                            ev = JSON.parse(payload);
                        } catch {
                            continue;
                        }

                        const type = ev.type as string;

                        if (type === "run_started" || type === "run_finished") {
                            if (ev.thread_id) resolvedThreadId = ev.thread_id as string;
                            continue;
                        }

                        if (type === "error") {
                            apply((blocks) => [
                                ...blocks.map((b) =>
                                    b.kind === "tool" && b.status === "running"
                                        ? {
                                              ...b,
                                              status: "error" as const,
                                              resultText: b.resultText ?? "Interrupted",
                                          }
                                        : b
                                ),
                                {
                                    kind: "error" as const,
                                    message: (ev.message as string) || "The agent run failed.",
                                },
                            ]);
                            continue;
                        }

                        if (type === "text" && ev.delta) {
                            apply((blocks) => {
                                const last = blocks[blocks.length - 1];
                                if (last && last.kind === "text" && last.streaming !== false) {
                                    return [
                                        ...blocks.slice(0, -1),
                                        { ...last, content: last.content + (ev.delta as string) },
                                    ];
                                }
                                return [
                                    ...blocks,
                                    { kind: "text" as const, content: ev.delta as string, streaming: true },
                                ];
                            });
                            continue;
                        }

                        if (type === "reasoning" && ev.delta) {
                            apply((blocks) => {
                                const last = blocks[blocks.length - 1];
                                if (last && last.kind === "reasoning" && last.streaming !== false) {
                                    return [
                                        ...blocks.slice(0, -1),
                                        { ...last, content: last.content + (ev.delta as string) },
                                    ];
                                }
                                return [
                                    ...blocks,
                                    { kind: "reasoning" as const, content: ev.delta as string, streaming: true },
                                ];
                            });
                            continue;
                        }

                        if (type === "file") {
                            const path = ev.path as string | undefined;
                            if (path) {
                                useAssistantChatStore.getState().updateMessage(
                                    chatId,
                                    assistantMessageId,
                                    (m: IslandMessage) => {
                                        const existing = m.generatedFiles ?? [];
                                        if (existing.some((f) => f.path === path)) return m;
                                        return {
                                            ...m,
                                            streaming: true,
                                            generatedFiles: [
                                                ...existing,
                                                {
                                                    path,
                                                    name:
                                                        (ev.name as string) ||
                                                        path.split("/").pop() ||
                                                        "file",
                                                    mimeType:
                                                        (ev.mime_type as string) ||
                                                        "application/octet-stream",
                                                    size:
                                                        typeof ev.size === "number"
                                                            ? (ev.size as number)
                                                            : undefined,
                                                },
                                            ],
                                        };
                                    }
                                );
                            }
                            continue;
                        }

                        if (type === "tool") {
                            const toolCallId = ev.tool_call_id as string;
                            const status = ev.status as string;

                            if (status === "running") {
                                if (ev.name) {
                                    toolStarts[toolCallId] = {
                                        startedAt: Date.now(),
                                        name: ev.name as string,
                                    };
                                    apply((blocks) => [
                                        ...blocks,
                                        {
                                            kind: "tool" as const,
                                            toolCallId,
                                            name: ev.name as string,
                                            status: "running" as const,
                                        },
                                    ]);
                                } else if (ev.args_delta) {
                                    apply((blocks) =>
                                        blocks.map((b) =>
                                            b.kind === "tool" && b.toolCallId === toolCallId
                                                ? {
                                                      ...b,
                                                      argsText:
                                                          (b.argsText ?? "") +
                                                          (ev.args_delta as string),
                                                  }
                                                : b
                                        )
                                    );
                                }
                                continue;
                            }

                            if (status === "done") {
                                const meta = toolStarts[toolCallId];
                                const elapsed = meta
                                    ? (Date.now() - meta.startedAt) / 1000
                                    : undefined;
                                const rawResult = ev.result;
                                const resultText =
                                    rawResult == null
                                        ? undefined
                                        : typeof rawResult === "string"
                                          ? rawResult
                                          : JSON.stringify(rawResult);

                                if (meta && PLAN_TOOL_NAMES.has(meta.name)) {
                                    const currentBlocks =
                                        useAssistantChatStore
                                            .getState()
                                            .chats[chatId]?.messages.find(
                                                (m) => m.id === assistantMessageId
                                            )?.blocks ?? [];
                                    const tb = currentBlocks.find(
                                        (b) => b.kind === "tool" && b.toolCallId === toolCallId
                                    );
                                    const argsText =
                                        tb?.kind === "tool" ? tb.argsText : undefined;
                                    const planItems =
                                        parsePlanItems(argsText) ??
                                        parsePlanItems(resultText);
                                    if (planItems) {
                                        apply((blocks) => {
                                            const updated = blocks.map((b) =>
                                                b.kind === "tool" && b.toolCallId === toolCallId
                                                    ? {
                                                          ...b,
                                                          status: "done" as const,
                                                          resultText,
                                                          durationSec: elapsed,
                                                      }
                                                    : b
                                            );
                                            const planBlock: IslandBlock = {
                                                kind: "plan",
                                                items: planItems,
                                            };
                                            const planIdx = updated.findIndex(
                                                (b) => b.kind === "plan"
                                            );
                                            if (planIdx !== -1) {
                                                updated[planIdx] = planBlock;
                                                return updated;
                                            }
                                            return [...updated, planBlock];
                                        });
                                        continue;
                                    }
                                }

                                apply((blocks) =>
                                    blocks.map((b) =>
                                        b.kind === "tool" && b.toolCallId === toolCallId
                                            ? {
                                                  ...b,
                                                  status: "done" as const,
                                                  resultText,
                                                  durationSec: elapsed,
                                              }
                                            : b
                                    )
                                );
                            }
                        }
                    }
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    const message =
                        err instanceof Error ? err.message : "stream failed";
                    apply((blocks) => [
                        ...blocks.map((b) =>
                            b.kind === "tool" && b.status === "running"
                                ? {
                                      ...b,
                                      status: "error" as const,
                                      resultText: b.resultText ?? "Interrupted",
                                  }
                                : b
                        ),
                        {
                            kind: "error" as const,
                            message: "Connection was lost.",
                            details: message,
                        },
                    ]);
                }
            } finally {
                const finalDuration = (Date.now() - startedAt) / 1000;
                useAssistantChatStore.getState().updateMessage(
                    chatId,
                    assistantMessageId,
                    (m: IslandMessage) => ({
                        ...m,
                        streaming: false,
                        blocks: canonicalizeBlocks(m.blocks ?? []).map((b) =>
                            b.kind === "reasoning"
                                ? {
                                      ...b,
                                      durationSec:
                                          b.durationSec ??
                                          Math.max(1, Math.round(finalDuration)),
                                  }
                                : b
                        ),
                    })
                );
                if (mode === "plan") {
                    useAssistantChatStore
                        .getState()
                        .setPlanUpdatedAt(chatId, new Date().toISOString());
                }
                setStreaming(null);
            }

            return resolvedThreadId;
        },
        [setStreaming]
    );

    const abort = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    return { send, abort };
}
