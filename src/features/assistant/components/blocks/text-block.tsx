import { AnimatedResponse } from "./animated-response";

interface Props {
    content: string;
}

export function TextBlock({ content }: Props) {
    return (
        <div className="prose-island text-[14.5px] leading-relaxed text-foreground">
            <AnimatedResponse>{content}</AnimatedResponse>
        </div>
    );
}
