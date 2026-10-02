import { setNoMode } from "@/lib/actions/invitations";
import type { NoMode } from "@/db/schema";
import { SubmitButton } from "./SubmitButton";

export function NoModeToggle({ id, noMode }: { id: string; noMode: NoMode }) {
  const runaway = noMode === "runaway";
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Кнопка «ні» {runaway ? "тікає 😏" : "звичайна"}</h2>
          <p className="mt-1 text-sm text-muted">
            {runaway
              ? "Відповісти «ні» неможливо: кнопка відстрибує від курсора, а «Так» росте. Сервер теж не приймає «ні»."
              : "Отримувач може чесно відповісти «ні». Увімкніть режим утікання, якщо хочете лишити тільки «Так»."}
          </p>
        </div>
        <form action={setNoMode}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="noMode" value={runaway ? "allow" : "runaway"} />
          <SubmitButton className={runaway ? "btn-secondary" : "btn-primary"} pendingText="Зберігаю…">
            {runaway ? "Повернути звичайну «ні»" : "Увімкнути утікання"}
          </SubmitButton>
        </form>
      </div>
    </section>
  );
}
