"use client";

import { useActionState } from "react";
import { updateIssueStatusAction } from "@/lib/issues/actions";
import { initialActionState } from "@/lib/errors";
import { ISSUE_STATUSES } from "@/lib/validations/issues";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEnumLabel } from "@/lib/utils";
import type { IssueStatus } from "@/generated/prisma/enums";

export function IssueStatusForm({ issueId, status }: { issueId: string; status: IssueStatus }) {
  const action = updateIssueStatusAction.bind(null, issueId);
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <Label htmlFor="status">Status</Label>
      <Select id="status" name="status" defaultValue={status}>
        {ISSUE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {formatEnumLabel(value)}
          </option>
        ))}
      </Select>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
}
