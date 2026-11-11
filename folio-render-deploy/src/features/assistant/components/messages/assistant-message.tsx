import * as React from "react";
import { BrainIcon, Check, Copy, Download, FileText } from "lucide-react";
import { getToolIcon, getToolDisplayName } from "../tool-icons";
import type { IslandBlock, IslandGeneratedFile, IslandMessage } from "../../types";
import { PlanBlock } from "../blocks/plan-block";
import { ReasoningBlock } from "../blocks/reasoning-block";
import { ToolBlock } from "../blocks/tool-block";
import { TextBlock } from "../blocks/text-block";
import { ErrorBlock } from "../blocks/error-block";
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
} from "@/components/ai-elements/chain-of-thought";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/base";

type CotBlock = Extract<IslandBlock, { kind: "reasoning" | "tool" }>;
type RenderItem =
    | { kind: "cot"; items: CotBlock[]; streaming: boolean }
    | { kind: "block"; block: IslandBlock };

function groupCotBlocks(blocks: IslandBlock[], messageStreaming: boolean): RenderItem[] {
    const out: RenderItem[] = [];
    let buffer: CotBlock[] = [];
    const flush = (atEnd: boolean) => {
        if (!buffer.length) return;
        out.push({ kind: "cot", items: buffer, streaming: messageStreaming && atEnd });
        buffer = [];
    };
    blocks.forEach((b) => {
        if (b.kind === "reasoning" || b.kind === "tool") {
            buffer.push(b);
        } else {
            flush(false);
            out.push({ kind: "block", block: b });
        }
    });
    flush(true);
    return out;
}

export function AssistantMessage({
    message,
    threadId,
}: {
    message: IslandMessage;
    threadId?: string;
}) {
    const blocks = message.blocks ?? [];
    const items = React.useMemo(
        () => groupCotBlocks(blocks, !!message.streaming),
        [blocks, message.streaming]
    );
    const generatedFiles = message.generatedFiles ?? [];

    return (
        <div className="block">
            <div className="flex w-full min-w-0 flex-col gap-3">
                {blocks.length === 0 && message.streaming ? <StreamingDots /> : null}
                {items.map((item, i) => {
                    if (item.kind !== "cot") {
                        return <BlockRouter key={i} block={item.block} />;
                    }
                    if (item.items.length === 1 && item.items[0].kind === "reasoning") {
                        const r = item.items[0];
                        return (
                            <ReasoningBlock
                                key={`cot-${i}`}
                                content={r.content}
                                durationSec={r.durationSec}
                                streaming={r.streaming}
                            />
                        );
                    }
                    return (
                        <CotGroup key={`cot-${i}`} items={item.items} streaming={item.streaming} />
                    );
                })}
                {generatedFiles.length > 0 && (
                    <GeneratedFiles files={generatedFiles} threadId={threadId} />
                )}
                {message.streaming && blocks.length > 0 && <StreamingDots />}
                {!message.streaming && blocks.length > 0 && (
                    <MessageActions blocks={blocks} />
                )}
            </div>
        </div>
    );
}

function GeneratedFiles({
    files,
    threadId,
}: {
    files: IslandGeneratedFile[];
    threadId?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {files.map((f) => {
                const href = threadId
                    ? apiUrl(
                          `api/assistant/files/download?path=${encodeURIComponent(
                              f.path
                          )}&thread_id=${encodeURIComponent(threadId)}`
                      )
                    : undefined;
                return (
                    <a
                        key={f.path}
                        href={href}
                        download={f.name}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                            "group flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/60 px-3 py-2 transition-colors",
                            href
                                ? "hover:border-border hover:bg-foreground/[0.04]"
                                : "cursor-default opacity-60"
                        )}
                        title={href ? `Download ${f.name}` : f.name}
                        onClick={(e) => {
                            if (!href) e.preventDefault();
                        }}
                    >
                        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-foreground/[0.06] text-muted-foreground">
                            <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-foreground">
                                {f.name}
                            </span>
                            {f.size != null && (
                                <span className="block text-[11px] text-muted-foreground">
                                    {formatBytes(f.size)}
                                </span>
                            )}
                        </span>
                        <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </a>
                );
            })}
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BlockRouter({ block }: { block: IslandBlock }) {
    switch (block.kind) {
        case "plan":
            return <PlanBlock title={block.title} items={block.items} />;
        case "reasoning":
            return (
                <ReasoningBlock
                    content={block.content}
                    durationSec={block.durationSec}
                    streaming={block.streaming}
                />
            );
        case "tool":
            return (
                <ToolBlock
                    name={block.name}
                    status={block.status}
                    argsText={block.argsText}
                    resultText={block.resultText}
                    durationSec={block.durationSec}
                />
            );
        case "text":
            return <TextBlock content={block.content} />;
        case "sources":
            return null;
        case "error":
            return (
                <ErrorBlock title={block.title} message={block.message} details={block.details} />
            );
    }
}

function CotGroup({ items, streaming }: { items: CotBlock[]; streaming: boolean }) {
    const toolCount = items.filter((it) => it.kind === "tool").length;
    const reasoningCount = items.filter((it) => it.kind === "reasoning").length;

    const summary = React.useMemo(() => {
        if (toolCount > 0 && reasoningCount > 0) {
            return `Reasoned and used ${toolCount} tool${toolCount === 1 ? "" : "s"}`;
        }
        if (toolCount > 0) {
            return `Used ${toolCount} tool${toolCount === 1 ? "" : "s"}`;
        }
        return "Thought for a few seconds";
    }, [toolCount, reasoningCount]);

    const header = React.useMemo(() => {
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            if (it.kind === "tool") {
                if (it.status === "running") {
                    return { text: getToolDisplayName(it.name), toolName: it.name };
                }
            } else if (streaming) {
                const lines = it.content.split(/\n+/).filter((l) => l.trim());
                const last = lines[lines.length - 1]?.trim() ?? "";
                return { text: (last.length > 100 ? last.slice(0, 100) + "…" : last) || "Thinking…", toolName: null };
            }
        }
        return { text: summary, toolName: null };
    }, [items, streaming, summary]);

    const HeaderIcon = header.toolName ? getToolIcon(header.toolName) : BrainIcon;
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLOListElement>(null);

    React.useEffect(() => {
        if (!streaming) return;
        const el = drawerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    });

    return (
        <ChainOfThought
            isStreaming={streaming}
            defaultOpen={streaming}
            className="overflow-hidden rounded-2xl border border-border/80 bg-card/60"
        >
            <ChainOfThoughtHeader className="px-3.5 py-2.5">
                <HeaderIcon className="size-4 flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                    {streaming ? (
                        <TextShimmer className="truncate text-sm" duration={3} spread={1}>
                            {header.text}
                        </TextShimmer>
                    ) : (
                        <span className="truncate text-sm">{header.text}</span>
                    )}
                </div>
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent className="border-t border-border/50">
                <div ref={drawerRef} className="max-h-[280px] overflow-y-auto px-3.5 py-2">
                    <ol ref={contentRef} className="relative flex flex-col">
                        <span
                            aria-hidden
                            className="absolute bottom-[12px] left-[2px] top-[12px] w-px bg-border/60"
                        />
                        {items.map((it, idx) => {
                            const isLast = idx === items.length - 1;
                            const isActive =
                                streaming &&
                                isLast &&
                                (it.kind === "tool"
                                    ? it.status === "running"
                                    : !!it.streaming);
                            return (
                                <li
                                    key={it.kind === "reasoning" ? `r-${idx}` : `t-${it.toolCallId}`}
                                    className="relative flex gap-2.5 pb-1 last:pb-0"
                                >
                                    <div className="relative flex w-1.5 flex-shrink-0 flex-col items-center">
                                        <span
                                            className={cn(
                                                "z-10 mt-[9px] h-1.5 w-1.5 rounded-full ring-2 ring-card",
                                                isActive
                                                    ? "animate-pulse bg-primary"
                                                    : "bg-muted-foreground/60"
                                            )}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {it.kind === "reasoning" ? (
                                            <ReasoningBlock
                                                bare
                                                content={it.content}
                                                durationSec={it.durationSec}
                                                streaming={it.streaming}
                                            />
                                        ) : (
                                            <ToolBlock
                                                bare
                                                name={it.name}
                                                status={it.status}
                                                argsText={it.argsText}
                                                resultText={it.resultText}
                                                durationSec={it.durationSec}
                                            />
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}

function StreamingDots() {
    return (
        <div className="inline-flex items-center gap-1 px-0.5 py-1.5">
            {[0, 0.15, 0.3].map((d, i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: `${d}s` }}
                />
            ))}
        </div>
    );
}

function collectAssistantText(blocks: IslandBlock[]): string {
    return blocks
        .filter((b): b is Extract<IslandBlock, { kind: "text" }> => b.kind === "text")
        .map((b) => b.content)
        .join("\n\n")
        .trim();
}

function MessageActions({ blocks }: { blocks: IslandBlock[] }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        const text = collectAssistantText(blocks);
        if (!text) return;
        void navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="-mt-1 flex gap-1 opacity-70 transition-opacity hover:opacity-100">
            <button
                type="button"
                title={copied ? "Copied" : "Copy"}
                onClick={handleCopy}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}
