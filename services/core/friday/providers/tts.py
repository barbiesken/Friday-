"""Text-to-speech providers. The voice of FRIDAY.

Mirrors the LLM provider pattern: swapping voices is a config change, never a code
change. The API key lives here on the server — it is never shipped to the browser.
Default is silent ``MockTTS`` so the app still runs with zero keys (the client
falls back to the browser's Web Speech synthesis).
"""
from __future__ import annotations

import asyncio
import base64
import io
import json
import urllib.error
import urllib.request
import wave
from typing import Protocol, runtime_checkable

from ..config import settings


@runtime_checkable
class TTSProvider(Protocol):
    name: str
    available: bool
    media_type: str

    async def synthesize(self, text: str) -> bytes | None:
        """Return encoded audio bytes for ``text``, or ``None`` to fall back."""
        ...


class MockTTS:
    """No real voice — returns nothing so the client uses Web Speech."""

    name = "mock"
    available = False
    media_type = "audio/wav"

    async def synthesize(self, text: str) -> bytes | None:  # noqa: ARG002
        return None


def _pcm_to_wav(pcm: bytes, rate: int) -> bytes:
    """Wrap raw signed-16-bit mono PCM in a WAV container the browser can decode."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return buf.getvalue()


class GoogleTTS:
    """Google Gemini speech generation (``generativelanguage.googleapis.com``).

    Returns L16 PCM which we wrap as WAV. Works with an AI-Studio API key.
    """

    name = "google"
    media_type = "audio/wav"
    DEFAULT_MODEL = "gemini-2.5-flash-preview-tts"
    DEFAULT_VOICE = "Kore"  # calm, confident — FRIDAY's register

    def __init__(self, api_key: str, voice: str = "", model: str = "") -> None:
        self.api_key = api_key
        self.voice = voice or self.DEFAULT_VOICE
        self.model = model or self.DEFAULT_MODEL
        self.available = bool(api_key)

    async def synthesize(self, text: str) -> bytes | None:
        if not self.available or not text.strip():
            return None
        return await asyncio.to_thread(self._call, text)

    def _call(self, text: str) -> bytes | None:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        body = json.dumps(
            {
                "contents": [{"parts": [{"text": text}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": self.voice}}
                    },
                },
            }
        ).encode()
        req = urllib.request.Request(
            url, data=body, headers={"content-type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                payload = json.loads(resp.read())
            part = payload["candidates"][0]["content"]["parts"][0]["inlineData"]
            pcm = base64.b64decode(part["data"])
            rate = 24000
            mime = part.get("mimeType", "")
            if "rate=" in mime:
                rate = int(mime.split("rate=")[1].split(";")[0])
            return _pcm_to_wav(pcm, rate)
        except (urllib.error.URLError, KeyError, ValueError, TimeoutError):
            return None


def get_tts_provider() -> TTSProvider:
    name = settings.tts_provider.lower()
    if name in ("google", "gemini"):
        return GoogleTTS(settings.tts_api_key, settings.tts_voice, settings.tts_model)
    return MockTTS()
