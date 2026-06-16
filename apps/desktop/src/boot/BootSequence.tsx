import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The cinematic boot. Black → energy point → the core ignites (overlay clears to
 * reveal the live core beneath) → scan lines → greeting. Entire sequence ≤ 4s.
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

      {/* ignition shockwave */}
      {phase >= 1 && phase < 3 && (
        <motion.div
          initial={{ scale: 0, opacity: 0.9 }}
          animate={{ scale: 14, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "2px solid #7fd3ff",
            boxShadow: "0 0 34px #36b9ff",
          }}
        />
      )}

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
            top: "58%",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          {/* Elegant, light, near-white — the cinematic greeting, not a dashboard. */}
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "clamp(30px, 4.6vw, 60px)",
              fontWeight: 300,
              letterSpacing: "0.005em",
              color: "var(--soft-white)",
              textShadow: "0 0 44px rgba(54,185,255,0.20)",
            }}
          >
            {greeting}, Aaryan.
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: "var(--font-ui)",
              fontSize: "clamp(13px, 1.4vw, 17px)",
              fontWeight: 300,
              letterSpacing: "0.06em",
            }}
          >
            <span style={{ color: "var(--mute)" }}>Your world. </span>
            <span style={{ color: "var(--soft-white)" }}>Orchestrated.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
