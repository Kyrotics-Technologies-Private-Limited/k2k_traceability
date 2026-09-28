import { Skeleton } from "@/components/ui/skeleton";

export function CustomerVerificationLoading() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8faf6] to-[#eaf2e8] p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-5xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <Skeleton className="w-full h-64 sm:h-80 lg:h-[380px] rounded-xl lg:col-span-5" />
          <div className="space-y-4 sm:space-y-6 lg:col-span-7">
            <Skeleton className="h-8 sm:h-10 w-3/4" />
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-4 sm:h-5 w-full" />
              <Skeleton className="h-4 sm:h-5 w-5/6" />
              <Skeleton className="h-4 sm:h-5 w-2/3" />
            </div>
            <Skeleton className="h-24 sm:h-28 w-full rounded-xl" />
            <Skeleton className="h-10 sm:h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
