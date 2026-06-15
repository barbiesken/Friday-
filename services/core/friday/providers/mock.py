"""MockProvider — deterministic, on-device, zero-key. Makes the loop feel alive."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import AsyncIterator


def _greeting() -> str:
    h = datetime.now().hour
    return "Good morning" if h < 12 else "Good afternoon" if h < 18 else "Good evening"


class MockProvider:
    name = "mock"

    def _answer(self, prompt: str) -> str:
        p = prompt.lower().strip()
        if any(k in p for k in ("brief", "today", "my day")):
            return (
                f"{_greeting()}, Aaryan. Three meetings, two priorities. "
                "Energy is high until two. Your one thing today: ship the core."
            )
        if any(k in p for k in ("next", "what should i", "what's left")):
            return "Finish the boot sequence. It's the highest-leverage thing left."
        if "focus" in p:
            return "Focus mode. Everything else, away."
        if any(k in p for k in ("who are you", "what are you")):
            return "I'm FRIDAY. I live in your machine and orchestrate your world."
        if "remember" in p:
            return "Saved to your Second Brain. You'll see it in tomorrow's review."
        return "On it. I'll take it from here."

    async def complete(self, prompt: str, *, system: str | None = None) -> str:
        await asyncio.sleep(0.05)
        return self._answer(prompt)

    async def stream(self, prompt: str, *, system: str | None = None) -> AsyncIterator[str]:
        for word in self._answer(prompt).split(" "):
            await asyncio.sleep(0.03)
            yield word + " "
