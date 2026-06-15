import { describe, it, expect, vi } from "vitest";
import { bus } from "../eventBus";

describe("eventBus", () => {
  it("delivers events and unsubscribes via the returned disposer", () => {
    const fn = vi.fn();
    const off = bus.on("notify", fn);
    bus.emit("notify", { level: "info", message: "a" });
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    bus.emit("notify", { level: "info", message: "b" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("once() fires exactly once", () => {
    const fn = vi.fn();
    bus.once("tts/end", fn);
    bus.emit("tts/end", {});
    bus.emit("tts/end", {});
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("isolates a throwing handler from the rest", () => {
    const good = vi.fn();
    const off1 = bus.on("voice/level", () => {
      throw new Error("boom");
    });
    const off2 = bus.on("voice/level", good);
    expect(() => bus.emit("voice/level", { level: 0.5 })).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
    off1();
    off2();
  });
});
