"use client";

import { useState } from "react";
import { deleteDocumentAction } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete document"
        description={`“${title}” will be removed from this building. Residents will no longer be able to download it.`}
        confirmLabel="Delete"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          void deleteDocumentAction(documentId);
        }}
      />
    </>
  );
}
