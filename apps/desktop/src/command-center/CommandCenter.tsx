import { motion } from "framer-motion";
import { useFriday } from "../core/store";
import type { ReactNode } from "react";

/** A floating glass widget that drifts gently — part of the orbital command center. */
function Widget({
  title,
  children,
  style,
  delay = 0,
  drift = 6,
}: {
  title: string;
  children: ReactNode;
  style?: React.CSSProperties;
  delay?: number;
  drift?: number;
}) {
  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, scale: 0.92, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: [0, -drift, 0] }}
      transition={{
        opacity: { duration: 0.8, delay },
        scale: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.8, delay },
        y: { duration: 7 + drift, repeat: Infinity, ease: "easeInOut", delay },
      }}
      style={{ position: "fixed", padding: "14px 17px", zIndex: 4, width: 192, ...style }}
    >
      <div className="panel__title" style={{ marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </motion.div>
  );
}

/** Decorative holographic orbit rings centered on the Sphere. */
function OrbitRings() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <motion.svg
        width={640}
        height={640}
        viewBox="0 0 640 640"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", opacity: 0.35 }}
      >
        <circle cx="320" cy="320" r="300" fill="none" stroke="var(--glass-line)" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="320" cy="320" r="300" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="1 320" />
        <circle cx="320" cy="20" r="4" fill="var(--accent)" />
      </motion.svg>
      <motion.svg
        width={520}
        height={520}
        viewBox="0 0 520 520"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", opacity: 0.25, transform: "rotateX(70deg)" }}
      >
        <circle cx="260" cy="260" r="250" fill="none" stroke="var(--glass-line)" strokeWidth="1" />
      </motion.svg>
    </div>
  );
}

function Eq() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 16 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={{ height: [4, 14, 6, 16, 5] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          style={{ width: 3, background: "var(--accent)", borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

/** Orbital widgets around the Sphere — shown in orbital / full layouts. */
export function CommandCenter() {
  const layout = useFriday((s) => s.layout);
  if (layout !== "orbital" && layout !== "full") return null;

  return (
    <>
      <OrbitRings />

      <Widget title="CALENDAR" style={{ top: "20%", left: 40 }} delay={0.1}>
        {[
          ["10:00", "Design sync"],
          ["11:00", "Standup"],
          ["14:30", "1:1 · Aaryan"],
        ].map(([t, label]) => (
          <div key={t} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <span className="hud-value accent" style={{ fontSize: 12, width: 40 }}>
              {t}
            </span>
            <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{label}</span>
          </div>
        ))}
      </Widget>

      <Widget title="WEATHER" style={{ top: "46%", left: 40 }} delay={0.25} drift={8}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="hud-value" style={{ fontSize: 26 }}>
            24°
          </span>
          <span style={{ color: "var(--mute)", fontSize: 13 }}>Clear · feels 22°</span>
        </div>
      </Widget>

      <Widget title="TASKS" style={{ top: "20%", right: 40 }} delay={0.18}>
        {[
          ["Ship the Sphere", true],
          ["Wire FastAPI", false],
          ["Voice barge-in", false],
        ].map(([label, urgent]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: urgent ? "var(--alert)" : "var(--accent)",
                boxShadow: `0 0 10px ${urgent ? "var(--alert)" : "var(--accent)"}`,
              }}
            />
            <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{label as string}</span>
          </div>
        ))}
      </Widget>

      <Widget title="NOW PLAYING" style={{ top: "46%", right: 40 }} delay={0.32} drift={7}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--soft-white)" }}>Deep Focus</div>
            <div style={{ fontSize: 11, color: "var(--mute)" }}>Ambient · Flow</div>
          </div>
          <Eq />
        </div>
      </Widget>

      <Widget title="FOCUS" style={{ bottom: "16%", left: "50%", transform: "translateX(-50%)", width: 150 }} delay={0.4}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
          <span className="hud-value accent" style={{ fontSize: 24 }}>
            87
          </span>
          <span style={{ color: "var(--mute)", fontSize: 12 }}>/ 100 flow</span>
        </div>
      </Widget>
    </>
  );
}
