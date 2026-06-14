"""Provider abstraction. Swapping models is a config change, never a code change."""
from __future__ import annotations

from typing import AsyncIterator, Protocol, runtime_checkable


@runtime_checkable
class LLMProvider(Protocol):
    """Every model backend implements this. The rest of FRIDAY only knows this."""

    name: str

    async def complete(self, prompt: str, *, system: str | None = None) -> str:
        """Return a full completion."""
        ...

    def stream(self, prompt: str, *, system: str | None = None) -> AsyncIterator[str]:
        """Yield completion deltas for streaming (sub-500ms perceived response)."""
        ...
