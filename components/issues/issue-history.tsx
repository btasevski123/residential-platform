import { displayName, formatDateTime, formatEnumLabel } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: Date;
  changedBy: { firstName: string; lastName: string };
};

export function IssueHistory({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No history yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative border-l border-border pl-4">
          <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-accent" />
          <p className="text-sm font-medium">
            {entry.fromStatus
              ? `Status changed to ${formatEnumLabel(entry.toStatus)}`
              : "Reported"}
          </p>
          <p className="mt-1 text-xs text-muted">{formatDateTime(entry.createdAt)}</p>
          {entry.fromStatus ? (
            <p className="text-xs text-muted">by {displayName(entry.changedBy)}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
