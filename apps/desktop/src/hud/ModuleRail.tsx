import { motion } from "framer-motion";
import { useFriday } from "../core/store";
import type { PanelId } from "../core/types";

const MODULES: Array<{ key: string; glyph: string; panel: PanelId | null; label: string }> = [
  { key: "core", glyph: "◉", panel: null, label: "Core" },
  { key: "brief", glyph: "◳", panel: "brief", label: "Daily Brief" },
  { key: "memory", glyph: "◈", panel: "memory", label: "Second Brain" },
  { key: "permissions", glyph: "⛨", panel: "permissions", label: "Permissions" },
  { key: "settings", glyph: "⌬", panel: "settings", label: "Settings" },
];

/** Left module rail — navigation glyphs that open holographic surfaces. */
export function ModuleRail() {
  const panel = useFriday((s) => s.panel);
  const setPanel = useFriday((s) => s.setPanel);
  const activeKey = panel ?? "core";

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
          className={`rail__item${activeKey === m.key ? " active" : ""}`}
          onClick={() => setPanel(m.panel)}
          title={m.label}
          style={{ background: "transparent", border: "1px solid transparent" }}
        >
          {m.glyph}
        </button>
      ))}
    </motion.div>
  );
}
