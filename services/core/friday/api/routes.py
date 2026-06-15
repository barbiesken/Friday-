"""REST surface — chat, daily brief, Second Brain, timeline, commands."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..db import add_memory, list_memories, recent_events
from ..events import hub
from ..providers import get_provider

router = APIRouter(prefix="/api")
provider = get_provider()


class ChatIn(BaseModel):
    text: str


class MemoryIn(BaseModel):
    content: str
    kind: str = "note"
    tags: list[str] = []


class CommandIn(BaseModel):
    id: str
    label: str = ""


@router.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "provider": provider.name, "service": "friday-core"}


@router.post("/chat")
async def chat(body: ChatIn) -> dict[str, str]:
    await hub.broadcast("assistant/state", {"state": "thinking"})
    reply = await provider.complete(body.text)
    await hub.broadcast("assistant/state", {"state": "speaking"})
    await hub.broadcast("tts/start", {"text": reply})
    return {"reply": reply}


@router.get("/brief")
async def brief() -> dict[str, Any]:
    text = await provider.complete("brief me on my day")
    return {
        "greeting": _greeting(),
        "date": datetime.now().strftime("%a · %d %b"),
        "energy": "High",
        "meetings": 3,
        "priority": "Ship the core",
        "summary": text,
    }


@router.post("/memory")
async def capture(body: MemoryIn) -> dict[str, Any]:
    mem = add_memory(body.content, body.kind, body.tags)
    await hub.broadcast("notify", {"level": "info", "message": "Saved to Second Brain"})
    return mem


@router.get("/memory")
async def memories(limit: int = 50) -> list[dict[str, Any]]:
    return list_memories(limit)


@router.get("/timeline")
async def timeline(limit: int = 100) -> list[dict[str, Any]]:
    return recent_events(limit)


@router.post("/command")
async def run_command(body: CommandIn) -> dict[str, Any]:
    await hub.broadcast("command/run", {"id": body.id, "label": body.label})
    await hub.broadcast("command/done", {"id": body.id})
    return {"ok": True, "id": body.id}


def _greeting() -> str:
    h = datetime.now().hour
    return "Good morning" if h < 12 else "Good afternoon" if h < 18 else "Good evening"
