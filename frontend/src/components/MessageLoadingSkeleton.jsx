function MessageLoadingSkeleton() {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-hover)', flexShrink: 0 }} />
          <div style={{ height: '40px', borderRadius: '16px', background: 'var(--bg-secondary)', width: `${[38,55,32,58,42][i]}%` }} />
        </div>
      ))}
    </div>
  );
}
export default MessageLoadingSkeleton;