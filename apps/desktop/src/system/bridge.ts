import { bus } from "../core/eventBus";

/**
 * The boundary between FRIDAY and the operating system. In the browser this is a
 * safe mock (it narrates what it *would* do). In the Tauri shell (Phase 2) the
 * same interface is backed by native Rust commands — no renderer changes needed.
 */
export interface SystemBridge {
  readonly kind: "browser" | "tauri";
  openApp(name: string): Promise<void>;
  setVolume(level: number): Promise<void>; // 0..1
  setBrightness(level: number): Promise<void>; // 0..1
  focusMode(on: boolean): Promise<void>;
  runChain(label: string, steps: string[]): Promise<void>;
  notify(title: string, body?: string): Promise<void>;
}

function announce(action: string) {
  // narrate in the demo so the intent is visible; Tauri replaces this with real calls
  bus.emit("notify", { level: "info", message: action });
}

class BrowserBridge implements SystemBridge {
  readonly kind = "browser" as const;
  async openApp(name: string) { announce(`Opening ${name}`); }
  async setVolume(level: number) { announce(`Volume → ${Math.round(level * 100)}%`); }
  async setBrightness(level: number) { announce(`Brightness → ${Math.round(level * 100)}%`); }
  async focusMode(on: boolean) { announce(on ? "Focus mode engaged" : "Focus mode released"); }
  async runChain(label: string, steps: string[]) {
    announce(label);
    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 240));
      announce(`↳ ${s}`);
    }
  }
  async notify(title: string, body?: string) { announce(body ? `${title} — ${body}` : title); }
}

type TauriInvoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

/** Backed by native Rust commands when running inside the Tauri shell. */
class TauriBridge implements SystemBridge {
  readonly kind = "tauri" as const;
  constructor(private invoke: TauriInvoke) {}
  openApp(name: string) { return this.invoke("open_app", { name }).then(() => undefined); }
  setVolume(level: number) { return this.invoke("set_volume", { level }).then(() => undefined); }
  setBrightness(level: number) { return this.invoke("set_brightness", { level }).then(() => undefined); }
  focusMode(on: boolean) { return this.invoke("focus_mode", { on }).then(() => undefined); }
  async runChain(_label: string, steps: string[]) { await this.invoke("run_chain", { steps }); }
  notify(title: string, body?: string) { return this.invoke("notify", { title, body }).then(() => undefined); }
}

function detect(): SystemBridge {
  const t = (window as unknown as { __TAURI__?: { invoke?: TauriInvoke } }).__TAURI__;
  if (t?.invoke) return new TauriBridge(t.invoke);
  return new BrowserBridge();
}

/** App-wide system bridge. */
export const system: SystemBridge = typeof window !== "undefined" ? detect() : new BrowserBridge();
