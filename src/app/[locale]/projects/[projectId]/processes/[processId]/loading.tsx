export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
