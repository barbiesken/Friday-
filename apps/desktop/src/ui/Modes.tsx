import { motion, AnimatePresence } from "framer-motion";
import { useFriday } from "../core/store";

/** Flow Mode — everything dissolves; only the core and the one task remain. */
function FlowChrome() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{ position: "fixed", inset: 0, zIndex: 4, pointerEvents: "none", display: "grid", placeItems: "end center" }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "12vh", textAlign: "center" }}
      >
        <div className="hud-label" style={{ marginBottom: 8 }}>Flow · one thing</div>
        <div style={{ fontFamily: "var(--font-hud)", fontSize: 30, fontWeight: 600 }}>Ship the core</div>
        <div className="accent hud-value" style={{ fontSize: 18, marginTop: 6 }}>42:18</div>
        <div className="hud-label" style={{ marginTop: 18, opacity: 0.6 }}>Esc, or say “exit”, to return</div>
      </motion.div>
    </motion.div>
  );
}

/** Captain Mode — high-performance mission view. */
function CaptainChrome() {
  const objectives: Array<[string, "done" | "active" | "todo"]> = [
    ["Computational core online", "done"],
    ["Voice loop + wake", "done"],
    ["Agent swarm dispatch", "active"],
    ["System control (Tauri)", "todo"],
    ["Ship to millions", "todo"],
  ];
  const dot = { done: "var(--success)", active: "var(--accent)", todo: "var(--mute)" };
  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, y: -20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      style={{ position: "fixed", top: 84, left: "50%", transform: "translateX(-50%)", zIndex: 5, width: 460, padding: "20px 24px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-hud)", letterSpacing: "0.3em", fontSize: 15 }}>CAPTAIN MODE</div>
        <span className="chip"><span className="dot" /><span className="hud-label" style={{ color: "var(--soft-white)" }}>ALL SYSTEMS NOMINAL</span></span>
      </div>
      <div className="panel__title" style={{ marginBottom: 10 }}>Mission · Ship FRIDAY</div>
      <div style={{ display: "grid", gap: 8 }}>
        {objectives.map(([label, st]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot[st], boxShadow: `0 0 10px ${dot[st]}` }} />
            <span style={{ fontSize: 14, flex: 1, color: st === "todo" ? "var(--mute)" : "var(--soft-white)" }}>{label}</span>
            <span className="hud-label">{st.toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="hud-label" style={{ marginTop: 14, opacity: 0.6 }}>Esc, or say “stand down”, to exit</div>
    </motion.div>
  );
}

export function Modes() {
  const layout = useFriday((s) => s.layout);
  return (
    <>
      <AnimatePresence>{layout === "flow" && <FlowChrome key="flow" />}</AnimatePresence>
      <AnimatePresence>{layout === "captain" && <CaptainChrome key="captain" />}</AnimatePresence>
    </>
  );
}
