import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFriday } from "../core/store";
import { submitUserText, manualWake } from "../core/orchestrator";

const PHASE_LABEL = { understanding: "UNDERSTANDING", planning: "PLANNING", executing: "EXECUTING" };

/** Thinking transparency — never hide what FRIDAY is doing. */
function ThinkingStack() {
  const thinking = useFriday((s) => s.thinking);
  return (
    <AnimatePresence>
      {thinking.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{ display: "grid", gap: 6, justifyItems: "center", marginBottom: 14 }}
        >
          {thinking.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="chip"
              style={{ background: "var(--glass)" }}
            >
              <motion.span
                className="dot"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              <span className="hud-label" style={{ color: "var(--accent)" }}>
                {PHASE_LABEL[t.phase]}
              </span>
              <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{t.label}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The latest spoken line, emerging as a subtitle around the Sphere. */
function Subtitle() {
  const transcript = useFriday((s) => s.transcript);
  const state = useFriday((s) => s.state);
  const last = [...transcript].reverse().find((l) => l.who === "friday");
  const userPartial = [...transcript].reverse().find((l) => l.who === "user" && l.partial);

  const text = userPartial?.text ?? last?.text;
  const who = userPartial ? "user" : "friday";
  if (!text || state === "thinking") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: 620,
          textAlign: "center",
          fontFamily: "var(--font-ui)",
          fontSize: who === "friday" ? 20 : 16,
          fontWeight: who === "friday" ? 500 : 400,
          color: who === "friday" ? "var(--soft-white)" : "var(--mute)",
          marginBottom: 18,
          lineHeight: 1.4,
          textShadow: who === "friday" ? "0 0 24px rgba(54,185,255,.25)" : "none",
        }}
      >
        {who === "user" ? `“${text}”` : text}
      </motion.div>
    </AnimatePresence>
  );
}

/** Input pill — chat fallback + mic summon. */
export function Conversation() {
  const [value, setValue] = useState("");
  const state = useFriday((s) => s.state);
  const listening = state === "listening";

  const send = () => {
    const v = value.trim();
    if (!v) return;
    submitUserText(v);
    setValue("");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 96,
        left: 0,
        right: 0,
        zIndex: 5,
        display: "grid",
        justifyItems: "center",
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto", display: "grid", justifyItems: "center" }}>
        <ThinkingStack />
        <Subtitle />

        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 8px 8px 18px",
            borderRadius: 999,
            width: "min(560px, 80vw)",
          }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={listening ? "Listening…" : "Ask FRIDAY,  or press Space to speak"}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--soft-white)",
              fontFamily: "var(--font-ui)",
              fontSize: 15,
            }}
          />
          <button
            className="friday-btn"
            onClick={() => manualWake()}
            title="Speak to FRIDAY (Space)"
            style={{
              borderRadius: 999,
              width: 44,
              height: 44,
              padding: 0,
              display: "grid",
              placeItems: "center",
              borderColor: listening ? "var(--accent)" : undefined,
              boxShadow: listening ? "0 0 26px var(--accent)" : undefined,
            }}
          >
            <motion.span
              animate={listening ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 1, repeat: listening ? Infinity : 0 }}
              style={{ fontSize: 16 }}
            >
              ◉
            </motion.span>
          </button>
          <button className="friday-btn" onClick={send} style={{ borderRadius: 999 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
