import * as React from "react";
import {
    Code,
    FileCode,
    FilePen,
    FilePlus,
    FileText,
    FolderSearch,
    Globe,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    type LucideIcon,
    MessageCircleQuestion,
    MonitorPlay,
    Search,
    Terminal,
    Unplug,
    Wrench,
} from "lucide-react";

export const TOOL_ICON_MAP: Record<string, LucideIcon> = {
    "web-search": Globe,
    "web-extract": Globe,
    "web-crawl": Globe,
    "web-map": Globe,
    semantic_search_tool: FolderSearch,
    list_contents_tool: FolderSearch,
    get_content_url_tool: FolderSearch,
    "execute-code": Code,
    "list-sandbox-files": FileCode,
    "read-file": FileText,
    "write-file": FilePlus,
    "edit-file": FilePen,
    bash: Terminal,
    grep: Search,
    glob: FolderSearch,
    "image-generation": ImageIcon,
    "connector-metadata": Unplug,
    "query-data-source": Unplug,
    "register-app": LayoutGrid,
    "update-app": LayoutGrid,
    "read-skill": Layers,
    "list-skills": Layers,
    "resync-skills": Layers,
    "find-skills": Layers,
    "youtube-video-analysis": MonitorPlay,
    "ask-user": MessageCircleQuestion,
};

export const TOOL_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    get_content_url_tool: "Get File",
    semantic_search_tool: "Search Files",
    list_contents_tool: "List Files",
    "connector-metadata": "Inspect Data Source",
    "query-data-source": "Query Data Source",
    "list-sandbox-files": "List Sandbox Files",
    "read-file": "Read File",
    "write-file": "Write File",
    "edit-file": "Edit File",
    bash: "Run Command",
    grep: "Search Text",
    glob: "Find Files",
    "register-app": "Register App",
    "update-app": "Update App",
    "read-skill": "Read Skill",
    "list-skills": "List Skills",
    "resync-skills": "Resync Skills",
    "find-skills": "Find Skills",
    "youtube-video-analysis": "Analyze YouTube Video",
    "ask-user": "Ask User",
};

export function getToolDisplayName(name: string, backendDisplayName?: string): string {
    return TOOL_DISPLAY_NAME_OVERRIDES[name] ?? backendDisplayName ?? name;
}

export function getToolIcon(name: string): LucideIcon {
    return TOOL_ICON_MAP[name] ?? Wrench;
}

export function ToolIcon({ name, className }: { name: string; className?: string }) {
    const Icon = getToolIcon(name);
    return <Icon className={className} />;
}
