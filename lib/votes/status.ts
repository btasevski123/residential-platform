export type VoteLifecycle = "UPCOMING" | "OPEN" | "CLOSED";

export function getVoteLifecycle(
  vote: { startsAt: Date; endsAt: Date },
  now = new Date(),
): VoteLifecycle {
  if (now < vote.startsAt) {
    return "UPCOMING";
  }

  if (now > vote.endsAt) {
    return "CLOSED";
  }

  return "OPEN";
}
