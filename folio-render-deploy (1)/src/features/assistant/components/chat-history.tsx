import * as React from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAssistantChatStore } from "../store/chat-store";
import { useChatHistory } from "../hooks/use-chat-history";
import { cn } from "@/lib/utils";

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
}

function useHistoryActions() {
    const setActiveChat = useAssistantChatStore((s) => s.setActiveChat);
    const removeChat = useAssistantChatStore((s) => s.removeChat);

    const newChat = React.useCallback(() => setActiveChat(null), [setActiveChat]);
    const openChat = React.useCallback(
        (id: string) => setActiveChat(id),
        [setActiveChat]
    );
    const deleteChat = React.useCallback(
        (id: string) => {
            const wasActive = useAssistantChatStore.getState().activeChatId === id;
            removeChat(id);
            if (wasActive) {
                const remaining = Object.values(
                    useAssistantChatStore.getState().chats
                ).sort((a, b) => b.updatedAt - a.updatedAt);
                setActiveChat(remaining[0]?.chatId ?? null);
            }
        },
        [removeChat, setActiveChat]
    );
    return { newChat, openChat, deleteChat };
}

function NewChatButton({
    full,
    onDone,
}: {
    full?: boolean;
    onDone?: () => void;
}) {
    const { newChat } = useHistoryActions();
    return (
        <button
            type="button"
            title="New chat"
            onClick={() => {
                newChat();
                onDone?.();
            }}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border/60 text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-foreground/[0.04] hover:text-foreground",
                full ? "w-full justify-center px-2 py-1.5" : "h-7 w-7 justify-center"
            )}
        >
            <Plus className="h-4 w-4" />
            {full && "New chat"}
        </button>
    );
}

function ChatHistoryList({ onPick }: { onPick?: () => void }) {
    const chats = useChatHistory();
    const activeChatId = useAssistantChatStore((s) => s.activeChatId);
    const { openChat, deleteChat } = useHistoryActions();

    if (!chats.length) {
        return (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No chats yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            {chats.map((c) => (
                <div
                    key={c.chatId}
                    className={cn(
                        "group flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-foreground/5",
                        c.chatId === activeChatId && "bg-foreground/[0.06]"
                    )}
                >
                    <button
                        type="button"
                        onClick={() => {
                            openChat(c.chatId);
                            onPick?.();
                        }}
                        className="min-w-0 flex-1 px-2 py-1.5 text-left"
                    >
                        <span className="block truncate text-[13px] text-foreground">
                            {c.title || "New chat"}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                            {relativeTime(c.updatedAt)}
                        </span>
                    </button>
                    <button
                        type="button"
                        title="Delete chat"
                        onClick={() => deleteChat(c.chatId)}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export function ChatHistoryDropdown() {
    const [open, setOpen] = React.useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Chat history"
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                    <Clock className="h-4 w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="w-72 p-1.5">
                <div className="flex items-center justify-between px-1.5 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Recent chats
                    </span>
                    <NewChatButton onDone={() => setOpen(false)} />
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                    <ChatHistoryList onPick={() => setOpen(false)} />
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ChatHistorySidebar({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex w-[200px] shrink-0 flex-col border-r border-border/40",
                className
            )}
        >
            <div className="flex items-center justify-between gap-2 px-3 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Chats
                </span>
            </div>
            <div className="px-2">
                <NewChatButton full />
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
                <ChatHistoryList />
            </div>
        </div>
    );
}
