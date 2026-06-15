import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bus } from "../core/eventBus";

interface Toast { id: number; level: "info" | "warn" | "alert"; message: string }
let seq = 0;

const COLOR = { info: "var(--accent)", warn: "#ffcf5e", alert: "var(--alert)" };

/** Ambient notifications — system actions, links, nudges. Auto-dismiss, stacked. */
export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return bus.on("notify", ({ level, message }) => {
      const t: Toast = { id: ++seq, level, message };
      setToasts((s) => [...s.slice(-4), t]);
      setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 3600);
    });
  }, []);

  return (
    <div style={{ position: "fixed", right: 28, top: 84, zIndex: 30, display: "grid", gap: 8, justifyItems: "end", pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="glass"
            initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 30, filter: "blur(8px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, maxWidth: 320 }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR[t.level], boxShadow: `0 0 10px ${COLOR[t.level]}` }} />
            <span style={{ fontSize: 13, color: "var(--soft-white)" }}>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
