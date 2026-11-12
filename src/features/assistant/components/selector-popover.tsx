import * as React from "react";
import { Check, Loader2, Search } from "lucide-react";
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChipButton } from "./chip-button";
import { cn } from "@/lib/utils";

export interface SelectorRow {
    key: string | number;
    name: string;
    description?: string;
    icon?: React.ReactNode;
    dot?: string;
    detail?: React.ReactNode;
    end?: React.ReactNode;
    children?: SelectorRow[];
}

const EMPTY: SelectorRow[] = [];

function rowMatchesSearch(row: SelectorRow, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [String(row.key), row.name, row.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    if (hay.includes(q)) return true;
    return row.children?.some((c) => rowMatchesSearch(c, q)) ?? false;
}

interface SelectorPopoverProps {
    label: string;
    icon: React.ReactNode;
    rows: SelectorRow[] | undefined;
    isLoading?: boolean;
    error?: unknown;
    selectedKeys: Array<string | number>;
    onToggle: (key: string | number) => void;
    onToggleAll?: (keys: Array<string | number>, selectAll: boolean) => void;
    single?: boolean;
    onPickSingle?: (key: string | number) => void;
    emptyHint?: string;
    trigger?: React.ReactNode | ((open: boolean) => React.ReactNode);
    renderAnchor?: (trigger: React.ReactNode) => React.ReactNode;
    align?: "start" | "center" | "end";
    side?: "top" | "bottom";
    alwaysExpanded?: boolean;
    iconOnly?: boolean;
    disabled?: boolean;
    disabledTooltip?: string;
    previewDescription?: boolean;
    footerAction?: {
        label: string;
        onClick?: () => void;
        icon?: React.ReactNode;
    };
    detailWidth?: number;
}

export function SelectorPopover({
    label,
    icon,
    rows,
    isLoading,
    error,
    selectedKeys,
    onToggle,
    onToggleAll,
    single,
    onPickSingle,
    emptyHint = "Nothing here yet.",
    trigger,
    renderAnchor,
    align = "start",
    side = "top",
    alwaysExpanded,
    iconOnly,
    disabled,
    disabledTooltip,
    previewDescription,
    footerAction,
    detailWidth = 280,
}: SelectorPopoverProps) {
    const [open, setOpen] = React.useState(false);
    const [previewKey, setPreviewKey] = React.useState<string | number | null>(null);
    const [previewOffset, setPreviewOffset] = React.useState(0);
    const [searchQuery, setSearchQuery] = React.useState("");
    const listCardRef = React.useRef<HTMLDivElement>(null);
    const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const safeRows = rows ?? EMPTY;
    const filteredRows = React.useMemo(
        () => safeRows.filter((r) => rowMatchesSearch(r, searchQuery)),
        [safeRows, searchQuery]
    );

    const scheduleHide = () => {
        hideTimer.current = setTimeout(() => setPreviewKey(null), 150);
    };
    const cancelHide = () => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    };

    if (disabled) {
        return (
            <span title={disabledTooltip} className="inline-flex">
                <ChipButton
                    label={label}
                    icon={icon}
                    isOpen={false}
                    count={0}
                    alwaysExpanded={alwaysExpanded}
                    iconOnly={iconOnly}
                    disabled
                />
            </span>
        );
    }

    const findRow = (list: SelectorRow[], key: string | number): SelectorRow | null => {
        for (const r of list) {
            if (r.key === key) return r;
            if (r.children) {
                const found = findRow(r.children, key);
                if (found) return found;
            }
        }
        return null;
    };
    const previewRow = previewKey != null ? findRow(safeRows, previewKey) : null;

    const renderRow = (row: SelectorRow): React.ReactNode => {
        const hasChildren = !!row.children?.length;
        const selectedCount = hasChildren
            ? row.children!.filter((c) => selectedKeys.includes(c.key)).length
            : 0;
        const on = hasChildren ? selectedCount > 0 : selectedKeys.includes(row.key);

        return (
            <button
                key={row.key}
                type="button"
                onClick={() => {
                    if (hasChildren) {
                        setPreviewKey(row.key);
                        return;
                    }
                    if (single) {
                        onPickSingle?.(row.key);
                        setOpen(false);
                    } else {
                        onToggle(row.key);
                    }
                }}
                onMouseEnter={
                    hasChildren
                        ? (e) => {
                              cancelHide();
                              setPreviewKey(row.key);
                              const listEl = listCardRef.current;
                              if (listEl) {
                                  const listRect = listEl.getBoundingClientRect();
                                  const rowRect = (
                                      e.currentTarget as HTMLElement
                                  ).getBoundingClientRect();
                                  setPreviewOffset(Math.max(0, rowRect.top - listRect.top));
                              }
                          }
                        : () => {
                              cancelHide();
                              setPreviewKey(null);
                          }
                }
                onMouseLeave={scheduleHide}
                className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-foreground transition-colors hover:bg-foreground/5",
                    on && "bg-foreground/[0.04]"
                )}
            >
                {row.dot ? (
                    <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                            background: row.dot,
                            boxShadow: `0 0 0 1px color-mix(in oklab, ${row.dot} 60%, transparent)`,
                        }}
                    />
                ) : (
                    <span
                        className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-muted-foreground",
                            on && "text-foreground"
                        )}
                    >
                        {row.icon}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block break-words text-[13px] leading-tight text-foreground">
                        {row.name}
                    </span>
                    {row.description && !previewDescription && (
                        <span className="mt-0.5 line-clamp-2 block break-words text-[11.5px] leading-snug text-muted-foreground">
                            {row.description}
                        </span>
                    )}
                </span>
                {hasChildren ? (
                    <span
                        className={cn(
                            "mt-0.5 shrink-0 text-[11px] font-medium tabular-nums",
                            selectedCount > 0 ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {selectedCount}/{row.children!.length}
                    </span>
                ) : (
                    <span className="ml-auto mt-0.5 flex min-w-[3rem] shrink-0 items-center justify-end gap-1.5">
                        <Check
                            className={cn(
                                "h-3.5 w-3.5 text-foreground transition-opacity",
                                on ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {row.end}
                    </span>
                )}
            </button>
        );
    };

    const renderListBody = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                </div>
            );
        }
        if (error) {
            return <div className="px-3 py-3 text-xs text-destructive">Failed to load.</div>;
        }
        if (!safeRows.length) {
            return <div className="px-3 py-3 text-xs text-muted-foreground">{emptyHint}</div>;
        }
        if (!filteredRows.length) {
            return (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                    No results for &quot;{searchQuery.trim()}&quot;.
                </div>
            );
        }
        return <div className="flex flex-col gap-0.5">{filteredRows.map(renderRow)}</div>;
    };

    const showDetail = previewRow != null && !!previewRow.children?.length;

    const triggerNode = (
        <Tooltip delayDuration={250}>
            <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                    {typeof trigger === "function" ? (
                        trigger(open)
                    ) : (
                        trigger ?? (
                            <ChipButton
                                label={label}
                                icon={icon}
                                isOpen={open}
                                count={single ? 0 : selectedKeys.length}
                                alwaysExpanded={alwaysExpanded}
                                iconOnly={iconOnly}
                            />
                        )
                    )}
                </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    );

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) {
                    setPreviewKey(null);
                    setSearchQuery("");
                }
            }}
        >
            {renderAnchor ? (
                <PopoverAnchor asChild>{renderAnchor(triggerNode)}</PopoverAnchor>
            ) : (
                triggerNode
            )}
            <PopoverContent
                align={align}
                side={side}
                sideOffset={8}
                collisionPadding={16}
                className="relative z-50 flex max-w-[calc(100vw-2rem)] items-end gap-2 border-0 bg-transparent p-0 pb-2 shadow-none outline-none"
                style={{
                    maxHeight:
                        "min(320px, var(--radix-popover-content-available-height, 320px))",
                    width: "auto",
                }}
            >
                <div
                    ref={listCardRef}
                    className="flex shrink-0 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl"
                    style={{
                        width: "300px",
                        maxHeight:
                            "min(320px, var(--radix-popover-content-available-height, 320px))",
                    }}
                >
                    <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
                        <span className="text-[13px] font-medium tracking-tight text-foreground">
                            {label}
                        </span>
                    </div>
                    <div className="mx-2 h-px shrink-0 bg-border/70" />
                    {!isLoading && !error && safeRows.length > 0 && (
                        <>
                            <div className="shrink-0 p-1">
                                <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-2 py-1.5 text-muted-foreground">
                                    <Search className="h-3.5 w-3.5 shrink-0" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={`Search ${label.toLowerCase()}...`}
                                        className="min-w-0 flex-1 bg-transparent text-[12px] leading-tight text-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div className="mx-2 h-px shrink-0 bg-border/70" />
                        </>
                    )}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
                        {renderListBody()}
                    </div>
                    {footerAction && (
                        <>
                            <div className="mx-2 h-px shrink-0 bg-border/70" />
                            <div className="shrink-0 p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        footerAction.onClick?.();
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-foreground/5"
                                >
                                    <span className="grid h-5 w-5 shrink-0 place-items-center text-muted-foreground">
                                        {footerAction.icon}
                                    </span>
                                    <span className="min-w-0 flex-1 leading-tight">
                                        {footerAction.label}
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {showDetail && previewRow && (
                    <div
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                        className="hidden flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl sm:flex"
                        style={{
                            width: `${detailWidth}px`,
                            maxHeight:
                                "min(320px, var(--radix-popover-content-available-height, 320px))",
                            marginTop: previewOffset,
                        }}
                    >
                        <div className="flex shrink-0 items-center px-3 py-2.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Details
                            </span>
                        </div>
                        <div className="mx-2 h-px shrink-0 bg-border/70" />
                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            <div className="flex flex-col gap-2">
                                {previewRow.children?.length ? (
                                    <div className="mt-1 flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Includes {previewRow.children.length} tools
                                            </span>
                                            {onToggleAll &&
                                                (() => {
                                                    const childKeys = previewRow.children!.map(
                                                        (c) => c.key
                                                    );
                                                    const allOn = childKeys.every((k) =>
                                                        selectedKeys.includes(k)
                                                    );
                                                    return (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onToggleAll(childKeys, !allOn)
                                                            }
                                                            className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-foreground transition-colors hover:bg-foreground/5"
                                                        >
                                                            {allOn ? "Deselect all" : "Select all"}
                                                        </button>
                                                    );
                                                })()}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {previewRow.children.map((c) => {
                                                const on = selectedKeys.includes(c.key);
                                                return (
                                                    <button
                                                        key={c.key}
                                                        type="button"
                                                        onClick={() => onToggle(c.key)}
                                                        className={cn(
                                                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-foreground transition-colors hover:bg-foreground/5",
                                                            on && "bg-foreground/[0.04]"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "grid h-4 w-4 shrink-0 place-items-center text-muted-foreground",
                                                                on && "text-foreground"
                                                            )}
                                                        >
                                                            {c.icon}
                                                        </span>
                                                        <span className="min-w-0 flex-1 break-words text-[12px] leading-tight text-foreground">
                                                            {c.name}
                                                        </span>
                                                        <Check
                                                            className={cn(
                                                                "h-3 w-3 shrink-0 text-foreground transition-opacity",
                                                                on ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                                            {previewRow.icon ? (
                                                <span className="text-muted-foreground">
                                                    {previewRow.icon}
                                                </span>
                                            ) : null}
                                            <span className="break-words">{previewRow.name}</span>
                                        </div>
                                        {previewRow.description && (
                                            <p className="whitespace-pre-wrap break-words text-[11.5px] leading-snug text-muted-foreground">
                                                {previewRow.description}
                                            </p>
                                        )}
                                        {previewRow.detail && (
                                            <div className="text-[11.5px] leading-snug text-muted-foreground">
                                                {previewRow.detail}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
