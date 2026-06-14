import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFriday } from "../core/store";
import type { AssistantState } from "../core/types";

const STATE_LABEL: Record<AssistantState, string> = {
  boot: "BOOTING",
  idle: "STANDING BY",
  listening: "LISTENING",
  thinking: "THINKING",
  speaking: "SPEAKING",
  planning: "PLANNING",
  executing: "EXECUTING",
  alert: "ALERT",
  celebrating: "CELEBRATING",
  sleep: "ASLEEP",
  whisper: "WHISPER",
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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="hud-label" style={{ width: 34 }}>
        {label}
      </span>
      <div style={{ width: 78, height: 4, background: "rgba(127,211,255,.12)", borderRadius: 4 }}>
        <motion.div
          animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          style={{
            height: "100%",
            borderRadius: 4,
            background: "linear-gradient(90deg, var(--energy-deep), var(--accent))",
            boxShadow: "0 0 10px var(--accent)",
          }}
        />
      </div>
      <span className="hud-value" style={{ fontSize: 11, width: 30, textAlign: "right" }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

/** The holographic chrome — top status bar + bottom task / vitals. */
export function HUD() {
  const state = useFriday((s) => s.state);
  const layout = useFriday((s) => s.layout);
  const metrics = useFriday((s) => s.metrics);
  const night = useFriday((s) => s.night);
  const now = useClock();

  if (layout === "flow") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      {/* top bar */}
      <div
        style={{
          position: "fixed",
          top: 26,
          left: 70,
          right: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: "var(--font-hud)", fontWeight: 900, letterSpacing: "0.42em", fontSize: 15 }}>
            FRIDAY
          </span>
          <span className="chip">
            <span className="dot" />
            <span className="hud-label" style={{ color: "var(--soft-white)" }}>
              {STATE_LABEL[state]}
            </span>
          </span>
        </div>

        <div className="hud-label">A · I · O · S</div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="hud-label">{night ? "WHISPER MODE" : "ONLINE"}</span>
          <span className="hud-value" style={{ fontSize: 15, letterSpacing: "0.08em" }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* bottom-left: current task + timer */}
      <div className="glass" style={{ position: "fixed", bottom: 28, left: 28, padding: "14px 18px", zIndex: 4, minWidth: 220 }}>
        <div className="hud-label">CURRENT TASK</div>
        <div className="hud-value" style={{ fontSize: 16, marginTop: 6 }}>
          Ship the Sphere
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <div>
            <div className="hud-label">FOCUS</div>
            <div className="hud-value accent" style={{ fontSize: 14 }}>
              42:18
            </div>
          </div>
          <div>
            <div className="hud-label">NEXT</div>
            <div className="hud-value" style={{ fontSize: 14 }}>
              Standup · 11:00
            </div>
          </div>
        </div>
      </div>

      {/* bottom-right: system vitals */}
      <div className="glass" style={{ position: "fixed", bottom: 28, right: 28, padding: "14px 18px", zIndex: 4 }}>
        <div className="hud-label" style={{ marginBottom: 10 }}>
          SYSTEM
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <Vital label="CPU" value={metrics.cpu} />
          <Vital label="MEM" value={metrics.mem} />
          <Vital label="NET" value={metrics.net} />
          {metrics.battery !== undefined && <Vital label="BAT" value={metrics.battery} />}
        </div>
      </div>
    </motion.div>
  );
}
