"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createVoteAction } from "@/lib/votes/actions";
import { initialActionState } from "@/lib/errors";
import { MAX_VOTE_OPTIONS } from "@/lib/validations/votes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultWindow() {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    startsAt: toDatetimeLocalValue(startsAt),
    endsAt: toDatetimeLocalValue(endsAt),
  };
}

export function VoteForm({ cancelHref }: { cancelHref: string }) {
  const [state, formAction, pending] = useActionState(createVoteAction, initialActionState);
  const [optionCount, setOptionCount] = useState(2);
  const defaults = defaultWindow();

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="Facade renovation this autumn" />
        {state.fieldErrors?.title ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.title}</p> : null}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={6}
          placeholder="Explain what residents are deciding and when the outcome will be used."
        />
        {state.fieldErrors?.description ? (
          <p className="mt-1 text-sm text-danger">{state.fieldErrors.description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startsAt">Starts</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={defaults.startsAt} />
          {state.fieldErrors?.startsAt ? (
            <p className="mt-1 text-sm text-danger">{state.fieldErrors.startsAt}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="endsAt">Ends</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required defaultValue={defaults.endsAt} />
          {state.fieldErrors?.endsAt ? <p className="mt-1 text-sm text-danger">{state.fieldErrors.endsAt}</p> : null}
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Options</legend>
        {Array.from({ length: optionCount }).map((_, index) => (
          <div key={index}>
            <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
            <Input
              id={`option-${index}`}
              name="options"
              required={index < 2}
              maxLength={80}
              placeholder={index === 0 ? "Approve" : index === 1 ? "Request more offers" : `Option ${index + 1}`}
            />
          </div>
        ))}
        {state.fieldErrors?.options ? <p className="text-sm text-danger">{state.fieldErrors.options}</p> : null}
        <div className="flex flex-wrap gap-2">
          {optionCount < MAX_VOTE_OPTIONS ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setOptionCount((count) => count + 1)}>
              Add option
            </Button>
          ) : null}
          {optionCount > 2 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOptionCount((count) => count - 1)}>
              Remove last option
            </Button>
          ) : null}
        </div>
      </fieldset>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create vote"}
        </Button>
      </div>
    </form>
  );
}
