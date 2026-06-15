/**
 * Real-voice client. Talks to the core service's `/api/tts`, which holds the
 * provider key server-side. When no service / no key is present, callers fall
 * back to the browser's Web Speech synthesis — so this is always safe to try.
 */

const WS_URL =
  (import.meta.env.VITE_FRIDAY_WS as string | undefined) ?? "ws://127.0.0.1:8765/ws/events";
const BASE =
  (import.meta.env.VITE_FRIDAY_HTTP as string | undefined) ??
  WS_URL.replace(/^ws/, "http").replace(/\/ws\/events$/, "");

let availability: Promise<boolean> | null = null;

function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

/** Does a core service with a configured voice provider answer? Cached. */
export function serverTTSAvailable(): Promise<boolean> {
  if (!availability) {
    availability = fetch(`${BASE}/api/health`, { signal: timeoutSignal(1500) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !!(j && j.tts_available))
      .catch(() => false);
  }
  return availability;
}

/** Synthesize `text` to audio bytes, or null to fall back to Web Speech. */
export async function synthesizeTTS(text: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: timeoutSignal(30000),
    });
    if (!res.ok || res.status === 204) return null;
    if (!(res.headers.get("content-type") || "").startsWith("audio/")) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
