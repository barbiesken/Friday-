"""AnthropicProvider — the real thing, imported lazily so `anthropic` stays optional.

Targets the latest Claude models. Enable with:
    FRIDAY_PROVIDER=anthropic ANTHROPIC_API_KEY=... [FRIDAY_MODEL=claude-sonnet-4-6]
"""
from __future__ import annotations

import os
from typing import AsyncIterator

FRIDAY_SYSTEM = (
    "You are FRIDAY, a calm, capable desktop AI presence. Be brief and warm. "
    "Never over-explain. Speak like a trusted operator, not a chatbot."
)


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, model: str) -> None:
        try:
            import anthropic  # noqa: F401
        except ImportError as exc:  # pragma: no cover - depends on optional dep
            raise RuntimeError(
                "FRIDAY_PROVIDER=anthropic requires the 'anthropic' package. "
                "Run: pip install anthropic"
            ) from exc
        from anthropic import AsyncAnthropic

        self.model = model
        self._client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    async def complete(self, prompt: str, *, system: str | None = None) -> str:
        msg = await self._client.messages.create(
            model=self.model,
            max_tokens=512,
            system=system or FRIDAY_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")

    async def stream(self, prompt: str, *, system: str | None = None) -> AsyncIterator[str]:
        async with self._client.messages.stream(
            model=self.model,
            max_tokens=512,
            system=system or FRIDAY_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                yield text
