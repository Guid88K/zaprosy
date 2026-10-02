import { setNoMode } from "@/lib/actions/invitations";
import { noModeMeta, noModes, type NoModeId } from "@/lib/screens";
import { SubmitButton } from "./SubmitButton";

export function NoModeToggle({ id, noMode }: { id: string; noMode: NoModeId }) {
  return (
    <section className="card">
      <h2 className="font-semibold">Кнопка «ні»: {noModeMeta[noMode].name}</h2>
      <p className="mt-1 text-sm text-muted">{noModeMeta[noMode].hint}. Змінюється миттєво, без редагування екранів.</p>
      <form action={setNoMode} className="mt-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <select name="noMode" defaultValue={noMode} className="field w-auto">
          {noModes.map((m) => (
            <option key={m} value={m}>
              {noModeMeta[m].name}
            </option>
          ))}
        </select>
        <SubmitButton className="btn-secondary" pendingText="Зберігаю…">
          Застосувати
        </SubmitButton>
      </form>
    </section>
  );
}
