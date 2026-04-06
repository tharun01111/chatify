function UsersLoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
          <div className="size-10 rounded-full flex-shrink-0" style={{ background: 'var(--bg-hover)' }} />
          <div className="flex-1">
            <div className="h-3 rounded-lg w-2/3" style={{ background: 'var(--bg-hover)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;