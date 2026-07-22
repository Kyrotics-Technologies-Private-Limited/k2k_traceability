import { Skeleton } from "@/components/ui/skeleton";

export function CustomerVerificationLoading() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#f8faf6] to-[#eaf2e8] p-6 overflow-hidden flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-[400px] rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
