import { useEffect } from "react";

interface ConnectEmbedProps {
  platformOrigin: string;
  src: string;
  fallbackHref: string;
  title: string;
  onConnected?: () => void;
}

export function ConnectEmbed({ platformOrigin, src, fallbackHref, title, onConnected }: ConnectEmbedProps) {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== platformOrigin || event.data?.type !== "alo:connection-updated") return;
      onConnected?.();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [platformOrigin, onConnected]);

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Providers open their consent screen as a popup from inside the frame. */}
      <iframe
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-[420px] w-full rounded-md border"
      />
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground underline underline-offset-2"
      >
        Open on the platform instead
      </a>
    </div>
  );
}
