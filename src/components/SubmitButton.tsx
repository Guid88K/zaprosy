"use client";

import { useFormStatus } from "react-dom";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function SubmitButton({ children, pendingText, className = "btn-primary", style }: Props) {
  const { dict } = useI18n();
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} style={style} disabled={pending} aria-busy={pending}>
      {pending ? (pendingText ?? dict.common.wait) : children}
    </button>
  );
}
