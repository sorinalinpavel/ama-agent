// Drifting accent grid behind everything, masked to a soft radial vignette.
export function Background() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage:
          "linear-gradient(to right,color-mix(in srgb,var(--ac,#3dff99) 6%,transparent) 1px,transparent 1px),linear-gradient(to bottom,color-mix(in srgb,var(--ac,#3dff99) 6%,transparent) 1px,transparent 1px)",
        backgroundSize: "46px 46px",
        mask: "radial-gradient(120% 90% at 50% 30%,#000 10%,transparent 75%)",
        WebkitMask:
          "radial-gradient(120% 90% at 50% 30%,#000 10%,transparent 75%)",
        animation: "drift 9s linear infinite",
        animationPlayState: "var(--anim,running)",
      }}
    />
  );
}
