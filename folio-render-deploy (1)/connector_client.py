"""Server-side data access for the dashboard backend.

Reuses the shared platform clients (which read ALO_API_KEY / ALO_API_BASE_URL /
ALO_SPACE_SLUG from the sandbox env — no credentials are ever stored in this app).
The app-specific target lives in connector_config.json:
  - ``datasets``: SQL connector datasets [{key, label, query}, ...] (one connection_id)
  - ``mcp``: {"datasets": [{key, label, connection_id, tool_name, arguments}, ...]}
Each entry returns compact, dashboard-ready rows cached per dataset key. Both SQL
and MCP datasets are re-fetched on /api/sync, so the dashboard refreshes live.
"""
from __future__ import annotations

import csv
import io
import json
import os
import re
import sys
import tempfile
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

# Middleware sets this per request so every connector/MCP call forwards the viewer
# assertion automatically — a custom route can't forget it (forgetting = 401).
_request_app_identity: ContextVar[str | None] = ContextVar("alo_request_app_identity", default=None)


def set_request_app_identity(identity: str | None) -> None:
    _request_app_identity.set(identity)


def get_request_app_identity() -> str | None:
    return _request_app_identity.get()

sys.path.insert(0, "/home/user/skills/alo-api-connectors/scripts")
sys.path.insert(0, "/home/user/skills/alo-api-mcp/scripts")

BASE_DIR = Path(__file__).resolve().parent
_DEFAULT_QUERY_TIMEOUT_SECONDS = 60
CONFIG_PATH = BASE_DIR / "connector_config.json"
_excel_loader: Callable[[list[dict[str, Any]]], dict[str, list[dict[str, Any]]]] | None = None


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, default=str))


def load_connector_config() -> dict[str, Any]:
    cfg = _read_json(CONFIG_PATH, {})
    return cfg if isinstance(cfg, dict) else {}


def get_datasets_config() -> list[dict[str, Any]]:
    datasets = load_connector_config().get("datasets")
    return datasets if isinstance(datasets, list) else []


def get_mcp_datasets() -> list[dict[str, Any]]:
    """MCP-backed dataset specs [{key, label, connection_id, tool_name, arguments}, ...]."""
    mcp = load_connector_config().get("mcp")
    datasets = (mcp or {}).get("datasets") if isinstance(mcp, dict) else None
    return datasets if isinstance(datasets, list) else []


def public_config(config: dict[str, Any] | None = None) -> dict[str, Any]:
    config = dict(config or load_connector_config())
    datasets = config.get("datasets") if isinstance(config.get("datasets"), list) else []
    mcp = config.get("mcp") if isinstance(config.get("mcp"), dict) else {}
    mcp_datasets = mcp.get("datasets") if isinstance(mcp.get("datasets"), list) else []
    source = config.get("source") or {}
    listed = [
        {"key": d.get("key"), "label": d.get("label") or d.get("key"), "source": "sql"}
        for d in datasets
    ] + [
        {"key": d.get("key"), "label": d.get("label") or d.get("key"), "source": "mcp"}
        for d in mcp_datasets
    ]
    return {
        "configured": bool(
            ((config.get("connection_id") or source.get("kind") == "excel") and datasets)
            or mcp_datasets
        ),
        "connection_id": config.get("connection_id", ""),
        "source": source,
        "datasets": listed,
    }


def get_source_config() -> dict[str, Any]:
    """Return the full config including per-dataset queries and source block (not for public API)."""
    cfg = load_connector_config()
    return cfg


def update_dataset_query(key: str, query: Any) -> None:
    """Rewrite a single dataset's SQL query in connector_config.json. SQL only."""
    cfg = load_connector_config()
    source_kind = (cfg.get("source") or {}).get("kind", "sql")
    if source_kind != "sql":
        raise ValueError("Dataset queries are read-only for non-SQL sources.")
    datasets = cfg.get("datasets") if isinstance(cfg.get("datasets"), list) else []
    found = False
    for d in datasets:
        if d.get("key") == key:
            d["query"] = _normalize_query(query)
            found = True
            break
    if not found:
        raise KeyError(f"Dataset '{key}' not found.")
    _write_json(CONFIG_PATH, cfg)


def _normalize_query(query: Any) -> dict[str, Any]:
    """Canonicalize a dataset query into the SQL connector envelope ``{"sql": ...}``.

    Accepts a raw SQL string, the canonical ``{"sql": ...}``, or legacy wrappers
    (``{"operation": "execute_query", "query": "<sql>"}`` / ``{"query": "<sql>"}``)
    and always emits ``{"sql": "<sql>"}`` so the panel round-trip can't double-wrap
    the query. Real action-connector dicts (no string SQL) pass through unchanged.
    """
    if isinstance(query, str):
        return {"sql": query}
    if isinstance(query, dict):
        if isinstance(query.get("sql"), str):
            return query
        if isinstance(query.get("query"), str):
            return {"sql": query["query"]}
    return query


def set_connector_target(
    connection_id: int | str,
    datasets: list[dict[str, Any]],
    *,
    connection_name: str | None = None,
    connector_key: str | None = None,
) -> dict[str, Any]:
    """Bake the connection id + named dataset queries into server-side config.

    ``datasets`` is a list of {key, label, query}. Each query should be an
    aggregate returning compact, dashboard-ready rows (KPIs, a time series, a
    category breakdown, a bounded detail table). No credentials are accepted or
    stored here — the running app reads them from env. (Build time.)
    """
    if isinstance(connection_id, str) and connection_id.isdigit():
        connection_id = int(connection_id)
    cleaned = dict(load_connector_config())
    cleaned["connection_id"] = connection_id
    cleaned["source"] = {
        "kind": "sql",
        "connection_id": connection_id,
        **({"connection_name": connection_name} if connection_name else {}),
        **({"connector_key": connector_key} if connector_key else {}),
    }
    normalized = []
    for d in datasets or []:
        key = (d.get("key") or "").strip()
        if not key:
            continue
        normalized.append({"key": key, "label": d.get("label") or key, "query": _normalize_query(d.get("query"))})
    cleaned["datasets"] = normalized
    _write_json(CONFIG_PATH, cleaned)
    return public_config(cleaned)


def add_connector_dataset(
    connection_id: int | str,
    dataset: dict[str, Any],
    *,
    connection_name: str | None = None,
    connector_key: str | None = None,
) -> dict[str, Any]:
    """Upsert ONE SQL connector dataset WITHOUT clobbering already-baked datasets.

    Use this to bake a dashboard one slice at a time: add a view's dataset, sync, build
    that view, repeat. The dataset is matched by ``key`` (replaced) or appended. Records
    the connection id/source like ``set_connector_target`` but leaves other datasets
    intact. (``set_connector_target`` is the bulk path and replaces the whole list.)
    """
    if isinstance(connection_id, str) and connection_id.isdigit():
        connection_id = int(connection_id)
    key = (dataset.get("key") or "").strip()
    if not key:
        raise ValueError("dataset must include a non-empty 'key'")
    cfg = dict(load_connector_config())
    cfg["connection_id"] = connection_id
    source = cfg.get("source") if isinstance(cfg.get("source"), dict) else {}
    source = {**source, "kind": "sql", "connection_id": connection_id}
    if connection_name:
        source["connection_name"] = connection_name
    if connector_key:
        source["connector_key"] = connector_key
    cfg["source"] = source
    entry = {"key": key, "label": dataset.get("label") or key, "query": _normalize_query(dataset.get("query"))}
    datasets = cfg.get("datasets") if isinstance(cfg.get("datasets"), list) else []
    datasets = [d for d in datasets if d.get("key") != key]
    datasets.append(entry)
    cfg["datasets"] = datasets
    _write_json(CONFIG_PATH, cfg)
    return public_config(cfg)


def set_excel_source(
    files: list[dict[str, Any]],
    *,
    datasets: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Record an Excel-backed source; the rows are parsed per viewer on sync and first load.

    ``files`` is a list of {name, path} dicts for the uploaded .xlsx files (paths inside
    the app dir). ``datasets`` is an optional list of {key, label} limiting which loader
    keys are cached. Parsing is ``register_excel_loader(fn)`` in main.py, else every sheet.
    """
    cleaned = dict(load_connector_config())
    cleaned.pop("connection_id", None)
    cleaned["source"] = {"kind": "excel", "files": [{"name": f.get("name", ""), "path": f.get("path", "")} for f in files]}
    if datasets is not None:
        cleaned["datasets"] = [{"key": d.get("key", ""), "label": d.get("label") or d.get("key", "")} for d in datasets]
    _write_json(CONFIG_PATH, cleaned)
    return public_config(cleaned)


def set_mcp_target(
    datasets: list[dict[str, Any]],
    *,
    connection_id: int | str | None = None,
) -> dict[str, Any]:
    """Bake MCP-backed named datasets into server-side config (re-run on /api/sync).

    ``datasets`` is a list of {key, label, tool_name, arguments, connection_id?}. Each
    entry calls one MCP tool; its result is cached under ``key`` (source="mcp"). Pass a
    top-level ``connection_id`` as the default when entries omit their own. Stored in a
    separate ``mcp`` block so it never clobbers SQL ``datasets`` — a dashboard can mix
    SQL and MCP datasets. (Build time.)
    """
    if isinstance(connection_id, str) and connection_id.isdigit():
        connection_id = int(connection_id)
    cleaned = dict(load_connector_config())
    normalized = []
    for d in datasets or []:
        key = (d.get("key") or "").strip()
        tool = (d.get("tool_name") or "").strip()
        if not key or not tool:
            continue
        cid = d.get("connection_id", connection_id)
        if isinstance(cid, str) and cid.isdigit():
            cid = int(cid)
        normalized.append({
            "key": key,
            "label": d.get("label") or key,
            "connection_id": cid,
            "tool_name": tool,
            "arguments": d.get("arguments") or {},
        })
    cleaned["mcp"] = {"datasets": normalized}
    if connection_id is not None:
        cleaned["mcp"]["connection_id"] = connection_id
    _write_json(CONFIG_PATH, cleaned)
    return public_config(cleaned)


def add_mcp_dataset(
    dataset: dict[str, Any],
    *,
    connection_id: int | str | None = None,
) -> dict[str, Any]:
    """Upsert ONE MCP dataset WITHOUT clobbering already-baked MCP datasets (slice-by-slice).

    ``dataset`` is {key, label, tool_name, arguments, connection_id?}. Matched by ``key``
    (replaced) or appended. The MCP analog of ``add_connector_dataset``; ``set_mcp_target``
    is the bulk path and replaces the whole MCP list.
    """
    if isinstance(connection_id, str) and connection_id.isdigit():
        connection_id = int(connection_id)
    key = (dataset.get("key") or "").strip()
    tool = (dataset.get("tool_name") or "").strip()
    if not key:
        raise ValueError("dataset must include a non-empty 'key'")
    if not tool:
        raise ValueError("dataset must include a non-empty 'tool_name'")
    cid = dataset.get("connection_id", connection_id)
    if isinstance(cid, str) and cid.isdigit():
        cid = int(cid)
    cfg = dict(load_connector_config())
    mcp = cfg.get("mcp") if isinstance(cfg.get("mcp"), dict) else {}
    datasets = mcp.get("datasets") if isinstance(mcp.get("datasets"), list) else []
    entry = {
        "key": key,
        "label": dataset.get("label") or key,
        "connection_id": cid,
        "tool_name": tool,
        "arguments": dataset.get("arguments") or {},
    }
    datasets = [d for d in datasets if d.get("key") != key]
    datasets.append(entry)
    mcp = {**mcp, "datasets": datasets}
    if connection_id is not None:
        mcp["connection_id"] = connection_id
    cfg["mcp"] = mcp
    _write_json(CONFIG_PATH, cfg)
    return public_config(cfg)


def execute_connector_query(
    connection_id: int | str,
    query: Any,
    timeout_seconds: int = _DEFAULT_QUERY_TIMEOUT_SECONDS,
    app_identity: str | None = None,
) -> Any:
    """Run a single connector query via the shared client (env-based creds).

    ``app_identity`` is the gateway viewer assertion from the incoming request:
    the platform resolves credentials as that person, never as the app's owner.
    """
    if not connection_id:
        raise ValueError("connection_id is required (set it via set_connector_target)")
    if not os.environ.get("ALO_API_KEY"):
        raise RuntimeError(
            "ALO_API_KEY is not available in this app's environment yet. It is provisioned "
            "automatically when the app is registered — restart the dashboard server (or ask "
            "the assistant to redeploy) so the key is loaded, then retry."
        )
    from alo_connectors_client import AloConnectorsClient

    if app_identity is None:
        app_identity = _request_app_identity.get()
    client = AloConnectorsClient(timeout=timeout_seconds, app_identity=app_identity)
    return client.query(connection_id, {"query": _normalize_query(query), "timeout_seconds": timeout_seconds})


def execute_mcp_call(
    connection_id: int | str,
    tool_name: str,
    arguments: dict[str, Any] | None = None,
    timeout_seconds: int = _DEFAULT_QUERY_TIMEOUT_SECONDS,
    app_identity: str | None = None,
) -> Any:
    """Call one MCP tool via the platform proxy (env-based creds), like execute_connector_query."""
    if not connection_id:
        raise ValueError("connection_id is required for an MCP dataset")
    if not tool_name:
        raise ValueError("tool_name is required for an MCP dataset")
    if not os.environ.get("ALO_API_KEY"):
        raise RuntimeError(
            "ALO_API_KEY is not available in this app's environment yet. It is provisioned "
            "automatically when the app is registered — restart the dashboard server (or ask "
            "the assistant to redeploy) so the key is loaded, then retry."
        )
    from alo_mcp_client import AloMcpClient

    if app_identity is None:
        app_identity = _request_app_identity.get()
    client = AloMcpClient(timeout=timeout_seconds, app_identity=app_identity)
    return client.call_tool(connection_id, tool_name, arguments or {})


def query_rows(
    connection_id: int | str,
    query: Any,
    timeout_seconds: int = _DEFAULT_QUERY_TIMEOUT_SECONDS,
    app_identity: str | None = None,
) -> list[dict[str, Any]]:
    """Connector query result as display rows; use for anything an app shows."""
    return normalize_connector_rows(
        execute_connector_query(connection_id, query, timeout_seconds, app_identity)
    )


def mcp_rows(
    connection_id: int | str,
    tool_name: str,
    arguments: dict[str, Any] | None = None,
    timeout_seconds: int = _DEFAULT_QUERY_TIMEOUT_SECONDS,
    app_identity: str | None = None,
) -> list[dict[str, Any]]:
    """MCP tool result as display rows; use for anything an app shows."""
    return normalize_connector_rows(
        execute_mcp_call(connection_id, tool_name, arguments, timeout_seconds, app_identity)
    )


def is_excel_source() -> bool:
    return (load_connector_config().get("source") or {}).get("kind") == "excel"


def register_excel_loader(
    fn: Callable[[list[dict[str, Any]]], dict[str, list[dict[str, Any]]]],
) -> None:
    """Register ``fn(files) -> {dataset_key: rows}`` that parses the excel source's files."""
    global _excel_loader
    _excel_loader = fn


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _read_every_sheet(files: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    try:
        import pandas as pd
        import openpyxl  # noqa: F401
    except ImportError as exc:
        raise RuntimeError("Reading excel files needs the pandas and openpyxl packages.") from exc
    out: dict[str, list[dict[str, Any]]] = {}
    for f in files:
        path = BASE_DIR / f.get("path", "")
        for sheet, df in pd.read_excel(path, sheet_name=None, engine="openpyxl").items():
            # JSON responses reject NaN, so empty cells must become None.
            out[_slug(str(sheet))] = df.astype(object).where(df.notna(), None).to_dict("records")
    return out


def run_excel_loader(files: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    return (_excel_loader or _read_every_sheet)(files)


def data_access_error(exc: Exception) -> dict[str, Any] | None:
    """The platform's structured access refusal behind ``exc`` (a coded JSON body),
    or None — what DataAccessNotice renders instead of an opaque error string."""
    response = getattr(exc, "response", None)
    if response is None:
        return None
    try:
        body = response.json()
    except Exception:
        return None
    if not isinstance(body, dict) or not body.get("code"):
        return None
    return {
        "status": response.status_code,
        "code": body.get("code"),
        "reason": body.get("reason"),
        "detail": body.get("detail"),
        "connection_id": body.get("connection_id"),
        "connector_key": body.get("connector_key"),
    }


def _rows_from_csv_text(text: str) -> list[dict[str, Any]]:
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader if any((v or "").strip() for v in row.values())]


def normalize_connector_rows(result: Any) -> list[dict[str, Any]]:
    if isinstance(result, list):
        if len(result) == 1 and isinstance(result[0], dict):
            for value in result[0].values():
                if isinstance(value, list):
                    return normalize_connector_rows(value)
            # The Google Sheets connector returns a whole sheet as [{"csv": ..., "row_count": N}].
            if isinstance(result[0].get("csv"), str):
                parsed = _rows_from_csv_text(result[0]["csv"])
                if parsed:
                    return parsed
        return [row if isinstance(row, dict) else {"value": row} for row in result]
    if isinstance(result, dict):
        for key in ("rows", "data", "result", "results", "items", "records"):
            value = result.get(key)
            if isinstance(value, list):
                return normalize_connector_rows(value)
            if isinstance(value, dict):
                nested = normalize_connector_rows(value)
                if nested:
                    return nested
        if len(result) == 1:
            only_value = next(iter(result.values()))
            if isinstance(only_value, list):
                return normalize_connector_rows(only_value)
        return [result]
    return []


def viewer_cache_key(app_identity: str | None) -> str | None:
    """A stable per-person cache key from the assertion's email claim.

    Display-scoping only — the platform verifies the signature; this just keeps
    one viewer's fetched rows out of another viewer's reads.
    """
    if not app_identity:
        return None
    try:
        import base64
        import hashlib

        encoded = app_identity.split(".", 1)[0]
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        email = str(payload.get("email") or "")
    except Exception:
        email = ""
    return hashlib.sha256(email.encode()).hexdigest()[:16] if email else None


def _viewer_cache_dir() -> Path:
    # Per-viewer caches go to a guaranteed-writable temp dir, never the app dir
    # (which may be read-only or mid-rewrite); they're ephemeral and bundle-excluded.
    cache = Path(tempfile.gettempdir()) / "alo-app-cache" / BASE_DIR.name
    cache.mkdir(parents=True, exist_ok=True)
    return cache


def _data_path(viewer: str) -> Path:
    return _viewer_cache_dir() / f"data.viewer-{viewer}.json"


def load_datasets(app_identity: str | None = None) -> dict[str, Any]:
    """The caller's own cache; a caller with no viewer identity has none."""
    viewer = viewer_cache_key(app_identity)
    if not viewer:
        return {}
    own = _read_json(_data_path(viewer), {})
    return own if isinstance(own, dict) else {}


def load_dataset_rows(key: str, app_identity: str | None = None) -> list[dict[str, Any]]:
    entry = load_datasets(app_identity).get(key) or {}
    rows = entry.get("rows") if isinstance(entry, dict) else None
    return rows if isinstance(rows, list) else []


def cache_dataset(
    key: str,
    rows: list[dict[str, Any]],
    source: str = "connector",
    app_identity: str | None = None,
) -> dict[str, Any]:
    viewer = viewer_cache_key(app_identity)
    entry = {
        "rows": rows,
        "row_count": len(rows),
        "source": source,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    status = {"key": key, "row_count": entry["row_count"], "source": source, "fetched_at": entry["fetched_at"]}
    if viewer is None:
        return status
    path = _data_path(viewer)
    data = _read_json(path, {})
    data = data if isinstance(data, dict) else {}
    data[key] = entry
    _write_json(path, data)
    return status


def cache_status(app_identity: str | None = None) -> dict[str, Any]:
    viewer = viewer_cache_key(app_identity)
    data = load_datasets(app_identity)
    datasets = {}
    for key, entry in data.items():
        if not isinstance(entry, dict):
            continue
        datasets[key] = {
            "row_count": entry.get("row_count", len(entry.get("rows") or [])),
            "source": entry.get("source"),
            "fetched_at": entry.get("fetched_at"),
        }
    return {"exists": bool(viewer) and _data_path(viewer).exists(), "datasets": datasets}
