"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
    createContext,
    memo,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

interface ChainOfThoughtContextValue {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isStreaming: boolean;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
    null
);

export const useChainOfThought = () => {
    const context = useContext(ChainOfThoughtContext);
    if (!context) {
        throw new Error(
            "ChainOfThought components must be used within ChainOfThought"
        );
    }
    return context;
};

const AUTO_CLOSE_DELAY = 1000;

export type ChainOfThoughtProps = ComponentProps<"div"> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    isStreaming?: boolean;
};

export const ChainOfThought = memo(
    ({
        className,
        open,
        defaultOpen = false,
        onOpenChange,
        isStreaming = false,
        children,
        ...props
    }: ChainOfThoughtProps) => {
        const [isOpen, setIsOpen] = useControllableState({
            defaultProp: defaultOpen,
            onChange: onOpenChange,
            prop: open,
        });

        const [hasAutoClosed, setHasAutoClosed] = useState(false);
        const [hasEverStreamed, setHasEverStreamed] = useState(false);

        useEffect(() => {
            if (isStreaming) {
                setIsOpen(true);
                setHasAutoClosed(false);
                setHasEverStreamed(true);
            }
        }, [isStreaming, setIsOpen]);

        useEffect(() => {
            if (!isStreaming && isOpen && !hasAutoClosed && hasEverStreamed) {
                const timer = setTimeout(() => {
                    setIsOpen(false);
                    setHasAutoClosed(true);
                }, AUTO_CLOSE_DELAY);
                return () => clearTimeout(timer);
            }
        }, [isStreaming, isOpen, hasAutoClosed, hasEverStreamed, setIsOpen]);

        const ctx = useMemo(
            () => ({ isOpen: isOpen ?? false, setIsOpen, isStreaming }),
            [isOpen, setIsOpen, isStreaming]
        );

        return (
            <ChainOfThoughtContext.Provider value={ctx}>
                <Collapsible
                    open={isOpen ?? false}
                    onOpenChange={setIsOpen}
                    className={cn("not-prose w-full", className)}
                    {...props}
                >
                    {children}
                </Collapsible>
            </ChainOfThoughtContext.Provider>
        );
    }
);

export type ChainOfThoughtHeaderProps = ComponentProps<"div"> & {
    children?: ReactNode;
};

export const ChainOfThoughtHeader = memo(
    ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
        const { isOpen } = useChainOfThought();

        return (
            <div className={cn("py-1.5", className)} {...props}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground min-w-0">
                    {children}
                    <ChevronDownIcon
                        className={cn(
                            "size-4 transition-transform flex-shrink-0 ml-auto",
                            isOpen ? "rotate-180" : "rotate-0"
                        )}
                    />
                </CollapsibleTrigger>
            </div>
        );
    }
);

export type ChainOfThoughtContentProps = ComponentProps<"div">;

export const ChainOfThoughtContent = memo(
    ({ className, children, ...props }: ChainOfThoughtContentProps) => (
        <CollapsibleContent
            className={cn(
                "pt-2 pb-1",
                "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
                className
            )}
            {...props}
        >
            <div className="space-y-0 min-w-0">{children}</div>
        </CollapsibleContent>
    )
);

export type ChainOfThoughtStepStatus = "active" | "complete" | "pending";

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
    icon?: LucideIcon;
    label: ReactNode;
    description?: ReactNode;
    status?: ChainOfThoughtStepStatus;
    isLast?: boolean;
};

const stepStatusStyles: Record<ChainOfThoughtStepStatus, string> = {
    active: "text-foreground",
    complete: "text-muted-foreground",
    pending: "text-muted-foreground/50",
};

export const ChainOfThoughtStep = memo(
    ({
        className,
        icon: Icon,
        label,
        description,
        status = "complete",
        isLast = false,
        children,
        ...props
    }: ChainOfThoughtStepProps) => (
        <div
            className={cn(
                "flex gap-3 text-sm min-w-0",
                stepStatusStyles[status],
                className
            )}
            {...props}
        >
            <div className="relative flex-shrink-0 flex flex-col items-center">
                <div
                    className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border transition-colors mt-0.5",
                        status === "active" &&
                            "border-primary/50 bg-primary/10",
                        status === "complete" &&
                            "border-border bg-muted/30",
                        status === "pending" && "border-border/50 bg-transparent"
                    )}
                >
                    {Icon && (
                        <Icon
                            className={cn(
                                "size-3.5 transition-colors",
                                status === "active" && "text-primary animate-pulse",
                                status === "complete" && "text-muted-foreground",
                                status === "pending" && "text-muted-foreground/40"
                            )}
                        />
                    )}
                </div>
                {!isLast && (
                    <div className="flex-1 w-px bg-border/50 mt-1 min-h-[8px]" />
                )}
            </div>

            <div className="flex-1 min-w-0 pb-3">
                <div
                    className={cn(
                        "font-medium leading-6 truncate",
                        status === "active" && "text-foreground",
                        status === "complete" && "text-muted-foreground",
                        status === "pending" && "text-muted-foreground/50"
                    )}
                >
                    {label}
                </div>
                {description && (
                    <div className="text-muted-foreground text-xs mt-0.5">
                        {description}
                    </div>
                )}
                {children && (
                    <div className="mt-2 min-w-0">{children}</div>
                )}
            </div>
        </div>
    )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
