import * as React from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
    title?: string;
    message: string;
    details?: string;
}

export function ErrorBlock({ title, message, details }: Props) {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/10">
            <div className="flex items-start gap-2.5 px-3.5 py-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-destructive/20 text-destructive-hard">
                    <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[13.5px] font-medium tracking-tight text-foreground">
                        {title ?? "Something went wrong"}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">{message}</span>
                </div>
                {details ? (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[11.5px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    >
                        {open ? "Hide details" : "Show details"}
                        {open ? (
                            <ChevronUp className="h-3 w-3 opacity-70" />
                        ) : (
                            <ChevronDown className="h-3 w-3 opacity-70" />
                        )}
                    </button>
                ) : null}
            </div>
            {open && details ? (
                <div className="max-h-[240px] overflow-y-auto border-t border-destructive/25 bg-foreground/[0.03] px-3.5 py-2.5">
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground">
                        {details}
                    </pre>
                </div>
            ) : null}
        </div>
    );
}
