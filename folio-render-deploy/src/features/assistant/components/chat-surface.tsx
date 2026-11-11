import * as React from "react";
import {
    ArrowUp,
    Bot,
    ClipboardList,
    Globe,
    Layers,
    Loader2,
    Paperclip,
    Server,
    Sparkles,
    Unplug,
    Wrench,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/base";
import type { AssistantConfig } from "@/lib/assistant";
import { useAssistantChatStore } from "../store/chat-store";
import { useAssistantComposerStore } from "../store/composer-store";
import { useCapabilities } from "../hooks/use-capabilities";
import { useAssistantStream } from "../hooks/use-stream";
import { AssistantMessage } from "./messages/assistant-message";
import { SelectorPopover, type SelectorRow } from "./selector-popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IslandMessage, AgentItem, ModelItem, ToolItem, ToolSetItem } from "../types";

const uid = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

const HIDDEN_TOOL_NAMES = new Set<string>([
    "execute-code",
    "write-file",
    "edit-file",
    "bash",
    "grep",
    "glob",
]);

function textFromBlocks(blocks: IslandMessage["blocks"]): string {
    return (blocks ?? [])
        .filter((b) => b.kind === "text")
        .map((b) => b.content)
        .join("\n");
}

function toApiMessages(
    messages: IslandMessage[]
): Array<{ role: string; content: string }> {
    return messages
        .filter(
            (m) =>
                m.role === "user" ||
                (m.blocks && m.blocks.some((b) => b.kind === "text"))
        )
        .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content:
                m.role === "user" ? (m.content ?? "") : textFromBlocks(m.blocks),
        }));
}

interface ChatSurfaceProps {
    config: AssistantConfig;
    className?: string;
}

export function ChatSurface({ config, className }: ChatSurfaceProps) {
    const { data: caps, isLoading: capsLoading } = useCapabilities();
    const composer = useAssistantComposerStore();
    const chatStore = useAssistantChatStore();
    const { send, abort } = useAssistantStream();
    const [input, setInput] = React.useState("");
    const [attachedFiles, setAttachedFiles] = React.useState<
        Array<{ id: string; name: string; mimeType: string; size: number; presignedUrl: string }>
    >([]);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const chatIdRef = React.useRef<string | null>(null);
    const threadIdRef = React.useRef<string | null>(null);

    // Depend on the stable action; depending on composer would rerun after applyDefaults changes the store.
    const applyDefaults = useAssistantComposerStore((s) => s.applyDefaults);
    const appliedDefaultsRef = React.useRef(false);
    React.useEffect(() => {
        if (caps?.defaults && !appliedDefaultsRef.current) {
            appliedDefaultsRef.current = true;
            applyDefaults(caps.defaults);
        }
    }, [caps?.defaults, applyDefaults]);

    React.useEffect(() => {
        const aid = chatStore.activeChatId;
        if (aid && chatStore.chats[aid]) {
            chatIdRef.current = aid;
            threadIdRef.current = chatStore.chats[aid].threadId;
        } else {
            chatIdRef.current = null;
            threadIdRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatStore.activeChatId]);

    const activeChat = chatStore.activeChatId
        ? chatStore.chats[chatStore.activeChatId]
        : null;
    const messages = activeChat?.messages ?? [];

    React.useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, chatStore.streamingChatId]);

    const isStreaming =
        chatStore.streamingChatId != null &&
        chatStore.streamingChatId === chatIdRef.current;

    function buildRuntimeConfig(): Record<string, unknown> | null {
        const rc: Record<string, unknown> = {};
        if (composer.selectedToolNames.length)
            rc.tool_names = composer.selectedToolNames;
        if (composer.selectedSkillSlugs.length)
            rc.skill_slugs = composer.selectedSkillSlugs;
        if (composer.selectedConnectionIds.length)
            rc.connection_ids = composer.selectedConnectionIds;
        if (composer.selectedMcpConnectionIds.length)
            rc.mcp_connection_ids = composer.selectedMcpConnectionIds;
        if (composer.selectedModelSlug)
            rc.model_slug = composer.selectedModelSlug;
        if (composer.selectedAgentId != null)
            rc._agent_id_override = composer.selectedAgentId;
        if (composer.selectedPromptIds.length)
            rc.prompt_ids = composer.selectedPromptIds;
        return Object.keys(rc).length ? rc : null;
    }

    const handleSend = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;
        setInput("");

        const chatId = chatIdRef.current ?? uid();
        chatIdRef.current = chatId;
        const threadId = threadIdRef.current ?? uid();
        threadIdRef.current = threadId;

        const userMsg: IslandMessage = {
            id: uid(),
            role: "user",
            content: trimmed,
            files: attachedFiles.length ? [...attachedFiles] : undefined,
        };
        setAttachedFiles([]);

        const asstId = uid();
        const asstMsg: IslandMessage = {
            id: asstId,
            role: "assistant",
            blocks: [],
            streaming: true,
            planMode: composer.planning,
        };

        if (!chatStore.chats[chatId]) {
            chatStore.createChat(chatId, threadId, userMsg);
            chatStore.appendMessage(chatId, asstMsg);
        } else {
            chatStore.appendMessage(chatId, userMsg);
            chatStore.appendMessage(chatId, asstMsg);
        }

        const history = toApiMessages([...messages, userMsg]);
        await send({
            chatId,
            assistantMessageId: asstId,
            messages: history,
            threadId,
            runtimeConfig: buildRuntimeConfig(),
            mode: composer.planning ? "plan" : "act",
            attachments: userMsg.files,
        });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend(input);
        }
    };

    React.useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [input]);

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const form = new FormData();
                form.append("file", file);
                const res = await fetch(apiUrl("api/assistant/files"), {
                    method: "POST",
                    body: form,
                });
                if (!res.ok) continue;
                const meta = await res.json();
                setAttachedFiles((prev) => [
                    ...prev,
                    {
                        id: meta.id,
                        name: meta.name,
                        mimeType: meta.mimeType ?? meta.mime_type ?? "application/octet-stream",
                        size: meta.size ?? 0,
                        presignedUrl: meta.presignedUrl ?? meta.presigned_url ?? "",
                    },
                ]);
            }
        } finally {
            setUploading(false);
        }
    };

    const empty = messages.length === 0;

    const agentRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.agents ?? []).map((a: AgentItem) => ({
                key: a.id,
                name: a.name,
                description: a.description,
                icon: <Bot className="h-3.5 w-3.5" />,
            })),
        [caps?.agents]
    );

    const modelRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.models ?? []).map((m: ModelItem) => ({
                key: m.slug ?? String(m.id),
                name: m.name,
                icon: <Sparkles className="h-3.5 w-3.5" />,
            })),
        [caps?.models]
    );

    const toolRows: SelectorRow[] = React.useMemo(() => {
        const grouped: SelectorRow[] = (caps?.tool_sets ?? []).map((ts: ToolSetItem) => ({
            key: `set:${ts.name}`,
            name: ts.label,
            description: ts.description,
            icon: <Layers className="h-3.5 w-3.5" />,
            children: (ts.tool_names ?? [])
                .filter((tn) => !HIDDEN_TOOL_NAMES.has(tn))
                .map((tn) => {
                    const t = (caps?.tools ?? []).find((x: ToolItem) => x.name === tn);
                    return {
                        key: tn,
                        name: t?.display_name ?? tn,
                        description: t?.description,
                        icon: <Wrench className="h-3.5 w-3.5" />,
                    };
                }),
        }));
        const grouped_names = new Set(
            (caps?.tool_sets ?? []).flatMap((ts: ToolSetItem) => ts.tool_names)
        );
        const standalone = (caps?.tools ?? [])
            .filter((t: ToolItem) => !grouped_names.has(t.name) && !HIDDEN_TOOL_NAMES.has(t.name))
            .map((t: ToolItem) => ({
                key: t.name,
                name: t.display_name,
                description: t.description,
                icon: <Wrench className="h-3.5 w-3.5" />,
            }));
        return [...grouped, ...standalone];
    }, [caps?.tools, caps?.tool_sets]);

    const skillRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.skills ?? []).map((s) => ({
                key: s.slug,
                name: s.name,
                description: s.description,
                icon: <Layers className="h-3.5 w-3.5" />,
            })),
        [caps?.skills]
    );

    const connRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.connections ?? []).map((c) => ({
                key: c.id,
                name: c.name,
                icon: <Unplug className="h-3.5 w-3.5" />,
            })),
        [caps?.connections]
    );

    const mcpRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.mcp_connections ?? []).map((c) => ({
                key: c.id,
                name: c.name,
                icon: <Server className="h-3.5 w-3.5" />,
            })),
        [caps?.mcp_connections]
    );

    const promptRows: SelectorRow[] = React.useMemo(
        () =>
            (caps?.prompts ?? []).map((p) => ({
                key: p.id,
                name: p.name,
                description: p.description,
                icon: <ClipboardList className="h-3.5 w-3.5" />,
            })),
        [caps?.prompts]
    );

    return (
        <div className={cn("flex h-full min-h-0 flex-col", className)}>
            <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                {empty ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#6798ff]/15 text-[#6798ff]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <p className="max-w-[28ch] text-sm text-muted-foreground">
                            {config.greeting || "Ask me anything about this app."}
                        </p>
                        {config.starters?.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {config.starters.slice(0, 4).map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => void handleSend(s)}
                                        className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex min-w-0 flex-col gap-6">
                        {messages.map((m) =>
                            m.role === "user" ? (
                                <div key={m.id} className="flex flex-col gap-1">
                                    {m.files?.length ? (
                                        <div className="flex flex-wrap justify-end gap-1 mb-0.5">
                                            {m.files.map((f) => (
                                                <span
                                                    key={f.id}
                                                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                                                >
                                                    <Paperclip className="h-2.5 w-2.5" />
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="flex justify-end">
                                        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#6798ff]/12 px-3 py-2 text-sm">
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={m.id} className="flex justify-start">
                                    <div className="max-w-[92%] min-w-0 w-full">
                                        <AssistantMessage
                                            message={m}
                                            threadId={activeChat?.threadId}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <div className="shrink-0 border-t border-border/40 px-3 py-2">
                {attachedFiles.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                        {attachedFiles.map((f) => (
                            <span
                                key={f.id}
                                className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                                <Paperclip className="h-2.5 w-2.5" />
                                {f.name}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAttachedFiles((prev) =>
                                            prev.filter((x) => x.id !== f.id)
                                        )
                                    }
                                    className="ml-0.5 hover:text-foreground"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-1.5 rounded-xl border border-border/60 bg-background px-2 py-1.5 focus-within:border-[#6798ff]/60">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={1}
                        placeholder={composer.planning ? "Describe a plan…" : "Send a message…"}
                        disabled={isStreaming}
                        className="min-h-0 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                        style={{ maxHeight: "160px", overflowY: "auto" }}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileAttach}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming || uploading}
                        title="Attach file"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Paperclip className="h-4 w-4" />
                        )}
                    </button>
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={abort}
                            title="Stop"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void handleSend(input)}
                            disabled={!input.trim()}
                            title="Send"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-background transition-colors hover:opacity-90 disabled:opacity-40"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Tooltip delayDuration={250}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => composer.setPlanning(!composer.planning)}
                                className={cn(
                                    "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors",
                                    composer.planning
                                        ? "border-primary/40 bg-primary/10 text-foreground"
                                        : "border-border/60 text-muted-foreground hover:border-border hover:bg-foreground/[0.04] hover:text-foreground"
                                )}
                            >
                                <ClipboardList className="h-3.5 w-3.5" />
                                {composer.planning ? "Plan" : "Act"}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {composer.planning
                                ? "Plan mode — review before acting. Click for Act."
                                : "Act mode — runs tools directly. Click for Plan."}
                        </TooltipContent>
                    </Tooltip>

                    {agentRows.length > 0 && (
                        <SelectorPopover
                            label="Agent"
                            icon={<Bot className="h-3.5 w-3.5" />}
                            rows={agentRows}
                            isLoading={capsLoading}
                            selectedKeys={
                                composer.selectedAgentId != null
                                    ? [composer.selectedAgentId]
                                    : []
                            }
                            onToggle={(key) => {
                                const id = Number(key);
                                composer.setAgent(
                                    composer.selectedAgentId === id ? null : id
                                );
                            }}
                            single
                            onPickSingle={(key) => composer.setAgent(Number(key))}
                            emptyHint="No agents found."
                            side="top"
                            align="start"
                        />
                    )}

                    {modelRows.length > 0 && (
                        <SelectorPopover
                            label="Model"
                            icon={<Sparkles className="h-3.5 w-3.5" />}
                            rows={modelRows}
                            isLoading={capsLoading}
                            selectedKeys={
                                composer.selectedModelSlug ? [composer.selectedModelSlug] : []
                            }
                            onToggle={(key) => {
                                const slug = String(key);
                                composer.setModelSlug(
                                    composer.selectedModelSlug === slug ? null : slug
                                );
                            }}
                            single
                            onPickSingle={(key) => composer.setModelSlug(String(key))}
                            emptyHint="No models found."
                            side="top"
                            align="start"
                        />
                    )}

                    {toolRows.length > 0 && (
                        <SelectorPopover
                            label="Tools"
                            icon={<Wrench className="h-3.5 w-3.5" />}
                            rows={toolRows}
                            isLoading={capsLoading}
                            selectedKeys={composer.selectedToolNames}
                            onToggle={(key) => {
                                const k = String(key);
                                if (k.startsWith("set:")) return;
                                composer.toggleTool(k);
                            }}
                            onToggleAll={(keys, on) =>
                                composer.setToolsBulk(keys.map(String), on)
                            }
                            emptyHint="No tools found."
                            side="top"
                            align="start"
                        />
                    )}

                    {skillRows.length > 0 && (
                        <SelectorPopover
                            label="Skills"
                            icon={<Layers className="h-3.5 w-3.5" />}
                            rows={skillRows}
                            isLoading={capsLoading}
                            selectedKeys={composer.selectedSkillSlugs}
                            onToggle={(key) => composer.toggleSkill(String(key))}
                            emptyHint="No skills found."
                            side="top"
                            align="start"
                        />
                    )}

                    {connRows.length > 0 && (
                        <SelectorPopover
                            label="Connections"
                            icon={<Unplug className="h-3.5 w-3.5" />}
                            rows={connRows}
                            isLoading={capsLoading}
                            selectedKeys={composer.selectedConnectionIds}
                            onToggle={(key) => composer.toggleConnection(Number(key))}
                            emptyHint="No connections found."
                            side="top"
                            align="start"
                        />
                    )}

                    {mcpRows.length > 0 && (
                        <SelectorPopover
                            label="MCP"
                            icon={<Server className="h-3.5 w-3.5" />}
                            rows={mcpRows}
                            isLoading={capsLoading}
                            selectedKeys={composer.selectedMcpConnectionIds}
                            onToggle={(key) => composer.toggleMcpConnection(Number(key))}
                            emptyHint="No MCP connections found."
                            side="top"
                            align="start"
                        />
                    )}

                    {promptRows.length > 0 && (
                        <SelectorPopover
                            label="Prompts"
                            icon={<Globe className="h-3.5 w-3.5" />}
                            rows={promptRows}
                            isLoading={capsLoading}
                            selectedKeys={composer.selectedPromptIds}
                            onToggle={(key) => composer.togglePrompt(Number(key))}
                            emptyHint="No prompts found."
                            side="top"
                            align="start"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
