"""The server-side event hub — mirrors the renderer's bus over WebSocket.

This is the same nervous system, networked: the renderer and the core service
exchange the exact same event names (assistant/state, command/run, tts/level, ...).
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import WebSocket

from .db import record_event


class EventHub:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)

    async def broadcast(self, name: str, payload: dict[str, Any] | None = None) -> None:
        record_event(name, payload)
        message = json.dumps({"name": name, "payload": payload or {}})
        dead: list[WebSocket] = []
        async with self._lock:
            clients = list(self._clients)
        for ws in clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


hub = EventHub()
