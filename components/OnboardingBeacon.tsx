"use client";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";

// step numbers: 1=customer, 2=asset, 3=contract, 4=plan, 5=workorder
interface Props {
  forStep: number;
  label?: string;
  children: React.ReactNode;
}

export default function OnboardingBeacon({ forStep, label, children }: Props) {
  const { step, completed } = useOnboardingStep();
  const active = !completed && step === forStep;

  if (!active) return <>{children}</>;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <style>{`
        @keyframes beacon-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          60%  { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes beacon-ring {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.6; transform:scale(1.04); }
        }
        .beacon-child { animation: beacon-ring 1.8s ease-in-out infinite; }
        .beacon-btn-wrap > * {
          outline: 2.5px solid #2563eb !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 0 rgba(37,99,235,0.5) !important;
          animation: beacon-pulse 1.8s ease-out infinite, beacon-ring 1.8s ease-in-out infinite !important;
        }
      `}</style>

      {/* Tooltip above */}
      <div style={{
        position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
        transform: "translateX(-50%)",
        background: "#0F121A", color: "#fff",
        fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
        padding: "5px 10px", borderRadius: 7,
        boxShadow: "0 4px 14px rgba(37,99,235,.4)",
        zIndex: 100, pointerEvents: "none",
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
      }}>
        {label ?? "👆 Buraya tıklayın"}
        <div style={{
          position: "absolute", top: "100%", left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid #1d4ed8",
        }}/>
      </div>

      <div className="beacon-btn-wrap">
        {children}
      </div>
    </div>
  );
}
