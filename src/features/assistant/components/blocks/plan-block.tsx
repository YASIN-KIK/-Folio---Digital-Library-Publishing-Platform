import * as React from "react";
import { Check, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanItem } from "../../types";

interface Props {
    title?: string;
    items: PlanItem[];
}

export function PlanBlock({ title = "Plan", items }: Props) {
    const total = items.length;
    const done = items.filter((i) => i.status === "done").length;
    const working = items.some((i) => i.status === "doing");
    const currentItem = items.find((i) => i.status === "doing");
    const [open, setOpen] = React.useState(true);

    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl border border-border/80 bg-card/75",
                working && "ring-1 ring-primary/20"
            )}
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
            >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-foreground/[0.06] text-foreground">
                    <Minus className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13.5px] font-medium tracking-tight">{title}</span>
                <span className="flex-1" />
                {working && (
                    <span className="block h-1 w-20 overflow-hidden rounded-full bg-foreground/10">
                        <span
                            className="block h-full rounded-full bg-primary transition-[width] duration-400"
                            style={{ width: `${(done / total) * 100}%` }}
                        />
                    </span>
                )}
                <span className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {done} / {total}
                </span>
                {open ? (
                    <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                )}
            </button>

            {!open && currentItem && (
                <div className="flex items-start gap-3 px-3.5 pb-3.5 pt-1">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border-[1.5px] border-primary bg-primary/[0.08]">
                        <PlanSpinner />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] leading-snug">{currentItem.title}</div>
                        {currentItem.note && (
                            <div className="mt-0.5 text-[12px] text-muted-foreground">
                                {currentItem.note}
                            </div>
                        )}
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/15 px-1.5 text-[10.5px] font-medium uppercase tracking-wide text-foreground">
                        running
                    </span>
                </div>
            )}

            {open && (
                <ol className="m-0 flex list-none flex-col p-0 px-3.5 pb-3.5 pt-1">
                    {items.map((it, i) => (
                        <li key={i} className="relative flex items-start gap-3 py-1.5">
                            <span
                                className={cn(
                                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                                    it.status === "done" &&
                                        "border-success bg-success text-success-foreground",
                                    it.status === "doing" && "border-primary bg-primary/[0.08]",
                                    it.status === "todo" &&
                                        "border-dashed border-foreground/20 bg-background"
                                )}
                            >
                                {it.status === "done" && <Check className="h-3 w-3" />}
                                {it.status === "doing" && <PlanSpinner />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div
                                    className={cn(
                                        "text-[13.5px] leading-snug",
                                        it.status === "done" &&
                                            "text-muted-foreground line-through decoration-muted-foreground/40",
                                        it.status === "todo" && "text-muted-foreground"
                                    )}
                                >
                                    {it.title}
                                </div>
                                {it.note && (
                                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                                        {it.note}
                                    </div>
                                )}
                            </div>
                            {it.status === "doing" && (
                                <span className="rounded-full border border-primary/30 bg-primary/15 px-1.5 text-[10.5px] font-medium uppercase tracking-wide text-foreground">
                                    running
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function PlanSpinner() {
    return (
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-primary/35 border-t-primary" />
    );
}
