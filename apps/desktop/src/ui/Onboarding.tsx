import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KEY = "friday.onboarded";

const ROWS: Array<[string, string]> = [
  ["Speak", "Press Space (or tap ◉) and talk. Try “Friday, brief me.”"],
  ["Commands", "⌘K or / opens the command palette."],
  ["Double-clap", "Enable always-listening clap-to-wake in Settings."],
  ["Surfaces", "The left rail opens Brief · Second Brain · Timeline · Vision."],
  ["Transform", "Say “focus mode”, “space world”, or “take command.”"],
];

/** First-run introduction. Emerges from the core, shown once. */
export function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof localStorage === "undefined" || localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setShow(true), 4300); // after boot + greeting
    return () => clearTimeout(t);
  }, []);

  const done = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={done}
          style={{ position: "fixed", inset: 0, zIndex: 25, display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(4,8,16,0.4), rgba(4,6,10,0.8))" }}
        >
          <motion.div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.2, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.12, filter: "blur(18px)" }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            style={{ width: "min(520px, 88vw)", padding: "26px 28px" }}
          >
            <div style={{ fontFamily: "var(--font-hud)", letterSpacing: "0.22em", fontSize: 16, marginBottom: 4 }}>
              MEET FRIDAY
            </div>
            <div style={{ color: "var(--mute)", fontSize: 13, marginBottom: 18 }}>
              An intelligence living in your machine. Here's how to talk to it.
            </div>
            <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
              {ROWS.map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span className="hud-label accent" style={{ width: 96, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 14, color: "var(--soft-white)" }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="friday-btn" onClick={done} style={{ width: "100%", padding: "12px" }}>
              Begin
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
