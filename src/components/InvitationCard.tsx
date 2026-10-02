import { formatEventDate } from "@/lib/format";
import { fontClassByKey, type Template } from "@/lib/templates";

export type InvitationCardData = {
  recipientName: string;
  question: string;
  message?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  place?: string | null;
};

type Props = {
  template: Template;
  data: InvitationCardData;
  children?: React.ReactNode;
  compact?: boolean;
};

export function InvitationCard({ template: t, data, children, compact = false }: Props) {
  const when = formatEventDate(data.eventDate ?? null, data.eventTime ?? null);
  const recipient = data.recipientName.trim() || "Друже";
  const question = data.question.trim() || "Підеш зі мною на побачення?";

  return (
    <div
      className={`w-full rounded-3xl border shadow-xl backdrop-blur-md ${compact ? "p-6" : "p-8 sm:p-10"} ${fontClassByKey[t.font]}`}
      style={{ background: t.card, color: t.text, borderColor: t.border }}
    >
      <div className="text-center">
        <div className={`${compact ? "text-3xl" : "text-5xl"} leading-none`} aria-hidden>
          {t.emoji}
        </div>
        <p
          className={`mt-4 ${t.font === "script" ? "text-2xl" : "text-sm uppercase tracking-[0.2em]"} `}
          style={{ color: t.muted }}
        >
          {recipient},
        </p>
        <h1
          className={`mt-2 text-balance font-semibold leading-tight ${
            compact
              ? t.font === "script" ? "text-3xl" : "text-2xl"
              : t.font === "script" ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
          }`}
        >
          {question}
        </h1>
        {data.message ? (
          <p
            className={`mx-auto mt-5 max-w-prose whitespace-pre-line text-pretty ${
              compact ? "text-sm" : t.font === "script" ? "text-2xl" : "text-base sm:text-lg"
            }`}
            style={{ color: t.muted }}
          >
            {data.message}
          </p>
        ) : null}
      </div>

      {when || data.place ? (
        <dl
          className={`mt-6 grid gap-3 rounded-2xl border p-4 text-left ${compact ? "text-sm" : "text-base"} ${
            t.font === "script" ? "font-sans" : ""
          }`}
          style={{ borderColor: t.border }}
        >
          {when ? (
            <div className="flex items-start gap-3">
              <span aria-hidden>📅</span>
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Коли</dt>
                <dd className="font-medium first-letter:uppercase">{when}</dd>
              </div>
            </div>
          ) : null}
          {data.place ? (
            <div className="flex items-start gap-3">
              <span aria-hidden>📍</span>
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Де</dt>
                <dd className="font-medium">{data.place}</dd>
              </div>
            </div>
          ) : null}
        </dl>
      ) : null}

      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
