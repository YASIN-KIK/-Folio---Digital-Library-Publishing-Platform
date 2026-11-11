import * as React from "react";
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolIcon, getToolDisplayName } from "../tool-icons";

interface Props {
    name: string;
    status: "running" | "done" | "error";
    argsText?: string;
    resultText?: string;
    durationSec?: number;
    bare?: boolean;
}

export function ToolBlock({ name, status, argsText, resultText, durationSec, bare }: Props) {
    const [open, setOpen] = React.useState(false);
    const ToolGlyph = getToolIcon(name);
    const displayName = getToolDisplayName(name);

    return (
        <div
            className={
                bare
                    ? "overflow-hidden"
                    : "overflow-hidden rounded-2xl border border-border/80 bg-card/60"
            }
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={
                    bare
                        ? "flex w-full items-center gap-2 px-0 py-0.5 text-left transition-colors"
                        : "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
                }
            >
                {status === "running" ? (
                    <span className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-[1.5px] border-warning-hard/40 border-t-warning-hard" />
                ) : (
                    <ToolGlyph
                        className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            status === "done" && "text-success-hard",
                            status === "error" && "text-destructive-hard"
                        )}
                    />
                )}
                <span className="truncate text-[13.5px] font-medium tracking-tight">
                    {displayName}
                </span>
                <span className="flex-1" />
                <StatusPill status={status} durationSec={durationSec} />
                {open ? (
                    <ChevronUp className="ml-1 h-3.5 w-3.5 opacity-60" />
                ) : (
                    <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
                )}
            </button>
            {open && (
                <div
                    className={
                        bare
                            ? "flex max-h-[240px] flex-col gap-2 overflow-y-auto py-1.5"
                            : "flex max-h-[240px] flex-col gap-3 overflow-y-auto border-t border-border/50 px-3.5 py-3"
                    }
                >
                    {argsText && <CopyableLine label="Input" text={argsText} />}
                    {resultText && <CopyableLine label="Output" text={resultText} />}
                </div>
            )}
        </div>
    );
}

export function CopyableLine({ label, text }: { label: string; text: string }) {
    const [copied, setCopied] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-foreground/[0.04] px-2 py-1">
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        title={expanded ? "Collapse" : "Expand"}
                    >
                        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground">
                            {text}
                        </code>
                        {expanded ? (
                            <ChevronUp className="h-3 w-3 shrink-0 opacity-60" />
                        ) : (
                            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                        )}
                    </button>
                    <button
                        type="button"
                        title={copied ? "Copied" : "Copy"}
                        onClick={handleCopy}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="max-h-[240px] min-w-0 overflow-auto rounded-md border border-border/70 bg-foreground/[0.04] px-2.5 py-2">
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground">
                        {text}
                    </pre>
                </div>
            )}
        </div>
    );
}

function StatusPill({
    status,
    durationSec,
}: {
    status: "running" | "done" | "error";
    durationSec?: number;
}) {
    if (status === "running") {
        return (
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-warning/35 bg-warning/20 px-2 font-mono text-[11px] text-warning-hard">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning-hard" />
                running
            </span>
        );
    }
    if (status === "error") {
        return (
            <span className="inline-flex h-5 items-center rounded-full border border-destructive/35 bg-destructive/20 px-2 font-mono text-[11px] text-destructive-hard">
                error
            </span>
        );
    }
    return (
        <span className="inline-flex h-5 items-center gap-1 rounded-full border border-success/30 bg-success/20 px-2 font-mono text-[11px] text-success-hard">
            <Check className="h-2.5 w-2.5" />
            {durationSec ? `${durationSec.toFixed(1)}s` : "done"}
        </span>
    );
}
