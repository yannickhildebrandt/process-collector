export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-24 bg-muted animate-pulse rounded-lg" />
      <div className="flex justify-center">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
