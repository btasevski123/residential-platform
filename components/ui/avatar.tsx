import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  imageUrl,
  className,
}: {
  name: { firstName: string; lastName: string };
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={`${name.firstName} ${name.lastName}`}
        className={cn("h-9 w-9 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
