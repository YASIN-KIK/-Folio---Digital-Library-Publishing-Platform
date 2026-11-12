import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectEmbed } from "@/components/ui/connect-embed";
import { getPlatformUrl, type DataAccess } from "@/lib/api";

interface DataAccessNoticeProps {
  access: DataAccess;
  platformUrl?: string | null;
  onRetry?: () => void;
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// The template's connector-access states. Render this whenever a data fetch throws
// DataAccessError — do not word these states in generated code.
export function DataAccessNotice({ access, platformUrl, onRetry }: DataAccessNoticeProps) {
  const base = (platformUrl ?? getPlatformUrl())?.replace(/\/$/, "") || null;
  const platformOrigin = base ? originOf(base) : null;
  const connectUrl =
    platformOrigin && access.connection_id != null
      ? `${base}/connections?connect=${encodeURIComponent(String(access.connection_id))}`
      : null;

  let title = "This data isn't available to you";
  let body = "Ask the person who built this app.";
  let canConnect = false;

  if (access.code === "APP_VIEWER_IDENTITY_REQUIRED") {
    title = "Sign in to view this data";
    body = "This app shows live data from a connected source, which requires knowing who is looking. Open the app from the platform while signed in.";
  } else if (access.code === "SUBSCRIPTION_INACTIVE" || access.code === "QUOTA_EXCEEDED") {
    title = "Your plan can't load this data right now";
    body = "Your subscription is inactive or your quota is used up, so this app can't fetch data for you. Renew it on the platform, then refresh here.";
  } else if (access.code === "PER_USER_AUTH_REQUIRED" && access.reason === "needs_reauth") {
    title = "Reconnect your account";
    body = "Your connection to this data source has expired. Reconnect it below to keep using this app.";
    canConnect = true;
  } else if (access.code === "PER_USER_AUTH_REQUIRED") {
    title = "Connect your account";
    body = "This app reads its data source with your own account. Connect it once below to use this app.";
    canConnect = true;
  } else if (access.code === "NO_ACCESS" && access.reason === "wrong_role") {
    title = "Your role can't reach this data";
    body = "The role on your connected account doesn't have access to the data behind this app. Reconnect with a different role below, or ask the person who built it.";
    canConnect = true;
  } else if (access.code === "NO_ACCESS" && access.reason === "credential_rejected") {
    title = "This app's data source isn't available";
    body = "The data source behind this app rejected its credentials. Ask the person who built it.";
  } else if (access.code === "CONNECTION_NOT_DECLARED" || access.code === "NO_ACCESS") {
    title = "You don't have access to this data";
    body = "Your account can't reach the data source behind this app. Ask the person who built it.";
  }

  const embed = canConnect && connectUrl && platformOrigin;

  return (
    <Card className={`mx-auto my-8 w-full ${embed ? "max-w-lg" : "max-w-md"}`}>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="text-base font-semibold">{title}</div>
        <p className="text-sm text-muted-foreground">{body}</p>
        {embed && (
          <ConnectEmbed
            platformOrigin={platformOrigin}
            src={`${connectUrl}&embed=1`}
            fallbackHref={connectUrl}
            title={`${title} — connect your data source`}
            onConnected={onRetry}
          />
        )}
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
