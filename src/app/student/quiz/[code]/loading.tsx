export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--qq-bg)] text-[var(--qq-ink)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[var(--qq-line)] border-t-[var(--qq-orange)]" />
        <p>Uniendo al quiz...</p>
      </div>
    </div>
  );
}
