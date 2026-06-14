"""Local-first SQLite storage — Second Brain, Timeline, sessions, insights."""
from __future__ import annotations

import json
import sqlite3
import time
from typing import Any

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    kind        TEXT NOT NULL DEFAULT 'note',   -- note | idea | task | voice | screenshot
    content     TEXT NOT NULL,
    tags        TEXT NOT NULL DEFAULT '[]',      -- json array
    created_at  REAL NOT NULL,
    reviewed    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,                   -- bus event name, e.g. command/run
    payload     TEXT NOT NULL DEFAULT '{}',      -- json
    created_at  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at  REAL NOT NULL,
    ended_at    REAL,
    summary     TEXT
);

CREATE TABLE IF NOT EXISTS insights (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    day         TEXT NOT NULL,                   -- YYYY-MM-DD
    body        TEXT NOT NULL,                   -- json
    created_at  REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories (created_at);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)


# ---- Second Brain --------------------------------------------------------

def add_memory(content: str, kind: str = "note", tags: list[str] | None = None) -> dict[str, Any]:
    now = time.time()
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO memories (kind, content, tags, created_at) VALUES (?,?,?,?)",
            (kind, content, json.dumps(tags or []), now),
        )
        return {"id": cur.lastrowid, "kind": kind, "content": content, "tags": tags or [], "created_at": now}


def list_memories(limit: int = 50) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM memories ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [{**dict(r), "tags": json.loads(r["tags"])} for r in rows]


# ---- Timeline ------------------------------------------------------------

def record_event(name: str, payload: dict[str, Any] | None = None) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO events (name, payload, created_at) VALUES (?,?,?)",
            (name, json.dumps(payload or {}), time.time()),
        )


def recent_events(limit: int = 100) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [{**dict(r), "payload": json.loads(r["payload"])} for r in rows]
