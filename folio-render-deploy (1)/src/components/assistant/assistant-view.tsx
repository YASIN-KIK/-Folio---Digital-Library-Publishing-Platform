import type { AssistantConfig } from "@/lib/assistant";
import { AssistantChat } from "./assistant-chat";
import { ChatHistorySidebar } from "@/features/assistant/components/chat-history";

export function AssistantView({ config }: { config: AssistantConfig }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <ChatHistorySidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border/40 px-4 py-3 text-sm font-medium">
          {config.title || "Assistant"}
        </div>
        <div className="mx-auto flex w-full max-w-[860px] min-h-0 flex-1 flex-col">
          <AssistantChat config={config} className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
}
