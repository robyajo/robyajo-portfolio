import { Section } from "@/components/layouts/page";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Section aria-hidden="true" className="opacity-75">
      <div className="flex flex-col gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 border-b border-line pb-6 last:border-none last:pb-0"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </Section>
  );
}
