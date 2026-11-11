
export type IslandRole = "user" | "assistant";

export interface PlanItem {
    status: "todo" | "doing" | "done";
    title: string;
    note?: string;
}

export type IslandBlock =
    | { kind: "plan"; title?: string; items: PlanItem[] }
    | { kind: "reasoning"; content: string; durationSec?: number; streaming?: boolean }
    | {
          kind: "tool";
          toolCallId: string;
          name: string;
          status: "running" | "done" | "error";
          argsText?: string;
          resultText?: string;
          durationSec?: number;
      }
    | { kind: "text"; content: string; streaming?: boolean }
    | { kind: "sources"; items: { name: string; meta?: string }[] }
    | { kind: "error"; title?: string; message: string; details?: string };

export interface IslandFileAttachment {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    presignedUrl: string;
    sandboxPath?: string;
}

export interface IslandGeneratedFile {
    path: string;
    name: string;
    mimeType: string;
    size?: number;
}

export interface IslandMessage {
    id: string;
    role: IslandRole;
    content?: string;
    blocks?: IslandBlock[];
    streaming?: boolean;
    files?: IslandFileAttachment[];
    generatedFiles?: IslandGeneratedFile[];
    planMode?: boolean;
}

export interface IslandChatRecord {
    chatId: string;
    threadId: string;
    title: string;
    updatedAt: number;
    messages: IslandMessage[];
    planUpdatedAt?: string | null;
}

export interface CapabilitiesBundle {
    agents: AgentItem[];
    models: ModelItem[];
    tools: ToolItem[];
    tool_sets: ToolSetItem[];
    skills: SkillItem[];
    skill_sets: SkillSetItem[];
    prompts: PromptItem[];
    connections: ConnectionItem[];
    mcp_connections: McpConnectionItem[];
    defaults: CapabilityDefaults;
}

export interface AgentItem {
    id: number;
    slug: string;
    name: string;
    description?: string;
    is_default?: boolean;
}

export interface ModelItem {
    id: number;
    name: string;
    slug?: string;
    enabled?: boolean;
}

export interface ToolItem {
    name: string;
    display_name: string;
    description?: string;
}

export interface ToolSetItem {
    name: string;
    label: string;
    description?: string;
    tool_names: string[];
}

export interface SkillItem {
    id: number;
    slug: string;
    name: string;
    description?: string;
}

export interface SkillSetItem {
    id: number;
    slug: string;
    name: string;
    description?: string;
}

export interface PromptItem {
    id: number;
    name: string;
    description?: string;
}

export interface ConnectionItem {
    id: number;
    name: string;
    connector_key?: string;
}

export interface McpConnectionItem {
    id: number;
    name: string;
}

export interface CapabilityDefaults {
    agent_id: number | null;
    connection_ids: number[];
    mcp_connection_ids: number[];
    model_slug?: string | null;
    model_config_id?: number | null;
}
