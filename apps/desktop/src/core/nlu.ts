import type { AssistantState, Emotion, LayoutMode, PanelId, WorkspaceId, WorldTheme } from "./types";

export interface Intent {
  intent: string;
  /** short spoken reply — FRIDAY keeps it brief */
  reply: string;
  emotion?: Emotion;
  layout?: LayoutMode;
  /** a terminal state to settle into after speaking (e.g. sleep) */
  settle?: AssistantState;
  /** a command label to surface in the "executing" transparency step */
  command?: string;
  /** a workspace transformation to apply */
  workspace?: WorkspaceId;
  /** a World Engine environment to apply */
  world?: WorldTheme;
  /** an overlay surface to open */
  panel?: PanelId;
  /** structured arguments for system effects (e.g. { app }) */
  args?: Record<string, unknown>;
}

const hour = () => new Date().getHours();
const greet = () => (hour() < 12 ? "Good morning" : hour() < 18 ? "Good afternoon" : "Good evening");

/**
 * Local intent router — the on-device "mock provider". No network, no keys.
 * Deterministic, fast, and good enough to make the loop feel alive. The same
 * surface is swapped for the FastAPI provider in Phase 1.
 */
export function route(utteranceRaw: string): Intent {
  // strip the wake word and punctuation
  const u = utteranceRaw
    .toLowerCase()
    .replace(/^\s*(hey\s+)?friday[,\s]*/i, "")
    .replace(/[.?!]+$/g, "")
    .trim();

  const has = (...keys: string[]) => keys.some((k) => u.includes(k));

  if (!u) return { intent: "noop", reply: "I'm here." };

  if (has("brief", "my day", "good morning", "what's today", "whats today"))
    return {
      intent: "daily_brief",
      reply: `${greet()}, Aaryan. Three meetings, two priorities. Energy is high until two. Your one thing today: ship the core.`,
      emotion: "focused",
      command: "Assembling your daily brief",
      panel: "brief",
    };

  if (has("what's next", "whats next", "what should i", "next task", "what's left", "whats left"))
    return {
      intent: "next_action",
      reply: "Finish the boot sequence. It's the highest-leverage thing left.",
      emotion: "focused",
    };

  if (has("focus mode", "focus", "flow"))
    return {
      intent: "focus_mode",
      reply: "Focus mode. Everything else, away.",
      emotion: "focused",
      layout: "flow",
      workspace: "focus",
      command: "Engaging focus mode",
    };

  // workspace transformations (Aura Field + Room Mode)
  const ws: Array<[WorkspaceId, string[]]> = [
    ["builder", ["builder", "build mode", "coding room", "code mode"]],
    ["study", ["study", "study room", "learn mode"]],
    ["movie", ["movie", "cinema", "watch mode"]],
    ["relax", ["relax", "chill", "calm mode"]],
    ["night", ["night mode", "night room"]],
  ];
  for (const [id, keys] of ws)
    if (has(...keys))
      return {
        intent: `workspace_${id}`,
        reply: `${capitalize(id)} workspace.`,
        workspace: id,
        layout: "orbital",
        command: `Transforming workspace → ${id}`,
      };

  // World Engine — environment themes
  const worlds: Array<[WorldTheme, string[]]> = [
    ["space", ["space world", "space mode", "outer space"]],
    ["ocean", ["ocean world", "ocean mode", "underwater"]],
    ["cyber", ["cyber world", "cyber mode", "cyberpunk"]],
    ["library", ["library world", "library mode"]],
    ["arc", ["arc reactor", "arc world", "default world"]],
  ];
  for (const [id, keys] of worlds)
    if (has(...keys))
      return { intent: `world_${id}`, reply: `${capitalize(id)} world.`, world: id, command: `Transforming world → ${id}` };

  if (has("show my memory", "my ideas", "my notes", "memory palace", "captured"))
    return { intent: "open_memory", reply: "Here's what you've captured.", panel: "memory" };

  if (has("timeline", "what did i do", "my journey", "what happened", "show my journey"))
    return { intent: "open_timeline", reply: "Here's your day.", panel: "timeline" };

  if (has("what am i looking at", "vision", "explain this", "summarize this page", "what's on my screen", "look at my screen"))
    return { intent: "vision", reply: "Looking…", emotion: "curious", panel: "vision" };

  if (has("permission", "privacy", "what can you access"))
    return { intent: "permissions", reply: "Your permissions. You're always in control.", panel: "permissions" };

  if (has("settings", "preferences", "voice mode"))
    return { intent: "settings", reply: "Settings.", panel: "settings" };

  if (has("work mode", "start work", "let's work", "lets work"))
    return {
      intent: "work_mode",
      reply: "Opening your workspace. Editor, browser, calendar, playlist.",
      emotion: "focused",
      layout: "orbital",
      command: "Running command chain: start work mode",
    };

  if (has("transform", "workspace"))
    return {
      intent: "transform_workspace",
      reply: "Workspace transformed.",
      emotion: "curious",
      layout: "orbital",
      workspace: "focus",
      command: "Transforming workspace",
    };

  if (has("take command", "captain", "command mode"))
    return {
      intent: "captain_mode",
      reply: "Captain mode. Mission view online. Standing by.",
      emotion: "focused",
      layout: "captain",
      command: "Elevating to captain mode",
    };

  if (has("exit", "normal view", "show everything", "stand down", "orbital"))
    return { intent: "exit_mode", reply: "Back to orbital.", layout: "orbital" };

  if (has("remember this", "remember", "note this", "second brain"))
    return {
      intent: "second_brain",
      reply: "Saved to your Second Brain. You'll see it in tomorrow's review.",
      emotion: "calm",
      command: "Capturing to Second Brain",
    };

  if (has("open ")) {
    const app = u.split("open ")[1]?.split(" ")[0] ?? "that";
    return {
      intent: "open_app",
      reply: `Opening ${app}.`,
      emotion: "focused",
      command: `Launching ${app}`,
      args: { app },
    };
  }

  if (has("good night", "sleep", "go to sleep", "power down"))
    return {
      intent: "sleep",
      reply: "Resting. Wake me when you need me.",
      emotion: "sleep",
      settle: "sleep",
    };

  if (has("celebrate", "i finished", "i'm done", "im done", "shipped", "well done"))
    return {
      intent: "celebrate",
      reply: "Well done, Aaryan. That was a big one.",
      emotion: "celebrating",
    };

  if (has("alert", "warning", "emergency", "red alert"))
    return { intent: "alert", reply: "Alert acknowledged. I'm watching it.", emotion: "alert" };

  if (has("time", "what time"))
    return {
      intent: "time",
      reply: `It's ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
    };

  if (has("who are you", "what are you"))
    return {
      intent: "identity",
      reply: "I'm FRIDAY. I live in your machine and orchestrate your world.",
      emotion: "calm",
    };

  if (has("thank", "thanks"))
    return { intent: "thanks", reply: "Always.", emotion: "calm" };

  // graceful fallback — acknowledge, stay brief
  return {
    intent: "fallback",
    reply: `On it. ${capitalize(u)} — I'll take it from here.`,
    emotion: "curious",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
