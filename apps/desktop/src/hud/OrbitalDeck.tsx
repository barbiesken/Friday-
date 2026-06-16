import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { useFriday } from "../core/store";

/**
 * Orbital deck — the "widgets around the core" surface that defines the default
 * orbital layout. Floating glass cards drift in around the live core: the day's
 * brief, calendar, now-playing, tasks and memory. Pure presentation for now;
 * the data is illustrative until the agents feed it for real.
 */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Card({
  title,
  pos,
  delay,
  children,
}: {
  title: string;
  pos: CSSProperties;
  delay: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      style={{ position: "fixed", width: 232, padding: "14px 16px", zIndex: 4, ...pos }}
    >
      <div className="panel__title" style={{ marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
      <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{k}</span>
      <span
        className={accent ? "accent" : undefined}
        style={{ fontSize: 13, color: accent ? undefined : "var(--mute)", fontVariantNumeric: "tabular-nums" }}
      >
        {v}
      </span>
    </div>
  );
}

/** A small living equalizer for the now-playing card. */
function Equalizer() {
  const bars = [12, 20, 9, 24, 15, 21, 11];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 26, marginTop: 8 }}>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          animate={{ height: [h, Math.max(4, h * 0.35), h] }}
          transition={{ duration: 0.9 + i * 0.07, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 3,
            borderRadius: 2,
            background: "linear-gradient(to top, color-mix(in srgb, var(--accent) 30%, transparent), var(--accent))",
            boxShadow: "0 0 6px color-mix(in srgb, var(--accent) 50%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

export function OrbitalDeck() {
  const booted = useFriday((s) => s.booted);
  const layout = useFriday((s) => s.layout);
  const panel = useFriday((s) => s.panel);

  // Only in the default orbital layout, and never while an overlay is open.
  if (!booted || layout !== "orbital" || panel) return null;

  return (
    <>
      {/* faint orbit ellipses echoing the core's rings */}
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none", display: "grid", placeItems: "center" }}
      >
        {[760, 1140].map((d) => (
          <div
            key={d}
            style={{
              position: "absolute",
              width: d,
              height: d * 0.42,
              borderRadius: "50%",
              border: "1px solid rgba(127,211,255,0.10)",
            }}
          />
        ))}
      </div>

      {/* daily brief — top-center, below the bar */}
      <Card title="Daily Brief" delay={0.05} pos={{ top: 84, left: "50%", transform: "translateX(-50%)", width: 300 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div>
            <div className="hud-value accent" style={{ fontSize: 22 }}>3</div>
            <div className="hud-label">Meetings</div>
          </div>
          <div>
            <div className="hud-value accent" style={{ fontSize: 22 }}>2</div>
            <div className="hud-label">Priorities</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="hud-label" style={{ marginBottom: 6 }}>Energy</div>
            <div style={{ fontSize: 13 }}>
              High <span style={{ color: "var(--mute)" }}>→</span> Medium
            </div>
          </div>
        </div>
      </Card>

      {/* calendar — top-left */}
      <Card title="Calendar" delay={0.12} pos={{ top: 96, left: 84 }}>
        <div className="hud-label" style={{ marginBottom: 8 }}>Today · 16 Jun</div>
        <Row k="Standup" v="09:00" />
        <Row k="Design review" v="11:30" />
        <Row k="1:1 · Sam" v="14:00" />
        <Row k="Ship review" v="16:00" />
      </Card>

      {/* now playing — top-right */}
      <Card title="Music" delay={0.18} pos={{ top: 96, right: 40 }}>
        <div style={{ fontSize: 14, color: "var(--soft-white)" }}>Echoes of Terra</div>
        <div className="hud-label" style={{ marginTop: 3 }}>Stellar Synthetics</div>
        <Equalizer />
      </Card>

      {/* tasks — bottom-left */}
      <Card title="Tasks" delay={0.24} pos={{ bottom: 120, left: 84 }}>
        <Row k="Ship the core" v="now" accent />
        <Row k="Orbital deck" v="wip" />
        <Row k="Captain mode" v="next" />
        <Row k="Clap wake" v="done" />
      </Card>

      {/* memory — bottom-right */}
      <Card title="Memory" delay={0.3} pos={{ bottom: 120, right: 40 }}>
        <div className="hud-label" style={{ marginBottom: 8 }}>Captured today · 4</div>
        <div style={{ fontSize: 13, color: "var(--soft-white)" }}>“Ship the core”</div>
        <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 5 }}>Recall · cyber world</div>
      </Card>
    </>
  );
}
