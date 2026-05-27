import type { CSSProperties } from "react";

export type AIStatus = "idle" | "listening" | "streaming" | "thinking";

const TEAL = "#00E5FF";
const PURPLE = "#7C4DFF";

// ── Shape renderers ────────────────────────────────────────────────────────────
// Each shape is self-contained. Inline styles are used only for animation specs
// that can't be expressed in Tailwind (keyframe names, multi-value transforms).

const IdleShape = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden>
    <polygon points="12,2 22,12 12,22 2,12" fill={TEAL} />
  </svg>
);

const ListeningShape = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    width="100%"
    height="100%"
    aria-hidden
    style={{ animation: "si-listen-pulse 2s ease-in-out infinite" }}
  >
    <polygon points="12,3 21.5,20.5 2.5,20.5" fill={TEAL} />
  </svg>
);

const StreamingShape = () => (
  <div
    className="w-full h-full"
    style={{ animation: "si-stream-pulse 1.5s ease-in-out infinite" }}
  >
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden>
      <polygon points="12,2 22,12 12,22 2,12" fill={PURPLE} />
    </svg>
  </div>
);

// Thinking: two rounded rects that counter-rotate at different speeds.
// Color is animated via CSS fill keyframes on each rect directly — no hue-rotate,
// which would cause green. Both rects share the same color timing.
const ThinkingShape = () => (
  <div className="relative w-full h-full">
    {/* Rect A: wider landscape rect, rotates clockwise */}
    <div
      className="absolute inset-0"
      style={{ animation: "si-think-a 4s linear infinite", transformOrigin: "center" }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
        <rect
          x="3.5"
          y="7"
          width="17"
          height="10"
          rx="3"
          style={{ fill: PURPLE, animation: "si-think-color 2.8s ease-in-out infinite" }}
        />
      </svg>
    </div>

    {/* Rect B: taller portrait rect, counter-clockwise, slightly slower */}
    <div
      className="absolute inset-0"
      style={{ animation: "si-think-b 5.5s linear infinite", transformOrigin: "center" }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
        <rect
          x="7"
          y="3.5"
          width="10"
          height="17"
          rx="3"
          style={{
            fill: PURPLE,
            fillOpacity: 0.65,
            animation: "si-think-color 2.8s ease-in-out infinite",
          }}
        />
      </svg>
    </div>
  </div>
);

// ── Per-status wrapper styles ──────────────────────────────────────────────────

// Idle gets a static glow filter — no keyframe animation.
const IDLE_FILTER = "drop-shadow(0 0 8px rgba(0,229,255,0.5))";

// ── StrydeStatusIcon ───────────────────────────────────────────────────────────
// All four shape wrappers are always mounted. Only the active one is visible.
// CSS transitions on opacity + transform produce the cross-fade — no JS timers,
// no leaving[] arrays, no remounts. One shape visible at a time, guaranteed.

interface StrydeStatusIconProps {
  status: AIStatus;
  size?: number;
}

const TRANSITION = "opacity 350ms ease, transform 350ms cubic-bezier(0.4, 0, 0.2, 1)";

const INACTIVE: CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0,
  transform: "scale(0.65)",
  transition: TRANSITION,
  pointerEvents: "none",
  willChange: "opacity, transform",
};

const ACTIVE: CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 1,
  transform: "scale(1)",
  transition: TRANSITION,
  willChange: "opacity, transform",
};

export const StrydeStatusIcon = ({ status, size = 28 }: StrydeStatusIconProps) => {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      data-si-status={status}
      role="img"
      aria-label={`AI status: ${status}`}
    >
      {/* Idle */}
      <div style={status === "idle" ? { ...ACTIVE, filter: IDLE_FILTER } : INACTIVE}>
        <IdleShape />
      </div>

      {/* Listening */}
      <div style={status === "listening" ? ACTIVE : INACTIVE}>
        <ListeningShape />
      </div>

      {/* Streaming */}
      <div style={status === "streaming" ? ACTIVE : INACTIVE}>
        <StreamingShape />
      </div>

      {/* Thinking */}
      <div style={status === "thinking" ? ACTIVE : INACTIVE}>
        <ThinkingShape />
      </div>
    </div>
  );
};
