import AppSkeleton from "@/components/ui/AppSkeleton";

export default function FeedLoading() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AppSkeleton variant="feed" />
    </div>
  );
}
