"use client";

import { useState } from "react";
import { deleteInvitation } from "@/lib/actions/invitations";
import { useI18n } from "@/lib/i18n/client";
import { SubmitButton } from "./SubmitButton";

export function DeleteInvitationButton({ id }: { id: string }) {
  const { dict } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn-ghost text-red-600 dark:text-red-400" onClick={() => setConfirming(true)}>
        {dict.detail.delete}
      </button>
    );
  }

  return (
    <form action={deleteInvitation} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm text-muted">{dict.detail.deleteConfirm}</span>
      <SubmitButton className="btn bg-red-600 text-white hover:bg-red-700" pendingText={dict.detail.deleting}>
        {dict.detail.deleteYes}
      </SubmitButton>
      <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
        {dict.common.cancel}
      </button>
    </form>
  );
}
