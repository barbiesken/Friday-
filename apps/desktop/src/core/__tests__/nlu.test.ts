import { describe, it, expect } from "vitest";
import { route } from "../nlu";

describe("nlu.route", () => {
  it("opens the brief surface for 'brief me'", () => {
    const i = route("friday brief me");
    expect(i.intent).toBe("daily_brief");
    expect(i.panel).toBe("brief");
  });

  it("focus mode → flow layout + focus workspace", () => {
    const i = route("focus mode");
    expect(i.layout).toBe("flow");
    expect(i.workspace).toBe("focus");
  });

  it("parses the target app for 'open …'", () => {
    const i = route("friday open chrome");
    expect(i.intent).toBe("open_app");
    expect(i.args?.app).toBe("chrome");
  });

  it("maps named workspaces", () => {
    expect(route("builder").workspace).toBe("builder");
    expect(route("study room").workspace).toBe("study");
    expect(route("night mode").workspace).toBe("night");
  });

  it("captain mode uses the captain layout", () => {
    expect(route("take command").layout).toBe("captain");
  });

  it("good night settles into sleep", () => {
    expect(route("good night").settle).toBe("sleep");
  });

  it("opens the timeline surface", () => {
    expect(route("what did i do today").panel).toBe("timeline");
  });

  it("exit / stand down returns to orbital", () => {
    expect(route("stand down").layout).toBe("orbital");
  });

  it("strips the wake word", () => {
    expect(route("hey friday, what time is it").intent).toBe("time");
  });

  it("falls back gracefully on unknown input", () => {
    expect(route("flibber the wodget").intent).toBe("fallback");
  });

  it("never parrots the user's words in the fallback", () => {
    const i = route("flibber the wodget");
    expect(i.reply.toLowerCase()).not.toContain("flibber");
    expect(i.reply.toLowerCase()).not.toContain("wodget");
  });

  it("greets back instead of routing a command", () => {
    expect(route("hello").intent).toBe("greeting");
    expect(route("hey friday").intent).toBe("noop"); // bare wake word, nothing to do
  });

  it("answers 'what can you do' with capabilities", () => {
    expect(route("what can you do").intent).toBe("capabilities");
  });

  it("does not mistake 'this'/'ship' for a greeting", () => {
    expect(route("ship it").intent).not.toBe("greeting");
  });
});
