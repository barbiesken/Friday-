import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Keeps a WebGL/render failure from white-screening the whole app. The core may
 * go dark on an unsupported GPU; the rest of FRIDAY (voice, chat, HUD) lives on.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[friday] render error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
