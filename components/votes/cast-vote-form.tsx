"use client";

import { useActionState } from "react";
import { castVoteAction } from "@/lib/votes/actions";
import { initialActionState } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export function CastVoteForm({
  voteId,
  options,
}: {
  voteId: string;
  options: { id: string; label: string }[];
}) {
  const action = castVoteAction.bind(null, voteId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Your choice</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
          >
            <input type="radio" name="optionId" value={option.id} required className="size-4 accent-accent" />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </fieldset>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Cast vote"}
      </Button>
    </form>
  );
}
