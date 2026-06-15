import { describe, it, expect } from "vitest";
import { useFriday, isNight } from "../store";

describe("store", () => {
  it("capture() prepends a memory", () => {
    const before = useFriday.getState().memories.length;
    useFriday.getState().capture("a fresh idea", "note");
    const after = useFriday.getState().memories;
    expect(after.length).toBe(before + 1);
    expect(after[0].text).toBe("a fresh idea");
    expect(after[0].kind).toBe("note");
  });

  it("streamLine then finalizeLine produces one settled friday line", () => {
    const s = useFriday.getState();
    const n = s.transcript.length;
    s.streamLine("friday", "hel");
    s.streamLine("friday", "hello");
    s.finalizeLine("friday");
    const t = useFriday.getState().transcript;
    expect(t.length).toBe(n + 1);
    expect(t[t.length - 1]).toMatchObject({ who: "friday", text: "hello", partial: false });
  });

  it("isNight() classifies hours", () => {
    expect(isNight(new Date(2026, 0, 1, 23, 0))).toBe(true);
    expect(isNight(new Date(2026, 0, 1, 3, 0))).toBe(true);
    expect(isNight(new Date(2026, 0, 1, 13, 0))).toBe(false);
  });
});
