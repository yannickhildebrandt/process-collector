export default function InterviewLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header skeleton */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start">
            <div className="h-20 w-3/4 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-1/2 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="flex justify-start">
            <div className="h-16 w-2/3 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Summary sidebar skeleton */}
        <div className="w-80 border-l p-4 hidden lg:block">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
