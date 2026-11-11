import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { markdownComponents } from "@/components/ai-elements/markdown-components";

interface Props {
    children: string;
    className?: string;
}

export const AnimatedResponse = memo(
    ({ children, className }: Props) => (
        <div
            className={cn(
                "size-full min-w-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                className
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {children}
            </ReactMarkdown>
        </div>
    ),
    (prev, next) => prev.children === next.children
);

AnimatedResponse.displayName = "AnimatedResponse";
