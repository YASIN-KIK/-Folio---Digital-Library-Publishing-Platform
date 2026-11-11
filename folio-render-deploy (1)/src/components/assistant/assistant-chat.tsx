import type { AssistantConfig } from "@/lib/assistant";
import { ChatSurface } from "@/features/assistant/components/chat-surface";
import { AssistantErrorBoundary } from "@/features/assistant/components/error-boundary";
import { cn } from "@/lib/utils";

export function AssistantChat({
    config,
    className,
}: {
    config: AssistantConfig;
    className?: string;
}) {
    return (
        <AssistantErrorBoundary>
            <ChatSurface config={config} className={cn("h-full min-h-0", className)} />
        </AssistantErrorBoundary>
    );
}
