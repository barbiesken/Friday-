import { motion } from "framer-motion";
import { useFriday } from "../core/store";
import { AGENTS } from "../sphere/Agents";
import type { ReactNode } from "react";

/** A floating glass widget that materializes from the core, then drifts. */
function Widget({
  title, children, style, delay = 0, drift = 6, ex = 0, ey = 0,
}: {
  title: string; children: ReactNode; style?: React.CSSProperties;
  delay?: number; drift?: number; ex?: number; ey?: number;
}) {
  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, scale: 0.3, x: ex, y: ey, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, x: 0, y: [0, -drift, 0], filter: "blur(0px)" }}
      transition={{
        opacity: { duration: 0.7, delay },
        scale: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.7, delay },
        y: { duration: 7 + drift, repeat: Infinity, ease: "easeInOut", delay: delay + 0.7 },
      }}
      style={{ position: "fixed", padding: "14px 17px", zIndex: 4, width: 196, ...style }}
    >
      <div className="panel__title" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </motion.div>
  );
}

function OrbitRings() {
  return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 3, pointerEvents: "none" }}>
      <motion.svg width={680} height={680} viewBox="0 0 680 680"
        animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", opacity: 0.22 }}>
        <circle cx="340" cy="340" r="320" fill="none" stroke="var(--glass-line)" strokeWidth="1" strokeDasharray="2 14" />
        <circle cx="340" cy="20" r="3" fill="var(--accent)" />
      </motion.svg>
    </div>
  );
}

function Eq() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 16 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div key={i} animate={{ height: [4, 14, 6, 16, 5] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          style={{ width: 3, background: "var(--accent)", borderRadius: 2 }} />
      ))}
    </div>
  );
}

/** Orbital command center — widgets float around the core in orbital / full layouts. */
export function CommandCenter() {
  const layout = useFriday((s) => s.layout);
  const state = useFriday((s) => s.state);
  if (layout !== "orbital" && layout !== "full") return null;
  const agentsActive = state === "thinking" || state === "executing" || state === "planning";

  return (
    <>
      <OrbitRings />

      <Widget title="Calendar" style={{ top: "20%", left: 96 }} delay={0.1} ex={180}>
        {[["10:00", "Design sync"], ["11:00", "Standup"], ["14:30", "1:1 · Aaryan"]].map(([t, label]) => (
          <div key={t} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <span className="hud-value accent" style={{ fontSize: 12, width: 40 }}>{t}</span>
            <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{label}</span>
          </div>
        ))}
      </Widget>

      <Widget title="Weather" style={{ top: "46%", left: 96 }} delay={0.22} drift={8} ex={180}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="hud-value" style={{ fontSize: 26 }}>24°</span>
          <span style={{ color: "var(--mute)", fontSize: 13 }}>Clear · feels 22°</span>
        </div>
      </Widget>

      <Widget title="Agents" style={{ top: "20%", right: 40 }} delay={0.16} ex={-180}>
        {AGENTS.map((a) => (
          <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, boxShadow: `0 0 10px ${a.color}` }} />
            <span style={{ fontSize: 13, color: "var(--soft-white)", flex: 1 }}>{a.name}</span>
            <span className="hud-label" style={{ color: agentsActive ? "var(--accent)" : "var(--mute)" }}>
              {agentsActive ? "ACTIVE" : "ORBIT"}
            </span>
          </div>
        ))}
      </Widget>

      <Widget title="Now Playing" style={{ top: "52%", right: 40 }} delay={0.3} drift={7} ex={-180}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--soft-white)" }}>Deep Focus</div>
            <div style={{ fontSize: 11, color: "var(--mute)" }}>Ambient · Flow</div>
          </div>
          <Eq />
        </div>
      </Widget>

      <Widget title="Focus" style={{ bottom: "15%", left: "calc(50% - 75px)", width: 150 }} delay={0.4} ey={-120}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
          <span className="hud-value accent" style={{ fontSize: 24 }}>87</span>
          <span style={{ color: "var(--mute)", fontSize: 12 }}>/ 100 flow</span>
        </div>
      </Widget>
    </>
  );
}
