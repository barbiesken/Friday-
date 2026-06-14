"""FRIDAY core service — FastAPI app entrypoint.

Run:  uvicorn friday.main:app --host 127.0.0.1 --port 8765 --reload
or:   python -m friday.main
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .config import settings
from .db import init_db
from .events import hub


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="FRIDAY Core", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.renderer_origin, "http://localhost:5173", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "FRIDAY Core", "tagline": "Your world. Orchestrated."}


@app.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    """The networked nervous system. Clients send and receive bus events."""
    await hub.connect(ws)
    await ws.send_json({"name": "assistant/state", "payload": {"state": "idle"}})
    try:
        while True:
            data = await ws.receive_json()
            # re-broadcast inbound client events to all peers (renderer ↔ service)
            await hub.broadcast(data.get("name", "unknown"), data.get("payload", {}))
    except WebSocketDisconnect:
        await hub.disconnect(ws)
    except Exception:
        await hub.disconnect(ws)


def main() -> None:
    import uvicorn

    uvicorn.run("friday.main:app", host=settings.host, port=settings.port, reload=False)


if __name__ == "__main__":
    main()
