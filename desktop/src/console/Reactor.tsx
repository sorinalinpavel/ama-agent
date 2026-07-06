// The AMA "reactor" — animated presence orb: volumetric halo, flat HUD rings,
// a 3D gyroscope (3 counter-rotating rings), a living eye core (iris/pupil that
// looks around + dilates), ambient particles, and listening pulse rings.
import { useEffect, useRef, useState } from "react";

const play = { animationPlayState: "var(--anim,running)" } as const;
const BAR_COUNT = 64;

// Circular equalizer that opens around the orb while AMA speaks. Self-animates
// with traveling waves; `level` (real audio amplitude, when available) scales it.
function WaveBars({ speaking, level }: { speaking: boolean; level: number }) {
  const [bars, setBars] = useState<number[]>(() => new Array(BAR_COUNT).fill(0));
  const levelRef = useRef(0);
  levelRef.current = level;
  useEffect(() => {
    if (!speaking) {
      setBars(new Array(BAR_COUNT).fill(0));
      return;
    }
    let raf = 0;
    let t = 0;
    const loop = () => {
      t += 0.09;
      const lvl = levelRef.current;
      const next = new Array(BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        const w =
          (0.5 + 0.5 * Math.sin(t * 2.1 + i * 0.5)) *
          (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3.7 - i * 0.27)));
        next[i] = 0.08 + w * (0.5 + 0.5 * lvl);
      }
      setBars(next);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [speaking]);
  return (
    <div style={{ position: "absolute", inset: 0, margin: "auto", width: 0, height: 0, zIndex: 1, pointerEvents: "none" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 3,
            height: 6 + h * 48,
            marginLeft: -1.5,
            borderRadius: 3,
            background: "var(--ac,#3dff99)",
            boxShadow: `0 0 ${4 + h * 9}px var(--ac,#3dff99)`,
            transformOrigin: "center top",
            transform: `rotate(${(360 / BAR_COUNT) * i}deg) translateY(150px)`,
            opacity: speaking ? 0.92 : 0,
            transition: "opacity .3s ease",
          }}
        />
      ))}
    </div>
  );
}

export function Reactor({
  listening,
  speaking = false,
  level = 0,
}: {
  listening: boolean;
  speaking?: boolean;
  level?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 400,
        height: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${listening ? 1.07 : 1})`,
        transition: "transform .85s cubic-bezier(.34,1.5,.5,1)",
      }}
    >
      {/* volumetric halo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 440,
          height: 440,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,color-mix(in srgb,var(--ac,#3dff99) 26%,transparent) 0%,color-mix(in srgb,var(--ac,#3dff99) 8%,transparent) 36%,transparent 62%)",
          filter: "blur(18px)",
          animation: "breathe 5s ease-in-out infinite",
          ...play,
        }}
      />

      {/* flat HUD rings */}
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        style={{ position: "absolute", inset: 0 }}
      >
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke="rgba(234,241,238,.08)"
          strokeWidth="1"
          strokeDasharray="1 6"
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: "spin 120s linear infinite",
            ...play,
          }}
        />
        <circle
          cx="200"
          cy="200"
          r="176"
          fill="none"
          stroke="var(--ac,#3dff99)"
          strokeWidth="1.5"
          strokeDasharray="74 118 18 118"
          opacity=".7"
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: "spinR 42s linear infinite",
            ...play,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 376,
          height: 376,
          borderRadius: "50%",
          background:
            "repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--ac,#3dff99) 55%,transparent) 0deg .45deg,transparent .45deg 5deg)",
          mask: "radial-gradient(circle,transparent 178px,#000 179px,#000 186px,transparent 187px)",
          WebkitMask:
            "radial-gradient(circle,transparent 178px,#000 179px,#000 186px,transparent 187px)",
          opacity: 0.5,
          animation: "spin 150s linear infinite",
          ...play,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg,transparent 0deg,transparent 250deg,color-mix(in srgb,var(--ac,#3dff99) 42%,transparent) 348deg,transparent 360deg)",
          mask: "radial-gradient(circle,transparent 64px,#000 65px)",
          WebkitMask: "radial-gradient(circle,transparent 64px,#000 65px)",
          animation: "spin 7s linear infinite",
          ...play,
        }}
      />

      {/* 3D gyroscope */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 320,
          height: 320,
          perspective: "880px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: "rotateX(-17deg) rotateZ(7deg)",
          }}
        >
          {[
            { size: 320, anim: "axisA 17s", border: "2px solid color-mix(in srgb,var(--ac,#3dff99) 78%,transparent)", shadow: "0 0 26px color-mix(in srgb,var(--ac,#3dff99) 30%,transparent),inset 0 0 26px color-mix(in srgb,var(--ac,#3dff99) 16%,transparent)" },
            { size: 258, anim: "axisB 12s", border: "1.5px solid color-mix(in srgb,var(--ac,#3dff99) 52%,transparent)", shadow: "0 0 20px color-mix(in srgb,var(--ac,#3dff99) 20%,transparent)" },
            { size: 202, anim: "axisC 21s", border: "1.5px solid color-mix(in srgb,var(--ac,#3dff99) 68%,transparent)", shadow: "0 0 20px color-mix(in srgb,var(--ac,#3dff99) 26%,transparent),inset 0 0 14px color-mix(in srgb,var(--ac,#3dff99) 14%,transparent)" },
          ].map((ring, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                style={{
                  width: ring.size,
                  height: ring.size,
                  borderRadius: "50%",
                  border: ring.border,
                  boxShadow: ring.shadow,
                  transformStyle: "preserve-3d",
                  animation: `${ring.anim} linear infinite`,
                  ...play,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: i === 1 ? 9 : 11,
                    height: i === 1 ? 9 : 11,
                    borderRadius: "50%",
                    background: i === 1 ? "rgba(234,241,238,.9)" : "var(--ac,#3dff99)",
                    boxShadow:
                      i === 1
                        ? "0 0 12px rgba(234,241,238,.6)"
                        : "0 0 14px var(--ac,#3dff99)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* listening pulse rings */}
      {listening && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 230,
              height: 230,
              borderRadius: "50%",
              border: "1px solid var(--ac,#3dff99)",
              animation: "pulseRing 1.8s ease-out infinite",
              ...play,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 230,
              height: 230,
              borderRadius: "50%",
              border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 55%,transparent)",
              animation: "pulseRing 1.8s ease-out infinite .9s",
              ...play,
            }}
          />
        </>
      )}

      <WaveBars speaking={speaking} level={level} />

      {/* living eye core */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: 138,
          height: 138,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 40% 34%,color-mix(in srgb,var(--ac,#3dff99) 24%,#03150e) 0%,#02100b 50%,color-mix(in srgb,var(--ac,#3dff99) 34%,#03130c) 80%,color-mix(in srgb,var(--ac,#3dff99) 80%,#eafff5) 95%,#eafff5 100%)",
          boxShadow:
            "0 0 54px color-mix(in srgb,var(--ac,#3dff99) 52%,transparent),0 0 110px color-mix(in srgb,var(--ac,#3dff99) 26%,transparent),inset 0 0 22px rgba(2,16,11,.7)",
          animation: "breathe 5s ease-in-out infinite",
          ...play,
        }}
      >
        {/* eye that looks around */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 108,
            height: 108,
            animation: "saccade 9s ease-in-out infinite",
            ...play,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 108,
              height: 108,
              borderRadius: "50%",
              background:
                "repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--ac,#3dff99) 80%,transparent) 0deg .9deg,transparent .9deg 3.4deg)",
              opacity: 0.7,
              animation: "spin 30s linear infinite,irisFlow 6s ease-in-out infinite",
              ...play,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 108,
              height: 108,
              borderRadius: "50%",
              background:
                "repeating-conic-gradient(from 0deg,rgba(234,241,238,.55) 0deg .5deg,transparent .5deg 6deg)",
              opacity: 0.4,
              animation: "spinR 44s linear infinite",
              ...play,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 108,
              height: 108,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,#02100b 14%,transparent 46%,transparent 82%,color-mix(in srgb,var(--ac,#3dff99) 18%,transparent) 100%)",
              boxShadow:
                "inset 0 0 0 2px color-mix(in srgb,var(--ac,#3dff99) 85%,#eafff5),inset 0 0 16px color-mix(in srgb,var(--ac,#3dff99) 45%,transparent)",
            }}
          />
          {/* pupil */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 46,
              height: 46,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 50%,#03170f 0%,#010705 72%)",
              boxShadow:
                "0 0 18px color-mix(in srgb,var(--ac,#3dff99) 50%,transparent),inset 0 0 10px color-mix(in srgb,var(--ac,#3dff99) 28%,transparent)",
              transformOrigin: "center",
              animation: "pupil 7.5s ease-in-out infinite",
              ...play,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "1px solid color-mix(in srgb,var(--ac,#3dff99) 40%,transparent)",
              }}
            />
          </div>
        </div>
        {/* wet catchlight */}
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            top: 34,
            left: 42,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,#eafff5 0%,rgba(234,255,245,.4) 45%,transparent 72%)",
            opacity: 0.8,
          }}
        />
      </div>

      {/* ambient particles */}
      {[
        { top: 40, left: 70, w: 3, c: "var(--ac,#3dff99)", glow: true, anim: "floatP 6s ease-in-out infinite" },
        { top: 80, right: 54, w: 4, c: "var(--ac,#3dff99)", glow: true, anim: "floatP 7.5s ease-in-out infinite 1s" },
        { bottom: 64, left: 48, w: 3, c: "rgba(234,241,238,.8)", glow: false, anim: "floatP 5.5s ease-in-out infinite .6s" },
        { bottom: 48, right: 78, w: 3, c: "var(--ac,#3dff99)", glow: true, anim: "floatP 8s ease-in-out infinite 1.6s" },
        { top: 140, left: 24, w: 2, c: "rgba(234,241,238,.7)", glow: false, anim: "floatP 6.8s ease-in-out infinite .3s" },
      ].map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            width: p.w,
            height: p.w,
            borderRadius: "50%",
            background: p.c,
            boxShadow: p.glow ? `0 0 ${p.w + 4}px var(--ac,#3dff99)` : "none",
            animation: p.anim,
            ...play,
          }}
        />
      ))}
    </div>
  );
}
