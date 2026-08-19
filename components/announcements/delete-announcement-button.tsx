"use client";

import { useState } from "react";
import { deleteAnnouncementAction } from "@/lib/announcements/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteAnnouncementButton({ announcementId, title }: { announcementId: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete announcement"
        description={`“${title}” will be removed from this building. Residents will no longer see it.`}
        confirmLabel="Delete"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          void deleteAnnouncementAction(announcementId);
        }}
      />
    </>
  );
}
