"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопіюйте посилання вручну:", url);
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-primary">
      {copied ? "Скопійовано ✓" : "Скопіювати посилання"}
    </button>
  );
}
