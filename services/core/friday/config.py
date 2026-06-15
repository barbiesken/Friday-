"""Runtime configuration — read from the environment, sane local-first defaults."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    # Which LLM provider to use: "mock" (default, no keys) | "anthropic"
    provider: str = os.getenv("FRIDAY_PROVIDER", "mock")
    model: str = os.getenv("FRIDAY_MODEL", "claude-sonnet-4-6")
    # Where local data lives (SQLite). Local-first by design.
    data_dir: Path = Path(os.getenv("FRIDAY_DATA_DIR", str(Path.home() / ".friday")))
    host: str = os.getenv("FRIDAY_HOST", "127.0.0.1")
    port: int = int(os.getenv("FRIDAY_PORT", "8765"))
    # The renderer origin allowed via CORS during development.
    renderer_origin: str = os.getenv("FRIDAY_RENDERER_ORIGIN", "http://localhost:5173")

    # --- Real voice (server-side TTS; the key never reaches the browser) -----
    # "mock" (default, silent → client falls back to Web Speech) | "google"
    tts_provider: str = os.getenv("FRIDAY_TTS_PROVIDER", "mock")
    tts_api_key: str = os.getenv("FRIDAY_TTS_API_KEY", "")
    tts_voice: str = os.getenv("FRIDAY_TTS_VOICE", "")  # provider voice (optional)
    tts_model: str = os.getenv("FRIDAY_TTS_MODEL", "")  # provider model (optional)

    @property
    def db_path(self) -> Path:
        return self.data_dir / "friday.db"


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
