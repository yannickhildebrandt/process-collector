import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title + back button */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Markdown section skeleton */}
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* BPMN section skeleton */}
      <div className="rounded-lg border p-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}
