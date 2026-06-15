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

  it("strips the wake word", () => {
    expect(route("hey friday, what time is it").intent).toBe("time");
  });

  it("falls back gracefully on unknown input", () => {
    expect(route("flibber the wodget").intent).toBe("fallback");
  });
});
