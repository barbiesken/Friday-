import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFriday } from "../core/store";
import { applyWorkspace, WORKSPACES } from "../core/workspaces";
import { submitUserText } from "../core/orchestrator";
import type { PanelId, VoiceMode } from "../core/types";

const TITLES: Record<PanelId, string> = {
  brief: "Daily Brief", memory: "Second Brain", permissions: "Permissions", settings: "Settings", palette: "Command Palette",
};

function ago(at: number): string {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="glass" style={{ padding: "10px 14px", borderRadius: 12, minWidth: 96 }}>
      <div className="hud-label">{k}</div>
      <div className="hud-value accent" style={{ fontSize: 18, marginTop: 4 }}>{v}</div>
    </div>
  );
}

function Brief() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 500 }}>{greet}, <span className="accent">Aaryan</span>.</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat k="Energy" v="High" /><Stat k="Meetings" v="3" /><Stat k="Focus" v="4h 20m" />
      </div>
      <div>
        <div className="panel__title" style={{ marginBottom: 10 }}>Today</div>
        <div style={{ color: "var(--mute)", lineHeight: 1.6, fontSize: 14 }}>
          Energy is high until two. Your one thing today: <span style={{ color: "var(--soft-white)" }}>ship the core.</span>
          {" "}Two priorities, three meetings. I've held 10–12 and 3–5 as focus blocks.
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {[["10:00", "Design sync"], ["11:00", "Standup"], ["14:30", "1:1 · Aaryan"]].map(([t, l]) => (
          <div key={t} className="glass" style={{ display: "flex", gap: 12, padding: "9px 13px", borderRadius: 10 }}>
            <span className="hud-value accent" style={{ width: 46 }}>{t}</span>
            <span style={{ fontSize: 14 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Memory() {
  const memories = useFriday((s) => s.memories);
  const capture = useFriday((s) => s.capture);
  const [text, setText] = useState("");
  const add = () => { if (text.trim()) { capture(text.trim(), "note"); setText(""); } };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="glass" style={{ display: "flex", gap: 8, padding: "8px 8px 8px 14px", borderRadius: 999 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Capture a thought…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--soft-white)", fontSize: 14 }} />
        <button className="friday-btn" onClick={add} style={{ borderRadius: 999 }}>Capture</button>
      </div>
      <div style={{ display: "grid", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {memories.map((m) => (
          <div key={m.id} className="glass" style={{ padding: "11px 14px", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span className="hud-label accent">{m.kind}</span>
              <span className="hud-label">{ago(m.at)}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PERMS = [
  ["Microphone", "Wake word + voice commands", true],
  ["Screen", "Vision Mode + screen awareness", true],
  ["Files", "Open, search, summarize documents", false],
  ["Notifications", "Ambient nudges + reminders", true],
  ["Calendar", "Daily brief + meeting prep", true],
  ["System control", "Apps, windows, volume, brightness", false],
] as const;

function Permissions() {
  const [on, setOn] = useState<boolean[]>(PERMS.map((p) => p[2]));
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ color: "var(--mute)", fontSize: 13 }}>Local-first. Every capability is visible, and yours to revoke.</div>
      {PERMS.map(([name, desc], i) => (
        <div key={name} className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 15 }}>{name}</div>
            <div className="hud-label" style={{ marginTop: 3 }}>{desc}</div>
          </div>
          <button onClick={() => setOn((s) => s.map((v, j) => (j === i ? !v : v)))}
            style={{
              width: 46, height: 26, borderRadius: 999, cursor: "pointer", position: "relative",
              border: "1px solid var(--glass-line)", background: on[i] ? "var(--accent)" : "rgba(10,16,28,0.7)",
              transition: "background .25s",
            }}>
            <span style={{ position: "absolute", top: 2, left: on[i] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s var(--ease-cine)" }} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Settings() {
  const voiceMode = useFriday((s) => s.voiceMode);
  const setVoiceMode = useFriday((s) => s.setVoiceMode);
  const workspace = useFriday((s) => s.workspace);
  const modes: VoiceMode[] = ["professional", "friendly", "jarvis"];
  const spaces = Object.values(WORKSPACES);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <div className="panel__title" style={{ marginBottom: 10 }}>Voice</div>
        <div style={{ display: "flex", gap: 8 }}>
          {modes.map((m) => (
            <button key={m} className="friday-btn" onClick={() => setVoiceMode(m)}
              style={{ flex: 1, borderColor: voiceMode === m ? "var(--accent)" : undefined, color: voiceMode === m ? "var(--accent)" : undefined }}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="panel__title" style={{ marginBottom: 10 }}>Workspace</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {spaces.map((w) => (
            <button key={w.id} className="friday-btn" onClick={() => applyWorkspace(w.id)}
              style={{ borderColor: workspace === w.id ? "var(--accent)" : undefined, color: workspace === w.id ? "var(--accent)" : undefined }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ color: "var(--mute)", fontSize: 13 }}>FRIDAY · v0.1 — Your world. Orchestrated.</div>
    </div>
  );
}

const COMMANDS: Array<[string, string]> = [
  ["Brief me on my day", "friday brief me"],
  ["What should I do next", "friday what's next"],
  ["Focus mode", "friday focus mode"],
  ["Start work mode", "friday start work mode"],
  ["Builder workspace", "friday builder"],
  ["Study workspace", "friday study"],
  ["Movie workspace", "friday movie"],
  ["Night mode", "friday night mode"],
  ["Take command", "friday take command"],
  ["Show my Second Brain", "friday show my memory"],
  ["Open permissions", "friday permissions"],
  ["Open settings", "friday settings"],
  ["Celebrate — I finished", "friday i finished"],
  ["Good night", "friday good night"],
];

function Palette() {
  const setPanel = useFriday((s) => s.setPanel);
  const [q, setQ] = useState("");
  const list = COMMANDS.filter(([label]) => label.toLowerCase().includes(q.toLowerCase()));
  const run = (utterance: string) => { setPanel(null); submitUserText(utterance); };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && list[0] && run(list[0][1])}
        placeholder="Type a command…"
        style={{ background: "rgba(10,16,28,0.6)", border: "1px solid var(--glass-line)", borderRadius: 12,
          padding: "12px 16px", color: "var(--soft-white)", fontSize: 15, outline: "none" }} />
      <div style={{ display: "grid", gap: 6, maxHeight: 340, overflowY: "auto" }}>
        {list.map(([label, utterance]) => (
          <button key={label} onClick={() => run(utterance)}
            style={{ textAlign: "left", background: "rgba(10,16,28,0.5)", border: "1px solid var(--glass-line)",
              borderRadius: 10, padding: "11px 14px", color: "var(--soft-white)", fontSize: 14, cursor: "pointer" }}>
            {label}
          </button>
        ))}
        {list.length === 0 && <div style={{ color: "var(--mute)", fontSize: 13, padding: 8 }}>No matching command.</div>}
      </div>
    </div>
  );
}

/** Holographic surfaces that emerge from the core and disintegrate back. */
export function Overlays() {
  const panel = useFriday((s) => s.panel);
  const setPanel = useFriday((s) => s.setPanel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPanel]);

  return (
    <AnimatePresence>
      {panel && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPanel(null)}
          style={{ position: "fixed", inset: 0, zIndex: 20, display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(4,8,16,0.4), rgba(4,6,10,0.78))" }}
        >
          <motion.div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.2, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.12, filter: "blur(18px)" }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            style={{ width: "min(560px, 88vw)", maxHeight: "82vh", overflow: "hidden", padding: "22px 24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "var(--font-hud)", fontSize: 15, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {TITLES[panel]}
              </div>
              <button className="friday-btn" onClick={() => setPanel(null)} style={{ borderRadius: 10, padding: "6px 12px" }}>Esc</button>
            </div>
            {panel === "brief" && <Brief />}
            {panel === "memory" && <Memory />}
            {panel === "permissions" && <Permissions />}
            {panel === "settings" && <Settings />}
            {panel === "palette" && <Palette />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
