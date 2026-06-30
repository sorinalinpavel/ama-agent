interface Props {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  listening: boolean;
  toggleListen: () => void;
}

// Text + voice entry. Wake word is "Hey AMA" / "Hello AMA" (openWakeWord, Phase
// 2); the mic button is the manual push-to-talk equivalent.
export function InputBar({ input, setInput, onSend, listening, toggleListen }: Props) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "min(640px,92vw)",
        padding: "8px 8px 8px 20px",
        border: "1px solid rgba(234,241,238,.12)",
        borderRadius: 17,
        background: "rgba(255,255,255,.03)",
        backdropFilter: "blur(10px)",
      }}
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
        placeholder={"Tap the mic to start talking — or type a request…"}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#eaf1ee",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
        }}
      />
      <button
        onClick={toggleListen}
        title="Tap to start a conversation — AMA replies when you pause; talk over her to interrupt"
        className="ama-btn"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          padding: "13px 0",
          background: listening ? "var(--ac,#3dff99)" : "rgba(255,255,255,.06)",
          color: listening ? "#03130c" : "#eaf1ee",
        }}
      >
        {[7, 14, 9].map((h, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: h,
              background: "currentColor",
              borderRadius: 2,
              transformOrigin: "bottom",
              animation: "bars 1s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              animationPlayState: listening ? "running" : "paused",
            }}
          />
        ))}
      </button>
      <button
        onClick={onSend}
        title="Send"
        className="ama-btn"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ac,#3dff99)",
          color: "#03130c",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="9" x2="14" y2="9" />
          <polyline points="10,5 15,9 10,13" />
        </svg>
      </button>
    </div>
  );
}
