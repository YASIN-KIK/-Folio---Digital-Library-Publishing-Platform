import * as React from "react";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

export const markdownComponents: Components = {
    table: (props) => (
        <div className="my-3 max-w-full overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-[13px]" {...props} />
        </div>
    ),
    thead: (props) => <thead className="bg-muted/60" {...props} />,
    tbody: (props) => <tbody {...props} />,
    tr: (props) => <tr className="border-b border-border/60 last:border-0" {...props} />,
    th: (props) => (
        <th
            className="whitespace-nowrap px-3 py-1.5 text-left text-[12.5px] font-semibold text-foreground"
            {...props}
        />
    ),
    td: (props) => <td className="px-3 py-1.5 align-top" {...props} />,

    h1: (props) => <h1 className="mb-2 mt-4 text-lg font-semibold" {...props} />,
    h2: (props) => <h2 className="mb-2 mt-4 text-base font-semibold" {...props} />,
    h3: (props) => <h3 className="mb-1.5 mt-3 text-[15px] font-semibold" {...props} />,
    h4: (props) => <h4 className="mb-1.5 mt-3 text-sm font-semibold" {...props} />,

    p: (props) => <p className="my-2 leading-relaxed" {...props} />,
    ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
    ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
    li: (props) => <li className="leading-relaxed [&>p]:my-0" {...props} />,
    blockquote: (props) => (
        <blockquote
            className="my-3 border-l-4 border-border pl-3 italic text-muted-foreground"
            {...props}
        />
    ),
    hr: (props) => <hr className="my-4 border-border/70" {...props} />,
    a: (props) => (
        <a
            className="font-medium text-[#6798ff] underline underline-offset-2 hover:opacity-80"
            target="_blank"
            rel="noreferrer"
            {...props}
        />
    ),

    code: ({ className, children, ...props }) => {
        const fenced = /\blanguage-/.test(className ?? "");
        if (fenced) {
            return (
                <code className={cn("font-mono text-[12.5px]", className)} {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code
                className="rounded bg-foreground/[0.08] px-1 py-0.5 font-mono text-[0.9em]"
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: (props) => (
        <pre
            className="my-2 max-w-full overflow-x-auto whitespace-pre rounded-md border border-border/60 bg-foreground/[0.04] p-2.5 text-[12.5px]"
            {...props}
        />
    ),
};
