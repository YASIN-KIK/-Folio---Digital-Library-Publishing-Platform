import { useMemo } from "react";
import { useAssistantChatStore } from "../store/chat-store";
import type { IslandChatRecord } from "../types";

export function useChatHistory(limit = 20): IslandChatRecord[] {
    const chats = useAssistantChatStore((s) => s.chats);
    return useMemo(
        () =>
            Object.values(chats)
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, limit),
        [chats, limit]
    );
}
