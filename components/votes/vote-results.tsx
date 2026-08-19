export function VoteResults({
  options,
  total,
}: {
  options: { id: string; label: string; count: number }[];
  total: number;
}) {
  if (total === 0) {
    return <p className="text-sm text-muted">No votes yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {options.map((option) => {
        const percent = Math.round((option.count / total) * 100);
        return (
          <li key={option.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span>{option.label}</span>
              <span className="text-muted">
                {option.count} · {percent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-card-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
