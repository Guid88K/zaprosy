"use client";

import { useState } from "react";
import { deleteInvitation } from "@/lib/actions/invitations";
import { SubmitButton } from "./SubmitButton";

export function DeleteInvitationButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn-ghost text-red-600 dark:text-red-400" onClick={() => setConfirming(true)}>
        Видалити запрошення
      </button>
    );
  }

  return (
    <form action={deleteInvitation} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm text-muted">Точно видалити разом із відповідями?</span>
      <SubmitButton className="btn bg-red-600 text-white hover:bg-red-700" pendingText="Видаляю…">
        Так, видалити
      </SubmitButton>
      <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
        Скасувати
      </button>
    </form>
  );
}
