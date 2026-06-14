import { useEffect, useState } from "react";
import { SphereScene } from "./scene/SphereScene";
import { BootSequence, BootGreeting } from "./boot/BootSequence";
import { HUD } from "./hud/HUD";
import { ModuleRail } from "./hud/ModuleRail";
import { CommandCenter } from "./command-center/CommandCenter";
import { Conversation } from "./voice/Conversation";
import { Overlays } from "./ui/Overlays";
import { Modes } from "./ui/Modes";
import { useFriday } from "./core/store";
import { startOrchestrator, bootComplete } from "./core/orchestrator";

export function App() {
  const booted = useFriday((s) => s.booted);
  const setBooted = useFriday((s) => s.setBooted);
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    startOrchestrator();
  }, []);

  return (
    <div className="friday-stage scanlines">
      <div className="scene-layer">
        <SphereScene />
      </div>

      {/* colour atmosphere over the canvas */}
      <div className="aura-layer">
        <div className="aura a" />
        <div className="aura b" />
      </div>

      {/* holographic frame */}
      <div className="bracket tl" />
      <div className="bracket tr" />
      <div className="bracket bl" />
      <div className="bracket br" />

      <div className="hud-layer">
        {booted && (
          <>
            <ModuleRail />
            <HUD />
            <CommandCenter />
            <Modes />
            <Conversation />
            <Overlays />
          </>
        )}
        <BootGreeting show={showGreeting} />
      </div>

      {!booted && (
        <BootSequence
          onComplete={() => {
            setBooted(true);
            bootComplete();
            setShowGreeting(true);
            setTimeout(() => setShowGreeting(false), 5200);
          }}
        />
      )}
    </div>
  );
}
