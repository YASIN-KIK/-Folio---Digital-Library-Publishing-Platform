import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipButtonProps {
    label: string;
    icon: React.ReactNode;
    isOpen?: boolean;
    count?: number;
    alwaysExpanded?: boolean;
    iconOnly?: boolean;
    disabled?: boolean;
}

export const ChipButton = React.forwardRef<HTMLButtonElement, ChipButtonProps>(
    function ChipButton(
        { label, icon, isOpen, count, alwaysExpanded, iconOnly, disabled, ...rest },
        ref
    ) {
        const showCount = count != null && count > 0;
        // Revealing the label on hover would resize the chip and reflow the toolbar.
        const showLabel = !iconOnly && alwaysExpanded;
        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled}
                aria-label={label}
                className={cn(
                    "group inline-flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-[12px] text-muted-foreground transition-colors",
                    "hover:border-border hover:bg-foreground/[0.04] hover:text-foreground",
                    isOpen && "border-border bg-foreground/[0.04] text-foreground",
                    disabled && "cursor-not-allowed opacity-50",
                )}
                {...rest}
            >
                <span className="grid h-3.5 w-3.5 place-items-center">{icon}</span>
                {showLabel && <span className="truncate">{label}</span>}
                {showCount && (
                    <span className="grid h-4 min-w-[1rem] place-items-center rounded-full bg-foreground/10 px-1 font-mono text-[10px] font-semibold text-foreground">
                        {count}
                    </span>
                )}
            </button>
        );
    }
);
