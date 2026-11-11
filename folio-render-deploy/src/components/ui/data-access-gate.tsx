import { useCallback, useEffect, useState } from "react";
import { DataAccessNotice } from "@/components/ui/data-access-notice";
import { DataAccessError, fetchData, getPlatformUrl, type DataAccess } from "@/lib/api";

// Guarantees the Connect/access notice appears on ANY platform data refusal (428/403),
// even if the generated app's own UI forgets to render it. Mounted outside <App/>.
export function DataAccessGate() {
  const [access, setAccess] = useState<DataAccess | null>(null);

  const check = useCallback(async () => {
    try {
      await fetchData();
      setAccess(null);
    } catch (err) {
      if (err instanceof DataAccessError) setAccess(err.access);
    }
  }, []);

  useEffect(() => {
    check();
    const onAccess = (e: Event) => setAccess(((e as CustomEvent).detail as DataAccess | null) ?? null);
    const onFocus = () => check();
    window.addEventListener("alo:data-access", onAccess);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("alo:data-access", onAccess);
      window.removeEventListener("focus", onFocus);
    };
  }, [check]);

  if (!access) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <DataAccessNotice access={access} platformUrl={getPlatformUrl()} onRetry={check} />
    </div>
  );
}
