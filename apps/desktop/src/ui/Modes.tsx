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

/** A single telemetry line for the captain panels. */
function StatRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "5px 0",
        borderBottom: "1px solid rgba(127,211,255,0.06)",
      }}
    >
      <span className="hud-label" style={{ letterSpacing: "0.14em" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-hud)", fontSize: 12, color: tone ?? "var(--soft-white)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

/** Captain Mode — the unified command center: diagnostics + tactical analysis. */
function CaptainChrome() {
  const objectives: Array<[string, "done" | "active" | "todo"]> = [
    ["Computational core online", "done"],
    ["Voice loop + wake", "done"],
    ["Agent swarm dispatch", "active"],
    ["System control (Tauri)", "todo"],
    ["Ship to millions", "todo"],
  ];
  const dotColor = { done: "var(--success)", active: "var(--accent)", todo: "var(--mute)" };

  const tactical: Array<[string, string, string?]> = [
    ["Threat level", "7.8 · ELEVATED", "var(--alert)"],
    ["Resource allocation", "92% efficiency"],
    ["Target acquisition", "LOCKED", "var(--success)"],
    ["Mission parameters", "ALPHA"],
  ];
  const streams: Array<[string, string]> = [
    ["Stream 01 · neural net", "4.5 TB/s"],
    ["Stream 03 · neural net", "4.5 TB/s"],
    ["Stream 07 · quantum field", "2.0 TB/s"],
  ];
  const reactor: Array<[string, string, string?]> = [
    ["Stability", "OPTIMAL · 99.8%", "var(--success)"],
    ["Power output", "1.2 petawatts"],
    ["Coolant flow", "nominal"],
    ["Internal temp", "3,500 K"],
    ["Q-bits", "8.1 × 10³⁴"],
  ];
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <>
      {/* title block */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.6, ease }}
        style={{ position: "fixed", top: 70, left: 0, right: 0, textAlign: "center", zIndex: 5, pointerEvents: "none" }}
      >
        <div className="glow-text" style={{ fontFamily: "var(--font-hud)", fontWeight: 800, letterSpacing: "0.32em", fontSize: 20 }}>
          FRIDAY UNIFIED COMMAND CENTER
        </div>
        <div className="hud-label" style={{ marginTop: 7, letterSpacing: "0.42em" }}>ORBITAL INFORMATION STATE</div>
        <div className="hud-label accent" style={{ marginTop: 8, letterSpacing: "0.22em" }}>
          MODE · CAPTAIN — SYSTEM DIAGNOSTICS &amp; TACTICAL ANALYSIS
        </div>
      </motion.div>

      {/* left — priority lattice + objectives */}
      <motion.div
        className="panel"
        initial={{ opacity: 0, x: -24, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -24 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.05 }}
        style={{ position: "fixed", top: 150, left: 84, width: 282, padding: "16px 18px", zIndex: 5 }}
      >
        <div className="panel__title" style={{ marginBottom: 10 }}>Priority Lattice · high-level</div>
        {tactical.map(([k, v, tone]) => <StatRow key={k} label={k} value={v} tone={tone} />)}

        <div className="panel__title" style={{ margin: "14px 0 8px" }}>Data streams</div>
        {streams.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--mute)" }}>
              <span className="dot" style={{ width: 5, height: 5 }} />{k}
            </span>
            <span className="accent" style={{ fontFamily: "var(--font-hud)", fontSize: 11 }}>{v}</span>
          </div>
        ))}

        <div className="panel__title" style={{ margin: "14px 0 8px" }}>Mission · ship FRIDAY</div>
        <div style={{ display: "grid", gap: 7 }}>
          {objectives.map(([label, st]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor[st], boxShadow: `0 0 9px ${dotColor[st]}` }} />
              <span style={{ fontSize: 13, flex: 1, color: st === "todo" ? "var(--mute)" : "var(--soft-white)" }}>{label}</span>
              <span className="hud-label">{st.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* right — reactor core status */}
      <motion.div
        className="panel"
        initial={{ opacity: 0, x: 24, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: 24 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.12 }}
        style={{ position: "fixed", top: 150, right: 40, width: 266, padding: "16px 18px", zIndex: 5 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="panel__title">Reactor Core Status</div>
          <span className="chip" style={{ padding: "3px 9px" }}>
            <span className="dot" style={{ background: "var(--success)", boxShadow: "0 0 10px var(--success)" }} />
            <span className="hud-label" style={{ color: "var(--soft-white)" }}>NOMINAL</span>
          </span>
        </div>
        {reactor.map(([k, v, tone]) => <StatRow key={k} label={k} value={v} tone={tone} />)}
        <div style={{ marginTop: 12 }}>
          <div className="hud-label" style={{ marginBottom: 6 }}>Energy flux density</div>
          <div style={{ height: 5, borderRadius: 4, background: "rgba(127,211,255,.10)", overflow: "hidden" }}>
            <motion.div
              animate={{ width: ["62%", "86%", "62%"] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--energy-deep), var(--accent))", boxShadow: "0 0 12px var(--accent)" }}
            />
          </div>
        </div>
      </motion.div>

      {/* exit hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", bottom: 170, left: 0, right: 0, textAlign: "center", zIndex: 5, pointerEvents: "none" }}
      >
        <span className="hud-label">Esc, or say “stand down”, to exit</span>
      </motion.div>
    </>
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
