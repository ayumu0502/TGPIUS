import AppSkeleton from "@/components/ui/AppSkeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[var(--content-bg)]">
      <AppSkeleton variant="page" />
    </div>
  );
}
