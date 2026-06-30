import { buildDots } from "../view";

const DOTS = buildDots();

// "INITIALISING NEURAL CORE" boot screen: rippling dot grid + AMA wordmark +
// load bar. Fades out (fadingOut) then App unmounts it.
export function BootLoader({ fadingOut }: { fadingOut: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        background:
          "radial-gradient(130% 120% at 50% 42%,#0a1712 0%,#04060a 70%)",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity .65s ease",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(11,1fr)",
          gap: 14,
        }}
      >
        {DOTS.map((d, i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--ac,#3dff99)",
              boxShadow:
                "0 0 6px color-mix(in srgb,var(--ac,#3dff99) 60%,transparent)",
              transform: "scale(.32)",
              animation: "ripple 1.7s ease-in-out infinite",
              animationDelay: d.delay,
              animationPlayState: "var(--anim,running)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 15,
          animation: "loaderIn .8s ease both",
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: ".42em",
            paddingLeft: ".42em",
            color: "#eaf1ee",
          }}
        >
          AMA
        </div>
        <div
          style={{
            width: 230,
            height: 2,
            background: "rgba(234,241,238,.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              background: "var(--ac,#3dff99)",
              boxShadow: "0 0 10px var(--ac,#3dff99)",
              animation: "loadFill 2.3s cubic-bezier(.5,0,.1,1) forwards",
              animationPlayState: "var(--anim,running)",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: ".24em",
            color: "rgba(234,241,238,.45)",
          }}
        >
          INITIALISING NEURAL CORE
        </div>
      </div>
    </div>
  );
}
