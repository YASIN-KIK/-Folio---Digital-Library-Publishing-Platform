"""Base-app layer: embedded chat assistant backed by a platform agent.

Part of the reusable platform-integration layer (alongside connector_client.py):
it has NO dashboard-specific dependencies so it can be lifted into a shared
base-app template later. Reuses the shared agents client, which reads
ALO_API_KEY / ALO_API_BASE_URL / ALO_SPACE_SLUG from the sandbox env — no
credentials are stored in this app, and the key never reaches the browser.

The app-specific assistant target lives in assistant_config.json:
  {
    "enabled": true,
    "agent_id": 12,                 # null → the platform default agent ("alo")
    "title": "Assistant",
    "placement": "widget",          # "widget" | "page" | "both"
    "greeting": "Hi! ...",
    "starters": ["...", "..."],
    "runtime": {                     # optional per-run overrides for the agent
      "connection_ids": [1],         # SQL connectors the assistant may use
      "mcp_connection_ids": [5],     # MCP servers the assistant may use
      "model_slug": "gpt-5.5",       # model to run on (stable name); defaults to the build chat's model
      "system_prompt": null
    }
  }
Conversations are saved on the platform but hidden from the platform chat list
(source="app").
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Iterator

sys.path.insert(0, "/home/user/skills/alo-api-agents/scripts")

BASE_DIR = Path(__file__).resolve().parent
ASSISTANT_CONFIG_PATH = BASE_DIR / "assistant_config.json"

_RUNTIME_KEYS = (
    "system_prompt",
    "tool_names",
    "skill_slugs",
    "skill_set_slugs",
    "model_config_id",
    "model_slug",
    "connection_ids",
    "mcp_connection_ids",
    "file_scope",
)


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, default=str))


def load_assistant_config() -> dict[str, Any]:
    cfg = _read_json(ASSISTANT_CONFIG_PATH, {})
    return cfg if isinstance(cfg, dict) else {}


def get_assistant_config() -> dict[str, Any]:
    """Full config including agent_id + runtime ids (server-side use only)."""
    return load_assistant_config()


def public_assistant_config() -> dict[str, Any]:
    """Browser-safe subset — no agent_id, no connector/MCP ids, no key."""
    cfg = load_assistant_config()
    return {
        "enabled": bool(cfg.get("enabled")),
        "title": cfg.get("title") or "Assistant",
        "placement": cfg.get("placement") or "widget",
        "greeting": cfg.get("greeting") or "",
        "starters": cfg.get("starters") if isinstance(cfg.get("starters"), list) else [],
    }


def set_assistant_target(
    *,
    agent_id: int | None = None,
    connection_ids: list[int] | None = None,
    mcp_connection_ids: list[int] | None = None,
    model: str | None = None,
    model_config_id: int | None = None,
    system_prompt: str | None = None,
    title: str = "Assistant",
    placement: str = "widget",
    greeting: str | None = None,
    starters: list[str] | None = None,
    enabled: bool = True,
) -> dict[str, Any]:
    """Bake the embedded assistant into server-side config. (Build time.)

    ``agent_id=None`` uses the platform default agent ("alo"). ``placement`` is
    one of "widget" (floating bottom-right), "page" (a full "Assistant" tab), or
    "both". ``connection_ids`` / ``mcp_connection_ids`` give the assistant the
    same data sources the dashboard uses, so it can answer questions about the
    app's data. No credentials are accepted or stored here — the running app
    reads them from env.

    The assistant runs on a model resolved server-side by stable slug. When
    neither ``model`` nor ``model_config_id`` is given it defaults to the model
    of the chat this app is built in (env ``ALO_MODEL_SLUG``) — so the assistant
    uses the SAME model you're using, rather than the agent falling back to the
    space-default model at run time (which may be weaker and produce runaway
    queries). ``model`` is a portable slug (e.g. ``"gpt-5.5"``); pass a numeric
    ``model_config_id`` only to pin a specific per-instance id (it wins).
    """
    if placement not in {"widget", "page", "both"}:
        raise ValueError('placement must be "widget", "page", or "both"')
    if model is None and model_config_id is None:
        model = _default_model_slug()
    runtime: dict[str, Any] = {}
    if connection_ids:
        runtime["connection_ids"] = [int(c) for c in connection_ids]
    if mcp_connection_ids:
        runtime["mcp_connection_ids"] = [int(c) for c in mcp_connection_ids]
    if model_config_id is not None:
        runtime["model_config_id"] = int(model_config_id)
    elif model:
        runtime["model_slug"] = str(model)
    if system_prompt:
        runtime["system_prompt"] = system_prompt
    cfg = {
        "enabled": bool(enabled),
        "agent_id": int(agent_id) if agent_id is not None else None,
        "title": title or "Assistant",
        "placement": placement,
        "greeting": greeting or "",
        "starters": list(starters) if starters else [],
        "runtime": runtime,
    }
    _write_json(ASSISTANT_CONFIG_PATH, cfg)
    return public_assistant_config()


def disable_assistant() -> dict[str, Any]:
    """Turn the assistant off without losing its baked target."""
    cfg = load_assistant_config()
    cfg["enabled"] = False
    _write_json(ASSISTANT_CONFIG_PATH, cfg)
    return public_assistant_config()


def _default_model_slug() -> str | None:
    """Model slug of the chat this app is being built in (env ``ALO_MODEL_SLUG``).

    The platform injects it into the build sandbox so an embedded assistant can
    default to the SAME model you're using, pinned by stable name (resolved to
    the right id server-side at run time). ``None`` if the var is absent.
    """
    return (os.environ.get("ALO_MODEL_SLUG") or "").strip() or None


SANDBOX_SURFACE_TOOL_NAMES = (
    "execute-code",
    "write-file",
    "edit-file",
    "bash",
    "grep",
    "glob",
)


def _runtime_config(cfg: dict[str, Any]) -> dict[str, Any] | None:
    runtime = cfg.get("runtime") if isinstance(cfg.get("runtime"), dict) else {}
    rc = {k: runtime[k] for k in _RUNTIME_KEYS if runtime.get(k) not in (None, [], "")}
    return rc or None


def stream_assistant(
    messages: str | list[dict],
    thread_id: str | None = None,
    *,
    runtime_overrides: dict | None = None,
    mode: str = "act",
    attachments: list[dict] | None = None,
) -> Iterator[dict]:
    """Run the baked assistant and yield normalized events (text/tool/error/…).

    ``runtime_overrides`` are browser-provided selections (tool_names, skill_slugs,
    model_slug, connection_ids, mcp_connection_ids, prompt_id, …) that merge on top
    of the baked config. Baked keys that the browser doesn't mention are kept.
    ``attachments`` are ``upload_assistant_file()`` results (images/PDFs/docs) to
    send to the model with the last user turn — vision/file input goes through the
    platform, never a provider key. ``mode`` is ``"act"`` (default) or ``"plan"``.

    Raises ``RuntimeError`` if the assistant is disabled or ``ALO_API_KEY`` is
    not yet in the environment.
    """
    cfg = load_assistant_config()
    if not cfg.get("enabled"):
        raise RuntimeError("The assistant is not enabled for this app.")
    if not os.environ.get("ALO_API_KEY"):
        raise RuntimeError(
            "ALO_API_KEY is not available in this app's environment yet. It is provisioned "
            "automatically when the app is registered — restart the server (or ask the "
            "assistant to redeploy) so the key is loaded, then retry."
        )
    from alo_agents_client import AloAgentsClient

    baked = _runtime_config(cfg) or {}
    runtime = {**baked, **(runtime_overrides or {})}
    _tools = list(runtime.get("tool_names") or [])
    _tools += [name for name in SANDBOX_SURFACE_TOOL_NAMES if name not in _tools]
    runtime["tool_names"] = _tools
    from connector_client import get_request_app_identity

    client = AloAgentsClient(app_identity=get_request_app_identity())
    yield from client.stream_chat(
        messages,
        agent_id=cfg.get("agent_id"),
        runtime_config=runtime or None,
        thread_id=thread_id,
        mode=mode,
        source="app",
        source_ref=_app_source_ref(),
        attachments=attachments,
        client_surface="embedded-assistant",
    )


def _app_source_ref() -> str:
    """Identifier the platform stores on app-originated chats (chat.source_ref).

    The platform injects ALO_APP_ID into this app's env at registration so chats
    can be traced back to the specific app that created them. Falls back to the
    app slug, then a generic tag for apps registered before ALO_APP_ID existed.
    """
    return (
        (os.environ.get("ALO_APP_ID") or "").strip()
        or (os.environ.get("ALO_APP_SLUG") or "").strip()
        or "dashboard-app"
    )


def upload_assistant_file(
    filename: str,
    content: bytes,
    mime_type: str = "application/octet-stream",
) -> dict:
    """Upload a file to the platform via the agent files endpoint.

    Returns ``{id, name, mime_type, size, gc_url, presigned_url}`` from the platform.
    Raises ``RuntimeError`` if ``ALO_API_KEY`` is not available.
    """
    if not os.environ.get("ALO_API_KEY"):
        raise RuntimeError(
            "ALO_API_KEY is not available. Register the app first so the key is provisioned."
        )
    from alo_agents_client import AloAgentsClient
    from connector_client import get_request_app_identity

    return AloAgentsClient(app_identity=get_request_app_identity()).upload_file(
        filename, content, mime_type
    )


def resolve_generated_file_url(
    path: str,
    thread_id: str,
    expires_in_seconds: int = 600,
) -> str:
    """Presigned download URL for a file the assistant generated in its sandbox.

    The platform resolves the sandbox by ``space:user_email:agent_id:thread_id``,
    so we pass the SAME agent id the run used: the baked ``agent_id`` when set,
    otherwise the default agent's resolved numeric id (the run with no agent_id
    runs on the default agent "alo"). Requires ``ALO_API_KEY``.
    """
    if not os.environ.get("ALO_API_KEY"):
        raise RuntimeError("ALO_API_KEY is not available in this app's environment.")
    from alo_agents_client import AloAgentsClient
    from connector_client import get_request_app_identity

    client = AloAgentsClient(app_identity=get_request_app_identity())
    agent_id = load_assistant_config().get("agent_id")
    if agent_id is None:
        # Resolve the same default agent as dispatch; a different ID selects the wrong sandbox.
        defaults = [
            a for a in client.list_agents(include_default=True) if a.get("is_default")
        ]
        defaults.sort(key=lambda a: a.get("created_at") or "", reverse=True)
        if not defaults or defaults[0].get("id") is None:
            raise RuntimeError("Could not resolve the default agent id for file download.")
        agent_id = defaults[0]["id"]
    return client.get_sandbox_file_url(int(agent_id), path, thread_id, expires_in_seconds)
