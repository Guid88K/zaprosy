type Props = {
  variant?: "button" | "text";
  className?: string;
};

/** Посилання на донат (Buy Me a Coffee, monobank Банка тощо). Не рендериться, якщо NEXT_PUBLIC_SUPPORT_URL порожній. */
export function SupportLink({ variant = "button", className = "" }: Props) {
  const url = process.env.NEXT_PUBLIC_SUPPORT_URL;
  if (!url) return null;

  const base =
    variant === "button"
      ? "btn border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60"
      : "font-medium text-amber-700 hover:underline dark:text-amber-300";

  return (
    <a href={url} target="_blank" rel="noreferrer" className={`${base} ${className}`}>
      ☕ Підтримати проєкт
    </a>
  );
}
