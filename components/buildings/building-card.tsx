import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BuildingCard({
  href,
  name,
  address,
  city,
  apartments,
  residents,
  openIssues,
}: {
  href: string;
  name: string;
  address: string;
  city: string;
  apartments: number;
  residents: number;
  openIssues: number;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-accent/30">
        <p className="text-xs uppercase tracking-wide text-muted">{city}</p>
        <h3 className="mt-2 font-serif text-xl">{name}</h3>
        <p className="mt-1 text-sm text-muted">{address}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>{apartments} apartments</Badge>
          <Badge>{residents} residents</Badge>
          <Badge variant={openIssues > 0 ? "warning" : "success"}>
            {openIssues} open issues
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
