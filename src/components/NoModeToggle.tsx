import { setNoMode } from "@/lib/actions/invitations";
import { fmt } from "@/lib/i18n";
import { getDict, getLocale } from "@/lib/i18n/server";
import { noModeMeta, noModes, type NoModeId } from "@/lib/screens";
import { SubmitButton } from "./SubmitButton";

export async function NoModeToggle({ id, noMode }: { id: string; noMode: NoModeId }) {
  const [dict, locale] = await Promise.all([getDict(), getLocale()]);
  const meta = noModeMeta(locale);
  return (
    <section className="card">
      <h2 className="font-semibold">{fmt(dict.detail.noModeTitle, { mode: meta[noMode].name })}</h2>
      <p className="mt-1 text-sm text-muted">{fmt(dict.detail.noModeHint, { hint: meta[noMode].hint })}</p>
      <form action={setNoMode} className="mt-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <select name="noMode" defaultValue={noMode} className="field w-auto">
          {noModes.map((m) => (
            <option key={m} value={m}>
              {meta[m].name}
            </option>
          ))}
        </select>
        <SubmitButton className="btn-secondary" pendingText={dict.common.saving}>
          {dict.common.apply}
        </SubmitButton>
      </form>
    </section>
  );
}
