import { apiUrl } from "./base";

export type Row = Record<string, unknown>;

export interface Dataset {
  rows: Row[];
  row_count?: number;
  source?: string;
  fetched_at?: string | null;
}

export interface SqlSource {
  kind: "sql";
  connection_id: string | number;
  connection_name?: string;
  connector_key?: string;
}

export interface ExcelSource {
  kind: "excel";
  files: { name: string; path: string }[];
}

export type DataSource = SqlSource | ExcelSource;

export interface ConnectorInfo {
  configured: boolean;
  connection_id: string | number;
  source?: DataSource;
  datasets: { key: string; label: string }[];
}

export interface SourceConfig {
  connection_id?: string | number;
  source?: DataSource;
  datasets?: Array<{ key: string; label: string; query?: string | Record<string, unknown> }>;
}

export interface DataResponse {
  datasets: Record<string, Dataset>;
  cache: { exists?: boolean; datasets?: Record<string, { row_count: number; source: string; fetched_at: string | null }> };
  connector: ConnectorInfo;
  viewer?: { signed_in: boolean };
  platform?: { url: string | null };
}

/** The platform's structured refusal of a connector read for THIS viewer. */
export interface DataAccess {
  status: number;
  code: "APP_VIEWER_IDENTITY_REQUIRED" | "PER_USER_AUTH_REQUIRED" | "CONNECTION_NOT_DECLARED" | "NO_ACCESS" | string;
  reason?: "not_connected" | "needs_reauth" | "wrong_role" | "credential_rejected" | "not_visible" | "capability" | string | null;
  detail?: string | null;
  connection_id?: number | null;
  connector_key?: string | null;
}

let _lastAccess: DataAccess | null = null;
export function getLastAccess(): DataAccess | null {
  return _lastAccess;
}

// One channel for every data-access outcome so the root DataAccessGate can show the
// Connect notice on a refusal regardless of which component triggered the call.
function emitAccess(access: DataAccess | null): void {
  _lastAccess = access;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("alo:data-access", { detail: access }));
  }
}

export class DataAccessError extends Error {
  access: DataAccess;
  constructor(access: DataAccess) {
    super(access.detail || access.code);
    this.access = access;
    emitAccess(access);
  }
}

// Captured so DataAccessNotice can embed the Connect panel if generated code omits the prop.
let _platformUrl: string | null = null;
export function getPlatformUrl(): string | null {
  return _platformUrl;
}

export async function fetchData(): Promise<DataResponse> {
  const res = await fetch(apiUrl("api/data"));
  const payload = await res.json().catch(() => null);
  const url = payload?.platform?.url;
  if (typeof url === "string" && url) _platformUrl = url;
  if (!res.ok) {
    if (payload?.access) throw new DataAccessError(payload.access);
    throw new Error(`/api/data failed: ${res.status}`);
  }
  emitAccess(null);
  return payload;
}

export async function syncData(): Promise<{
  synced: unknown[];
  errors: { key: string; error: string; access?: DataAccess | null }[];
}> {
  const res = await fetch(apiUrl("api/sync"), { method: "POST" });
  const payload = await res.json();
  if (!res.ok) {
    if (payload?.access) throw new DataAccessError(payload.access);
    throw new Error(payload?.detail || "Sync failed");
  }
  return payload;
}

export interface BuildInfo {
  build: number;
  ready: boolean;
  keyReady?: boolean;
}

export async function fetchBuildVersion(): Promise<BuildInfo> {
  const res = await fetch(apiUrl("api/build"), { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/build failed: ${res.status}`);
  return res.json();
}

export function rowsOf(data: DataResponse | null, key: string): Row[] {
  const ds = data?.datasets?.[key];
  return ds && Array.isArray(ds.rows) ? ds.rows : [];
}

export function latestSync(data: DataResponse | null): { fetchedAt: string | null; source: string | null } {
  let fetchedAt: string | null = null;
  let source: string | null = null;
  const datasets = data?.datasets ?? {};
  for (const ds of Object.values(datasets)) {
    if (ds?.fetched_at && (!fetchedAt || ds.fetched_at > fetchedAt)) fetchedAt = ds.fetched_at;
    if (ds?.source) source = ds.source;
  }
  return { fetchedAt, source };
}

export async function fetchConfig(): Promise<SourceConfig> {
  const res = await fetch(apiUrl("api/config"));
  if (!res.ok) throw new Error(`/api/config failed: ${res.status}`);
  return res.json();
}

export async function updateDatasetQuery(
  key: string,
  query: string
): Promise<{ updated: string; result: unknown }> {
  const res = await fetch(apiUrl(`api/config/datasets/${encodeURIComponent(key)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.detail || "Update failed");
  return payload;
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function keysOf(rows: Row[]): string[] {
  return rows[0] ? Object.keys(rows[0]) : [];
}

export function numericKeys(rows: Row[]): string[] {
  return keysOf(rows).filter((k) => rows.some((r) => isNumber(r[k])));
}

export function pickKey(rows: Row[], preferred: string[], fallback?: string): string | undefined {
  const ks = keysOf(rows);
  for (const p of preferred) if (ks.includes(p)) return p;
  return fallback ?? ks[0];
}
