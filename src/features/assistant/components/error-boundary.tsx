import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: React.ReactNode;
}
interface State {
    error: Error | null;
}

export class AssistantErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[assistant] render error:", error, info.componentStack);
    }

    private reset = () => this.setState({ error: null });

    render() {
        if (this.state.error) {
            return (
                <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-foreground">
                        The assistant hit an error
                    </div>
                    <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border/60 bg-foreground/[0.04] px-3 py-2 text-left text-[11.5px] text-muted-foreground">
                        {this.state.error.message || String(this.state.error)}
                    </pre>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={this.reset}
                            className="rounded-md border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-foreground/[0.04] hover:text-foreground"
                        >
                            Dismiss
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-foreground px-3 py-1.5 text-[12px] text-background transition-opacity hover:opacity-90"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
