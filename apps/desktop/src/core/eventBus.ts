import type { FridayEvents, FridayEventName } from "./types";

type Handler<K extends FridayEventName> = (payload: FridayEvents[K]) => void;

/**
 * A tiny, fully-typed event bus — FRIDAY's nervous system.
 *
 * Modules never reach into each other; they emit and subscribe here. This is the
 * single source of truth that keeps the system decoupled and plugin-friendly.
 * The server mirrors the same event names over WebSocket.
 */
class EventBus {
  private handlers = new Map<FridayEventName, Set<Handler<FridayEventName>>>();
  /** ring buffer of recent events — useful for the Timeline / debugging */
  private log: Array<{ name: FridayEventName; at: number }> = [];
  private readonly logCap = 200;

  on<K extends FridayEventName>(name: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler as Handler<FridayEventName>);
    return () => this.off(name, handler);
  }

  /** Subscribe for a single fire. */
  once<K extends FridayEventName>(name: K, handler: Handler<K>): () => void {
    const off = this.on(name, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends FridayEventName>(name: K, handler: Handler<K>): void {
    this.handlers.get(name)?.delete(handler as Handler<FridayEventName>);
  }

  emit<K extends FridayEventName>(name: K, payload: FridayEvents[K]): void {
    this.log.push({ name, at: Date.now() });
    if (this.log.length > this.logCap) this.log.shift();
    const set = this.handlers.get(name);
    if (!set) return;
    // copy to allow handlers to unsubscribe during dispatch
    for (const handler of [...set]) {
      try {
        (handler as Handler<K>)(payload);
      } catch (err) {
        // never let one listener break the bus
        console.error(`[bus] handler for "${name}" threw:`, err);
      }
    }
  }

  recent(): ReadonlyArray<{ name: FridayEventName; at: number }> {
    return this.log;
  }
}

/** The single, app-wide bus. */
export const bus = new EventBus();

// Expose for debugging in the browser console.
if (typeof window !== "undefined") {
  (window as unknown as { friday?: { bus: EventBus } }).friday = { bus };
}
