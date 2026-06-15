import { bus } from "./eventBus";
import { useFriday } from "./store";
import type { SystemMetrics } from "./types";

/**
 * The networked nervous system — the renderer's side of the bus, mirrored to the
 * FastAPI core over WebSocket. Entirely optional: if the service isn't running,
 * FRIDAY runs fully on-device and silently retries in the background.
 *
 * To avoid feedback loops we do NOT forward local state outward; we only *apply*
 * a safe subset of inbound, server-originated events (metrics, notifications).
 */
const WS_URL =
  (import.meta.env.VITE_FRIDAY_WS as string | undefined) ?? "ws://127.0.0.1:8765/ws/events";

let ws: WebSocket | null = null;
let started = false;
let retry = 0;

export function startBridge(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  connect();
}

function connect(): void {
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleRetry();
    return;
  }

  ws.onopen = () => {
    retry = 0;
    useFriday.getState().setCoreLink(true);
    bus.emit("notify", { level: "info", message: "Core link established" });
  };

  ws.onmessage = (e) => {
    try {
      const { name, payload } = JSON.parse(e.data as string) as { name: string; payload: unknown };
      applyInbound(name, payload);
    } catch {
      /* ignore malformed frames */
    }
  };

  ws.onclose = () => {
    useFriday.getState().setCoreLink(false);
    scheduleRetry();
  };
  ws.onerror = () => ws?.close();
}

function scheduleRetry(): void {
  retry = Math.min(retry + 1, 6);
  setTimeout(connect, 1000 * 2 ** retry); // capped exponential backoff
}

/** Apply only safe, server-originated events. Local state never round-trips. */
function applyInbound(name: string, payload: unknown): void {
  if (name === "system/metric") {
    useFriday.getState().setMetrics(payload as SystemMetrics);
  } else if (name === "notify") {
    bus.emit("notify", payload as { level: "info" | "warn" | "alert"; message: string });
  }
}

/** Ask the core service to answer (real provider) instead of on-device NLU. */
export async function coreChat(text: string): Promise<string | null> {
  const base = WS_URL.replace(/^ws/, "http").replace(/\/ws\/events$/, "");
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply: string };
    return data.reply;
  } catch {
    return null;
  }
}
