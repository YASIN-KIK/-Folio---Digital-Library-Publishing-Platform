import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_PLATFORM_TOOL_NAMES = [
    "web-search",
    "image-generation",
    "youtube-video-analysis",
] as const;

interface ComposerState {
    planning: boolean;
    selectedAgentId: number | null;
    selectedModelSlug: string | null;
    selectedPromptIds: number[];
    selectedToolNames: string[];
    selectedSkillSlugs: string[];
    selectedConnectionIds: number[];
    selectedMcpConnectionIds: number[];
    setPlanning: (v: boolean) => void;
    setAgent: (id: number | null) => void;
    setModelSlug: (slug: string | null) => void;
    togglePrompt: (id: number) => void;
    setPromptIds: (ids: number[]) => void;
    removePrompt: (id: number) => void;
    clearPrompts: () => void;
    toggleTool: (name: string) => void;
    setToolsBulk: (names: string[], on: boolean) => void;
    toggleSkill: (slug: string) => void;
    setSkillSlugs: (slugs: string[]) => void;
    toggleConnection: (id: number) => void;
    setConnectionIds: (ids: number[]) => void;
    toggleMcpConnection: (id: number) => void;
    setMcpConnectionIds: (ids: number[]) => void;
    pruneTools: (knownNames: Set<string>) => void;
    reset: () => void;
    applyDefaults: (defaults: {
        agent_id?: number | null;
        model_slug?: string | null;
        connection_ids?: number[];
        mcp_connection_ids?: number[];
    }) => void;
}

export const useAssistantComposerStore = create<ComposerState>()(
    persist(
        (set, get) => ({
            planning: false,
            selectedAgentId: null,
            selectedModelSlug: null,
            selectedPromptIds: [],
            selectedToolNames: [...DEFAULT_PLATFORM_TOOL_NAMES],
            selectedSkillSlugs: [],
            selectedConnectionIds: [],
            selectedMcpConnectionIds: [],
            setPlanning: (planning) => set({ planning }),
            setAgent: (selectedAgentId) =>
                set(
                    selectedAgentId != null
                        ? { selectedAgentId, selectedPromptIds: [] }
                        : { selectedAgentId }
                ),
            setModelSlug: (selectedModelSlug) => set({ selectedModelSlug }),
            togglePrompt: (id) =>
                set((s) => ({
                    selectedPromptIds: s.selectedPromptIds.includes(id)
                        ? s.selectedPromptIds.filter((x) => x !== id)
                        : [...s.selectedPromptIds, id],
                })),
            removePrompt: (id) =>
                set((s) => ({
                    selectedPromptIds: s.selectedPromptIds.filter((x) => x !== id),
                })),
            setPromptIds: (ids) => set({ selectedPromptIds: ids }),
            clearPrompts: () => set({ selectedPromptIds: [] }),
            toggleTool: (name) =>
                set((s) => ({
                    selectedToolNames: s.selectedToolNames.includes(name)
                        ? s.selectedToolNames.filter((x) => x !== name)
                        : [...s.selectedToolNames, name],
                })),
            setToolsBulk: (names, on) =>
                set((s) => {
                    if (on) {
                        const merged = new Set(s.selectedToolNames);
                        for (const n of names) merged.add(n);
                        return { selectedToolNames: Array.from(merged) };
                    }
                    const drop = new Set(names);
                    return {
                        selectedToolNames: s.selectedToolNames.filter((n) => !drop.has(n)),
                    };
                }),
            toggleSkill: (slug) =>
                set((s) => ({
                    selectedSkillSlugs: s.selectedSkillSlugs.includes(slug)
                        ? s.selectedSkillSlugs.filter((x) => x !== slug)
                        : [...s.selectedSkillSlugs, slug],
                })),
            setSkillSlugs: (slugs) => set({ selectedSkillSlugs: slugs }),
            toggleConnection: (id) =>
                set((s) => ({
                    selectedConnectionIds: s.selectedConnectionIds.includes(id)
                        ? s.selectedConnectionIds.filter((x) => x !== id)
                        : [...s.selectedConnectionIds, id],
                })),
            setConnectionIds: (ids) => set({ selectedConnectionIds: ids }),
            toggleMcpConnection: (id) =>
                set((s) => ({
                    selectedMcpConnectionIds: s.selectedMcpConnectionIds.includes(id)
                        ? s.selectedMcpConnectionIds.filter((x) => x !== id)
                        : [...s.selectedMcpConnectionIds, id],
                })),
            setMcpConnectionIds: (ids) => set({ selectedMcpConnectionIds: ids }),
            pruneTools: (knownNames) =>
                set((s) => {
                    const next = s.selectedToolNames.filter((n) => knownNames.has(n));
                    if (next.length === s.selectedToolNames.length) return s;
                    return { selectedToolNames: next };
                }),
            reset: () =>
                set({
                    planning: false,
                    selectedAgentId: null,
                    selectedModelSlug: null,
                    selectedPromptIds: [],
                    selectedToolNames: [...DEFAULT_PLATFORM_TOOL_NAMES],
                    selectedSkillSlugs: [],
                    selectedConnectionIds: [],
                    selectedMcpConnectionIds: [],
                }),
            applyDefaults: (defaults) => {
                const s = get();
                // Skip set() when defaults are already applied to prevent an update loop.
                const patch: {
                    selectedAgentId?: number;
                    selectedModelSlug?: string;
                    selectedConnectionIds?: number[];
                    selectedMcpConnectionIds?: number[];
                } = {};
                if (defaults.agent_id != null && s.selectedAgentId == null)
                    patch.selectedAgentId = defaults.agent_id;
                if (defaults.model_slug && s.selectedModelSlug == null)
                    patch.selectedModelSlug = defaults.model_slug;
                if (defaults.connection_ids?.length && s.selectedConnectionIds.length === 0)
                    patch.selectedConnectionIds = defaults.connection_ids;
                if (defaults.mcp_connection_ids?.length && s.selectedMcpConnectionIds.length === 0)
                    patch.selectedMcpConnectionIds = defaults.mcp_connection_ids;
                if (Object.keys(patch).length) set(patch);
            },
        }),
        {
            name: "alo-app-assistant-composer",
            version: 1,
        }
    )
);
