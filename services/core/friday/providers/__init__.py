"""Provider factory — selects the backend from settings."""
from __future__ import annotations

from ..config import settings
from .base import LLMProvider
from .mock import MockProvider


def get_provider() -> LLMProvider:
    name = settings.provider.lower()
    if name == "anthropic":
        from .anthropic_provider import AnthropicProvider

        return AnthropicProvider(settings.model)
    return MockProvider()


__all__ = ["LLMProvider", "MockProvider", "get_provider"]
