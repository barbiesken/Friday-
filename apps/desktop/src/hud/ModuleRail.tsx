import { useState } from "react";
import { motion } from "framer-motion";

const MODULES = [
  { key: "sphere", glyph: "◉", label: "Sphere" },
  { key: "calendar", glyph: "▦", label: "Calendar" },
  { key: "tasks", glyph: "✓", label: "Tasks" },
  { key: "memory", glyph: "◈", label: "Second Brain" },
  { key: "vision", glyph: "◎", label: "Vision" },
  { key: "system", glyph: "⌬", label: "System" },
];

/** Left module rail — the always-present navigation glyphs. */
export function ModuleRail() {
  const [active, setActive] = useState("sphere");
  return (
    <motion.div
      className="rail glass"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: 8, borderRadius: 18 }}
    >
      {MODULES.map((m) => (
        <button
          key={m.key}
          className={`rail__item${active === m.key ? " active" : ""}`}
          onClick={() => setActive(m.key)}
          title={m.label}
          style={{ background: "transparent", border: "1px solid transparent" }}
        >
          {m.glyph}
        </button>
      ))}
    </motion.div>
  );
}
