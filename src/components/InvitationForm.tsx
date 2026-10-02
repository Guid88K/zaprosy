"use client";

import { useActionState, useState } from "react";
import { createInvitation, updateInvitation, type FormState } from "@/lib/actions/invitations";
import {
  defaultScreens,
  newScreen,
  noModeMeta,
  noModes,
  screenTypeMeta,
  screenTypes,
  type NoModeId,
  type Screen,
  type ScreenType,
} from "@/lib/screens";
import { DEFAULT_TEMPLATE_ID, getTemplate, templates } from "@/lib/templates";
import { InvitationPlayer } from "./InvitationPlayer";
import { SubmitButton } from "./SubmitButton";

export type InvitationFormInitial = {
  id: string;
  templateId: string;
  recipientName: string;
  eventDate: string | null;
  eventTime: string | null;
  place: string | null;
  noMode: NoModeId;
  screens: Screen[];
};

type Props = { initial?: InvitationFormInitial; authorName: string };

export function InvitationForm({ initial, authorName }: Props) {
  const [state, action] = useActionState<FormState, FormData>(initial ? updateInvitation : createInvitation, {});
  const [templateId, setTemplateId] = useState(initial?.templateId ?? DEFAULT_TEMPLATE_ID);
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [eventTime, setEventTime] = useState(initial?.eventTime ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [noMode, setNoMode] = useState<NoModeId>(initial?.noMode ?? "allow");
  const [screens, setScreens] = useState<Screen[]>(initial?.screens ?? defaultScreens());
  const [selected, setSelected] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const template = getTemplate(templateId);

  function updateScreen(id: string, patch: Partial<Screen>) {
    setScreens((list) => list.map((s) => (s.id === id ? ({ ...s, ...patch } as Screen) : s)));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= screens.length) return;
    setScreens((list) => {
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelected(j);
  }

  function remove(i: number) {
    setScreens((list) => list.filter((_, k) => k !== i));
    setSelected((s) => Math.max(0, Math.min(s, screens.length - 2)));
  }

  function add(type: ScreenType) {
    const s = newScreen(type);
    setScreens((list) => {
      const finalIdx = list.findIndex((x) => x.type === "final");
      // Нові екрани вставляємо перед фіналом, якщо він є.
      if (type !== "final" && finalIdx >= 0) return [...list.slice(0, finalIdx), s, ...list.slice(finalIdx)];
      return [...list, s];
    });
    setSelected(Math.max(0, screens.findIndex((x) => x.type === "final")) || screens.length);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      <form action={action} className="space-y-8">
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <input type="hidden" name="screens" value={JSON.stringify(screens)} />
        <input type="hidden" name="noMode" value={noMode} />

        {/* Основне */}
        <section className="card space-y-6">
          <h2 className="text-lg font-semibold">Основне</h2>

          <fieldset>
            <legend className="label">Дизайн</legend>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {templates.map((t) => {
                const sel = t.id === templateId;
                return (
                  <label key={t.id} className={`cursor-pointer rounded-2xl border-2 p-1 transition ${sel ? "border-brand" : "border-transparent hover:border-border"}`}>
                    <input type="radio" name="templateId" value={t.id} checked={sel} onChange={() => setTemplateId(t.id)} className="sr-only" />
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl text-2xl shadow-inner" style={{ background: t.page }} aria-hidden>
                      {t.emoji}
                    </div>
                    <div className="mt-1.5 truncate px-1 text-center text-xs font-medium">{t.name}</div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="recipientName" className="label">Кого запрошуєш</label>
            <input id="recipientName" name="recipientName" className="field" placeholder="Наприклад, Оленко" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={60} required />
            <p className="mt-1 text-xs text-muted">У кличному відмінку. В текстах екранів підставляється як {"{name}"}.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="eventDate" className="label">Дата</label>
              <input id="eventDate" name="eventDate" type="date" className="field" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="eventTime" className="label">Час</label>
              <input id="eventTime" name="eventTime" type="time" className="field" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
            </div>
            <div>
              <label htmlFor="place" className="label">Місце</label>
              <input id="place" name="place" className="field" placeholder="Кав'ярня на Подолі" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={160} />
            </div>
          </div>

          <fieldset>
            <legend className="label">Поведінка кнопки «ні»</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {noModes.map((m) => (
                <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${noMode === m ? "border-brand bg-brand-soft/40" : "border-border hover:border-brand/50"}`}>
                  <input type="radio" name="noModePick" value={m} checked={noMode === m} onChange={() => setNoMode(m)} className="mt-1 accent-brand" />
                  <span>
                    <span className="block text-sm font-medium">{noModeMeta[m].name}</span>
                    <span className="block text-xs text-muted">{noModeMeta[m].hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {/* Екрани */}
        <section className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Екрани</h2>
            <p className="text-sm text-muted">
              Отримувач гортає їх по черзі й сам обирає план, день, час і настрій. Клікніть екран, щоб редагувати й побачити його у прев&apos;ю. У текстах працюють змінні{" "}
              <code className="rounded bg-border/50 px-1">{"{name}"}</code> <code className="rounded bg-border/50 px-1">{"{author}"}</code>{" "}
              <code className="rounded bg-border/50 px-1">{"{choice}"}</code> <code className="rounded bg-border/50 px-1">{"{when}"}</code>{" "}
              <code className="rounded bg-border/50 px-1">{"{date}"}</code>{" "}
              <code className="rounded bg-border/50 px-1">{"{time}"}</code> <code className="rounded bg-border/50 px-1">{"{place}"}</code>.
            </p>
          </div>

          <ol className="space-y-3">
            {screens.map((s, i) => {
              const meta = screenTypeMeta[s.type];
              const open = i === selected;
              return (
                <li key={s.id} className={`rounded-2xl border transition ${open ? "border-brand" : "border-border"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <button type="button" onClick={() => setSelected(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-border/40 text-lg" aria-hidden>{meta.emoji}</span>
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wider text-muted">{i + 1}. {meta.name}</span>
                        <span className="block truncate text-sm font-medium">{s.title || <span className="text-muted">без заголовка</span>}</span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost px-2 py-1 disabled:opacity-30" aria-label="Вище">↑</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === screens.length - 1} className="btn-ghost px-2 py-1 disabled:opacity-30" aria-label="Нижче">↓</button>
                      <button type="button" onClick={() => remove(i)} disabled={screens.length === 1} className="btn-ghost px-2 py-1 text-red-600 disabled:opacity-30" aria-label="Видалити екран">✕</button>
                    </div>
                  </div>

                  {open ? (
                    <div className="space-y-3 border-t border-border p-4">
                      <p className="text-xs text-muted">{meta.hint}</p>
                      <ScreenFields screen={s} onChange={(patch) => updateScreen(s.id, patch)} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div>
            <p className="label">Додати екран</p>
            <div className="flex flex-wrap gap-2">
              {screenTypes.map((type) => (
                <button key={type} type="button" onClick={() => add(type)} disabled={screens.length >= 12} className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">
                  {screenTypeMeta[type].emoji} {screenTypeMeta[type].name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {state.error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        ) : null}

        <SubmitButton pendingText="Зберігаю…" className="btn-primary w-full sm:w-auto">
          {initial ? "Зберегти зміни" : "Створити й отримати посилання"}
        </SubmitButton>
      </form>

      {/* Прев'ю */}
      <aside className="self-start lg:sticky lg:top-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="label mb-0">Так побачить отримувач</p>
          <div className="flex items-center gap-1 text-sm">
            <button type="button" onClick={() => setSelected((s) => Math.max(0, s - 1))} className="btn-ghost px-2 py-1" aria-label="Попередній екран">←</button>
            <span className="tabular-nums text-muted">{Math.min(selected + 1, screens.length)}/{screens.length}</span>
            <button type="button" onClick={() => setSelected((s) => Math.min(screens.length - 1, s + 1))} className="btn-ghost px-2 py-1" aria-label="Наступний екран">→</button>
            <button type="button" onClick={() => { setSelected(0); setPlayerKey((k) => k + 1); }} className="btn-ghost px-2 py-1 text-xs">Спочатку</button>
          </div>
        </div>
        <div className="rounded-3xl p-5 sm:p-6" style={{ background: template.page }}>
          <InvitationPlayer
            key={playerKey}
            template={template}
            screens={screens}
            context={{ slug: "preview", recipientName: recipientName || "Друже", authorName, eventDate: eventDate || null, eventTime: eventTime || null, place: place || null }}
            noMode={noMode}
            mode="preview"
            previewIndex={selected}
            onPreviewIndexChange={setSelected}
            compact
          />
        </div>
        <p className="mt-2 text-xs text-muted">Прев&apos;ю інтерактивне: натискайте кнопки, щоб пройти шлях отримувача.</p>
      </aside>
    </div>
  );
}

function ScreenFields({ screen: s, onChange }: { screen: Screen; onChange: (patch: Partial<Screen>) => void }) {
  const text = (
    <div>
      <label className="label">Текст</label>
      <textarea className="field min-h-20 resize-y" value={s.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={800} />
    </div>
  );
  const image = (
    <div>
      <label className="label">Посилання на фото або GIF <span className="font-normal text-muted">(необов&apos;язково)</span></label>
      <input className="field" placeholder="https://media.giphy.com/…" value={s.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} maxLength={600} />
      <p className="mt-1 text-xs text-muted">Підійде будь-яке пряме посилання на картинку: Giphy, Tenor, Imgur, Google Фото.</p>
    </div>
  );
  const button = "button" in s ? (
    <div>
      <label className="label">Підпис кнопки</label>
      <input className="field" value={s.button} onChange={(e) => onChange({ button: e.target.value } as Partial<Screen>)} maxLength={40} />
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{s.type === "final" ? "Заголовок після «так»" : "Заголовок"}</label>
        <input className="field" value={s.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={160} />
      </div>
      {text}

      {s.type === "question" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Кнопка «так»</label>
            <input className="field" value={s.yesLabel} onChange={(e) => onChange({ yesLabel: e.target.value } as Partial<Screen>)} maxLength={40} />
          </div>
          <div>
            <label className="label">Кнопка «ні»</label>
            <input className="field" value={s.noLabel} onChange={(e) => onChange({ noLabel: e.target.value } as Partial<Screen>)} maxLength={40} />
          </div>
        </div>
      ) : null}

      {s.type === "choice" ? (
        <div>
          <label className="label">Варіанти</label>
          <div className="space-y-2">
            {s.options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="field w-16 text-center"
                  value={o.emoji}
                  onChange={(e) => onChange({ options: s.options.map((x, k) => (k === i ? { ...x, emoji: e.target.value } : x)) } as Partial<Screen>)}
                  maxLength={8}
                  aria-label="Емодзі"
                />
                <input
                  className="field"
                  value={o.label}
                  onChange={(e) => onChange({ options: s.options.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) } as Partial<Screen>)}
                  maxLength={60}
                  aria-label="Назва варіанта"
                />
                <button type="button" onClick={() => onChange({ options: s.options.filter((_, k) => k !== i) } as Partial<Screen>)} disabled={s.options.length <= 2} className="btn-ghost px-2 text-red-600 disabled:opacity-30" aria-label="Видалити варіант">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onChange({ options: [...s.options, { emoji: "✨", label: "" }] } as Partial<Screen>)} disabled={s.options.length >= 8} className="btn-secondary mt-2 px-3 py-1.5 text-xs disabled:opacity-40">
            + Ще варіант
          </button>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.allowCustom} onChange={(e) => onChange({ allowCustom: e.target.checked } as Partial<Screen>)} className="accent-brand" />
            Дозволити запропонувати свій варіант
          </label>
        </div>
      ) : null}

      {s.type === "datepick" ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border p-3">
          <div>
            <p className="label">Які дні можна обрати</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={s.dateMode === "any"} onChange={() => onChange({ dateMode: "any" } as Partial<Screen>)} className="accent-brand" />
                Будь-який із найближчих
              </label>
              <input
                type="number"
                min={3}
                max={60}
                className="field w-20 py-1"
                value={s.daysAhead}
                onChange={(e) => onChange({ daysAhead: Math.min(60, Math.max(3, Number(e.target.value) || 3)) } as Partial<Screen>)}
                disabled={s.dateMode !== "any"}
              />
              <span className="self-center text-muted">днів</span>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="radio" checked={s.dateMode === "list"} onChange={() => onChange({ dateMode: "list" } as Partial<Screen>)} className="accent-brand" />
              Лише ці дати
            </label>
            {s.dateMode === "list" ? (
              <div className="mt-2 space-y-2">
                {s.dates.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="date" className="field" value={d} onChange={(e) => onChange({ dates: s.dates.map((x, k) => (k === i ? e.target.value : x)) } as Partial<Screen>)} />
                    <button type="button" onClick={() => onChange({ dates: s.dates.filter((_, k) => k !== i) } as Partial<Screen>)} className="btn-ghost px-2 text-red-600" aria-label="Видалити дату">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => onChange({ dates: [...s.dates, ""] } as Partial<Screen>)} disabled={s.dates.length >= 14} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                  + Дата
                </button>
                {s.dates.some((d) => !d) ? <p className="text-xs text-red-600">Заповніть або видаліть порожні дати.</p> : null}
              </div>
            ) : null}
          </div>
          <div>
            <p className="label">Час</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={s.timeMode === "slots"} onChange={() => onChange({ timeMode: "slots" } as Partial<Screen>)} className="accent-brand" />
                Запропоновані варіанти
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={s.timeMode === "free"} onChange={() => onChange({ timeMode: "free" } as Partial<Screen>)} className="accent-brand" />
                Будь-який час
              </label>
            </div>
            {s.timeMode === "slots" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {s.slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="time" className="field w-auto py-1" value={slot} onChange={(e) => onChange({ slots: s.slots.map((x, k) => (k === i ? e.target.value : x)) } as Partial<Screen>)} />
                    <button type="button" onClick={() => onChange({ slots: s.slots.filter((_, k) => k !== i) } as Partial<Screen>)} disabled={s.slots.length <= 1} className="btn-ghost px-1.5 text-red-600 disabled:opacity-30" aria-label="Видалити час">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => onChange({ slots: [...s.slots, "18:00"] } as Partial<Screen>)} disabled={s.slots.length >= 12} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                  + Час
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {s.type === "rating" ? (
        <div>
          <label className="label">Підписи шкали (від 1 до 5)</label>
          <div className="grid gap-2 sm:grid-cols-5">
            {s.labels.map((l, i) => (
              <input key={i} className="field py-1.5 text-xs" value={l} maxLength={40} onChange={(e) => onChange({ labels: s.labels.map((x, k) => (k === i ? e.target.value : x)) } as Partial<Screen>)} aria-label={`Підпис ${i + 1}`} />
            ))}
          </div>
        </div>
      ) : null}

      {s.type === "input" ? (
        <div className="space-y-3">
          <div>
            <label className="label">Підказка в полі</label>
            <input className="field" value={s.placeholder} maxLength={120} onChange={(e) => onChange({ placeholder: e.target.value } as Partial<Screen>)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.required} onChange={(e) => onChange({ required: e.target.checked } as Partial<Screen>)} className="accent-brand" />
            Обов&apos;язково заповнити
          </label>
        </div>
      ) : null}

      {s.type === "final" ? (
        <div className="grid gap-3 rounded-xl border border-dashed border-border p-3">
          <p className="text-xs text-muted">Якщо отримувач відповість «ні» (коли це дозволено):</p>
          <div>
            <label className="label">Заголовок після «ні»</label>
            <input className="field" value={s.noTitle} onChange={(e) => onChange({ noTitle: e.target.value } as Partial<Screen>)} maxLength={160} />
          </div>
          <div>
            <label className="label">Текст після «ні»</label>
            <textarea className="field min-h-16 resize-y" value={s.noText} onChange={(e) => onChange({ noText: e.target.value } as Partial<Screen>)} maxLength={800} />
          </div>
        </div>
      ) : null}

      {s.type === "details" ? <p className="text-xs text-muted">Дата, час і місце беруться з розділу «Основне».</p> : null}

      {image}
      {button}
    </div>
  );
}
