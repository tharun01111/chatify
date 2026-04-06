function BorderAnimatedContainer({ children }) {
  return (
    <div
      className="w-full h-full flex overflow-hidden rounded-2xl animate-border"
      style={{
        "--border-angle": "0deg",
        background: `
          linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
          conic-gradient(
            from var(--border-angle),
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.04) 65%,
            #818cf8 78%,
            #c4b5fd 86%,
            #818cf8 93%,
            rgba(255,255,255,0.04) 100%
          ) border-box
        `,
        border: '1.5px solid transparent',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {children}
    </div>
  );
}
export default BorderAnimatedContainer;
