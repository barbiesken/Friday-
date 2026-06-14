import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The cinematic boot. Black → energy point → sphere forms (overlay clears to
 * reveal the live Sphere beneath) → scan lines → greeting. Entire sequence ≤ 4s.
 */
export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600); // point → forms
    const t2 = setTimeout(() => setPhase(2), 1500); // reveal + scanline
    const t3 = setTimeout(() => setPhase(3), 2300); // greeting
    const t4 = setTimeout(() => onComplete(), 3200); // hand off to FRIDAY
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="boot"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 2 ? 0 : 1 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#04060a",
        display: "grid",
        placeItems: "center",
        pointerEvents: phase >= 2 ? "none" : "auto",
      }}
    >
      {/* energy point */}
      <AnimatePresence>
        {phase < 2 && (
          <motion.div
            key="point"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: phase === 0 ? [0, 1, 0.8] : [0.8, 6, 14],
              opacity: phase === 0 ? [0, 1, 0.9] : [0.9, 0.5, 0],
            }}
            transition={{ duration: phase === 0 ? 0.9 : 1.0, ease: "easeOut" }}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "radial-gradient(circle, #eaf4ff, #36b9ff 50%, rgba(54,185,255,0) 72%)",
              boxShadow: "0 0 60px 12px rgba(54,185,255,.8)",
            }}
          />
        )}
      </AnimatePresence>

      {/* scan-line sweep */}
      {phase >= 1 && phase < 3 && (
        <motion.div
          initial={{ y: "-12%", opacity: 0 }}
          animate={{ y: "112%", opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #7fd3ff, transparent)",
            boxShadow: "0 0 24px #36b9ff",
          }}
        />
      )}
    </motion.div>
  );
}

/** The greeting block that resolves around the Sphere after boot. */
export function BootGreeting({ show }: { show: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: "16%",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-hud)",
              fontSize: "clamp(22px, 3.4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {greeting}, <span className="accent">Aaryan</span>.
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center" }}>
            {[
              ["TODAY", "Fri · 14 Jun"],
              ["ENERGY", "High"],
              ["MEETINGS", "3"],
              ["PRIORITY", "Ship the Sphere"],
            ].map(([k, v]) => (
              <div key={k} className="chip" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span className="hud-label">{k}</span>
                <span className="hud-value" style={{ fontSize: 13 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
