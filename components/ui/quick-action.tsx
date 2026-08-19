import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuickAction({
  href,
  title,
  description,
  comingSoon = false,
}: {
  href?: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  const content = (
    <Card
      className={cn(
        "h-full min-h-[5.5rem] transition-colors",
        comingSoon ? "opacity-90" : "hover:border-accent/30",
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{comingSoon ? "Coming soon" : description}</p>
    </Card>
  );

  if (comingSoon || !href) {
    return (
      <div aria-disabled="true" className="block">
        {content}
      </div>
    );
  }

  return <Link href={href} className="block">{content}</Link>;
}
