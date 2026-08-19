import Link from "next/link";
import { cn } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/validations/documents";
import { formatEnumLabel } from "@/lib/utils";

export function DocumentFilters({
  basePath,
  current,
}: {
  basePath: string;
  current?: string;
}) {
  const filters = [
    { value: "", label: "All" },
    ...DOCUMENT_CATEGORIES.map((category) => ({
      value: category,
      label: formatEnumLabel(category),
    })),
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const href = filter.value ? `${basePath}?category=${filter.value}` : basePath;
        const active = (current ?? "") === filter.value;
        return (
          <Link
            key={filter.label}
            href={href}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-3 text-sm capitalize",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-muted hover:text-foreground",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
