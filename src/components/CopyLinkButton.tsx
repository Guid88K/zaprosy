"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export function CopyLinkButton({ url }: { url: string }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(dict.detail.copyPrompt, url);
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-primary">
      {copied ? dict.detail.copied : dict.detail.copy}
    </button>
  );
}
