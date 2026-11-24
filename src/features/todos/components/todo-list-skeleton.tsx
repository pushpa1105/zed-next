import { Skeleton } from "@/components/ui/skeleton";

export function TodoListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading todos">
      <div className="divide-y rounded-lg border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="size-8" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
