import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFriday } from "../core/store";
import { WaveBars } from "./WaveBars";
import type { AssistantState } from "../core/types";

const STATE_LABEL: Record<AssistantState, string> = {
  boot: "BOOTING", idle: "STANDING BY", listening: "LISTENING", thinking: "THINKING",
  speaking: "SPEAKING", planning: "PLANNING", executing: "EXECUTING", alert: "ALERT",
  celebrating: "CELEBRATING", sleep: "ASLEEP", whisper: "WHISPER",
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Vital({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span className="hud-label" style={{ width: 30 }}>{label}</span>
      <div style={{ width: 84, height: 4, background: "rgba(127,211,255,.10)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, var(--energy-deep), var(--accent))",
            boxShadow: "0 0 12px var(--accent)",
          }}
        />
      </div>
      <span className="hud-value" style={{ fontSize: 11, width: 26, textAlign: "right" }}>{Math.round(value * 100)}</span>
    </div>
  );
}

export function HUD() {
  const state = useFriday((s) => s.state);
  const layout = useFriday((s) => s.layout);
  const metrics = useFriday((s) => s.metrics);
  const night = useFriday((s) => s.night);
  const coreLink = useFriday((s) => s.coreLink);
  const now = useClock();

  if (layout === "flow") return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }}>
      {/* top bar */}
      <div style={{ position: "fixed", top: 24, left: 84, right: 40, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="glow-text" style={{ fontFamily: "var(--font-hud)", fontWeight: 900, letterSpacing: "0.46em", fontSize: 16 }}>FRIDAY</span>
          <span className="chip">
            <span className="dot" />
            <span className="hud-label" style={{ color: "var(--soft-white)" }}>{STATE_LABEL[state]}</span>
          </span>
        </div>

        <div className="glass" style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 18px", borderRadius: 999 }}>
          <WaveBars />
          <span className="hud-label accent" style={{ minWidth: 78, textAlign: "center" }}>{STATE_LABEL[state]}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {coreLink && (
            <span className="chip" style={{ padding: "5px 10px" }}>
              <span className="dot" style={{ background: "var(--success)", boxShadow: "0 0 10px var(--success)" }} />
              <span className="hud-label" style={{ color: "var(--soft-white)" }}>CORE LINK</span>
            </span>
          )}
          <span className="hud-label">{night ? "WHISPER" : "ONLINE"}</span>
          <span className="hud-value glow-text" style={{ fontSize: 17, letterSpacing: "0.08em" }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* bottom corners are hidden in orbital — the OrbitalDeck owns that space */}
      {layout !== "orbital" && (
        <>
      {/* bottom-left: current task */}
      <motion.div className="panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "fixed", bottom: 28, left: 84, padding: "16px 20px", zIndex: 4, minWidth: 232 }}>
        <div className="panel__title">Current Task</div>
        <div className="hud-value" style={{ fontSize: 17, marginTop: 9 }}>Ship the core</div>
        <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
          <div><div className="hud-label">Focus</div><div className="hud-value accent" style={{ fontSize: 14 }}>42:18</div></div>
          <div><div className="hud-label">Next</div><div className="hud-value" style={{ fontSize: 14 }}>Standup · 11:00</div></div>
        </div>
      </motion.div>

      {/* bottom-right: system vitals */}
      <motion.div className="panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "fixed", bottom: 28, right: 40, padding: "16px 20px", zIndex: 4 }}>
        <div className="panel__title" style={{ marginBottom: 12 }}>System</div>
        <div style={{ display: "grid", gap: 9 }}>
          <Vital label="CPU" value={metrics.cpu} />
          <Vital label="MEM" value={metrics.mem} />
          <Vital label="NET" value={metrics.net} />
          {metrics.battery !== undefined && <Vital label="BAT" value={metrics.battery} />}
        </div>
      </motion.div>
        </>
      )}
    </motion.div>
  );
}
