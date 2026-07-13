type UnreadBadgeProps = {
  count: number;
  className?: string;
};

export default function UnreadBadge({ count, className = "" }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ${className}`}
    >
      {label}
    </span>
  );
}
