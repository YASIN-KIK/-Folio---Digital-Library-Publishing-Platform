import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IslandChatRecord, IslandMessage } from "../types";

interface AssistantChatState {
    chats: Record<string, IslandChatRecord>;
    activeChatId: string | null;
    streamingChatId: string | null;
    createChat: (chatId: string, threadId: string, firstMessage: IslandMessage, title?: string) => void;
    appendMessage: (chatId: string, msg: IslandMessage) => void;
    replaceChat: (record: IslandChatRecord) => void;
    updateMessage: (
        chatId: string,
        messageId: string,
        updater: (m: IslandMessage) => IslandMessage
    ) => void;
    truncateMessagesAt: (chatId: string, messageId: string) => void;
    setPlanUpdatedAt: (chatId: string, iso: string) => void;
    setStreaming: (chatId: string | null) => void;
    setActiveChat: (chatId: string | null) => void;
    removeChat: (chatId: string) => void;
}

export const useAssistantChatStore = create<AssistantChatState>()(
    persist(
        (set) => ({
            chats: {},
            activeChatId: null,
            streamingChatId: null,
            createChat: (chatId, threadId, firstMessage, title) =>
                set((s) => ({
                    activeChatId: chatId,
                    chats: {
                        ...s.chats,
                        [chatId]: {
                            chatId,
                            threadId,
                            title:
                                title ??
                                (firstMessage.content
                                    ? firstMessage.content.slice(0, 60)
                                    : "New chat"),
                            updatedAt: Date.now(),
                            messages: [firstMessage],
                        },
                    },
                })),
            replaceChat: (record) =>
                set((s) => ({
                    chats: { ...s.chats, [record.chatId]: record },
                })),
            appendMessage: (chatId, msg) =>
                set((s) => {
                    const c = s.chats[chatId];
                    if (!c) return s;
                    return {
                        chats: {
                            ...s.chats,
                            [chatId]: {
                                ...c,
                                updatedAt: Date.now(),
                                messages: [...c.messages, msg],
                            },
                        },
                    };
                }),
            updateMessage: (chatId, messageId, updater) =>
                set((s) => {
                    const c = s.chats[chatId];
                    if (!c) return s;
                    return {
                        chats: {
                            ...s.chats,
                            [chatId]: {
                                ...c,
                                updatedAt: Date.now(),
                                messages: c.messages.map((m) =>
                                    m.id === messageId ? updater(m) : m
                                ),
                            },
                        },
                    };
                }),
            truncateMessagesAt: (chatId, messageId) =>
                set((s) => {
                    const c = s.chats[chatId];
                    if (!c) return s;
                    const idx = c.messages.findIndex((m) => m.id === messageId);
                    if (idx === -1) return s;
                    return {
                        chats: {
                            ...s.chats,
                            [chatId]: {
                                ...c,
                                updatedAt: Date.now(),
                                messages: c.messages.slice(0, idx),
                            },
                        },
                    };
                }),
            setPlanUpdatedAt: (chatId, iso) =>
                set((s) => {
                    const c = s.chats[chatId];
                    if (!c) return s;
                    return {
                        chats: {
                            ...s.chats,
                            [chatId]: { ...c, planUpdatedAt: iso },
                        },
                    };
                }),
            setStreaming: (streamingChatId) => set({ streamingChatId }),
            setActiveChat: (activeChatId) => set({ activeChatId }),
            removeChat: (chatId) =>
                set((s) => {
                    const next = { ...s.chats };
                    delete next[chatId];
                    return { chats: next };
                }),
        }),
        {
            name: "alo-app-assistant-chats",
            partialize: (state) => {
                const entries = Object.values(state.chats)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 10);
                const chats: Record<string, (typeof state.chats)[string]> = {};
                for (const c of entries) {
                    chats[c.chatId] = { ...c, messages: c.messages.slice(-50) };
                }
                return {
                    chats,
                    activeChatId: state.activeChatId,
                    streamingChatId: null,
                };
            },
        }
    )
);
