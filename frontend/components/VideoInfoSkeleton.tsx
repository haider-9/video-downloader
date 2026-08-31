import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoInfoSkeleton() {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="status"
      aria-label="Loading video information"
      aria-live="polite"
    >
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-40 w-full shrink-0 rounded-lg sm:h-28 sm:w-48" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-1 flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
      <div className="border-t px-6 pt-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </Card>
  );
}
