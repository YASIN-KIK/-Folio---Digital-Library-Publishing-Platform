import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantConfig } from "@/lib/assistant";
import { AssistantChat } from "./assistant-chat";
import { ChatHistoryDropdown } from "@/features/assistant/components/chat-history";

export function AssistantWidget({ config }: { config: AssistantConfig }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <div
        className={cn(
          "flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl transition-all duration-200 origin-bottom-right",
          open
            ? "h-[min(560px,calc(100vh-6rem))] opacity-100 scale-100"
            : "pointer-events-none h-0 opacity-0 scale-95",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#6798ff]/15 text-[#6798ff]">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            {config.title || "Assistant"}
          </div>
          <div className="flex items-center gap-0.5">
            <ChatHistoryDropdown />
            <button
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {open && <AssistantChat config={config} className="flex-1 min-h-0" />}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-12 w-12 place-items-center rounded-full bg-[#6798ff] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
