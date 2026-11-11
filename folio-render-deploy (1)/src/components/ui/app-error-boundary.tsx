import * as React from "react";
import { getLastAccess } from "@/lib/api";
import { DataAccessNotice } from "@/components/ui/data-access-notice";

interface State {
  hasError: boolean;
}

// Last-resort backstop: if any generated code crashes on a data-access refusal
// (e.g. rendering null rows after a 428), show the Connect CTA instead of a blank
// screen. Error boundaries must be class components.
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App render error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const access = getLastAccess();
    if (access) {
      return <DataAccessNotice access={access} onRetry={() => window.location.reload()} />;
    }
    return (
      <div className="mx-auto my-8 max-w-md rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Something went wrong loading this app.{" "}
        <button className="underline" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
