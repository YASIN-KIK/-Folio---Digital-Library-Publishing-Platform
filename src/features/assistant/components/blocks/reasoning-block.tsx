import * as React from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Response } from "@/components/ai-elements/response";

interface Props {
    content: string;
    durationSec?: number;
    streaming?: boolean;
    defaultOpen?: boolean;
    bare?: boolean;
}

export function ReasoningBlock({
    content,
    durationSec,
    streaming,
    defaultOpen,
    bare,
}: Props) {
    const [open, setOpen] = React.useState(defaultOpen ?? false);

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
                <Brain className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="text-[13.5px] font-medium tracking-tight">
                    {streaming ? "Thinking" : "Thought"}
                    {durationSec ? (
                        <span className="ml-1 font-mono text-[12px] font-normal text-muted-foreground">
                            for {durationSec.toFixed(0)}s
                        </span>
                    ) : null}
                </span>
                <span className="flex-1" />
                {open ? (
                    <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                )}
            </button>
            {open && (
                <div className={bare ? "" : "border-t border-border/50"}>
                    <div
                        className={
                            bare
                                ? "max-h-[240px] overflow-y-auto py-1.5"
                                : "max-h-[240px] overflow-y-auto px-3.5 py-3.5"
                        }
                    >
                        <div className="prose-island text-[13px] leading-relaxed text-muted-foreground">
                            <Response>{content}</Response>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
