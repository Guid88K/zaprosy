# Контекст проєкту «Запроси» для нового чату

Цей файл — повна передача контексту з сесії 2 жовтня 2026, у якій проєкт створено з нуля, задеплоєно й доведено до поточного стану. Прочитай його повністю перед будь-якою роботою. Секретів тут немає, вони лежать у git-ігнорованих файлах (див. розділ «Секрети й акаунти»).

## 1. Що це і для кого

- **Запроси** — український аналог invitik.ru: сервіс інтерактивних запрошень на побачення. Автор збирає запрошення з екранів, надсилає одне посилання, отримувач проходить екрани на телефоні й сам обирає план, день, час, настрій; відповідь приходить автору в кабінет і в сповіщення.
- Власник: Владислав (GitHub `Guid88K`, email у проєкті `vladyslav.k@corefy.com`, працює бекенд-розробником у Corefy, PHP/Symfony). Спілкування українською. Відповідати українською.
- invitik.ru недоступний з України, тому орієнтирами стали англомовні аналоги: **eventic.in/date** (інтро → питання з утікаючим «ні» → вибір плану → календар дати й часу → шкала «наскільки чекаєш» → «It's a date!»), **ourlittle.date** (отримувач обирає місце, дрес-код, що взяти, день і час), **planyour.date**.

## 2. Рішення, які вже ухвалено (не переглядати без запиту)

- **Сервіс безкоштовний.** Оплату (20 грн за запрошення через еквайринг monobank) обговорили й відклали: «може воно не має сенсу поки». Не додавати платіжний код без явного прохання.
- Замість оплати — кнопка донату **Buy Me a Coffee**: `https://buymeacoffee.com/vkuruchukv`, задається змінною `NEXT_PUBLIC_SUPPORT_URL`, без неї кнопка не рендериться.
- Стек обрав користувач: **Next.js + SQLite/Postgres**. Фактично: Next.js 16.3 (App Router, Server Actions, Turbopack), React 19, TypeScript, Tailwind 4, Drizzle ORM, SQLite через `@libsql/client` (локально файл, у проді Turso), сесії JWT у httpOnly cookie (`jose`), паролі `bcryptjs`, валідація `zod` v4, `nodemailer` для SMTP.
- Хостинг: **Vercel Hobby + Turso Free** (0 грн/міс). Обговорювали альтернативи (Cloudflare Workers + D1, VPS Hetzner, українські хостери, Oracle Always Free) — користувач обрав безкоштовний варіант.
- Весь UI українською. Імена отримувачів у кличному відмінку («Оленко», «Ніко», «Максе»).

## 3. Інфраструктура й доступи

| Що | Де |
| --- | --- |
| Репозиторій | `git@github.com:Guid88K/zaprosy.git`, гілка `main`, кожен push автоматично деплоїть |
| Продакшн | https://zaprosy-eta.vercel.app (проєкт Vercel `zaprosy`, team slug `myself-327e`, особистий акаунт Hobby) |
| Регіон функцій | `iad1` (задано у `vercel.json`), бо база Turso створена в `aws-us-east-1` |
| База | Turso, `libsql://zaprosy-guid88k.aws-us-east-1.turso.io` |
| Міграції | `drizzle/*.sql`, застосовуються командою збірки `drizzle-kit migrate && next build`, а також лениво на старті (`getDb()` у `src/db/index.ts`) |
| Змінні на Vercel (Production) | `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL=https://zaprosy-eta.vercel.app`, `NEXT_PUBLIC_SUPPORT_URL`. Telegram і SMTP **не налаштовані**, сповіщення поки пишуться в лог |
| SSH до GitHub | ключ `~/.ssh/id_rsa.pub` доданий в акаунт Guid88K; `gh` CLI на машині немає |

### Секрети й акаунти (файли поза git, у корені проєкту)

- `.env` — локальні змінні (SQLite-файл `data/zaprosy.db`, посилання на донат).
- `.env.turso` — URL і токен Turso.
- `.env.vercel` — повний набір змінних, який заливали у Vercel.
- `.env.account` — email і пароль акаунта автора на проді (`vladyslav.k@corefy.com`, ім'я «Владислав»). Акаунт створено прямим записом у Turso, бо вводити паролі на зовнішніх сайтах асистенту не можна. Зміни пароля в застосунку поки немає.
- Правило: асистент не вводить паролі/токени у форми зовнішніх сайтів (Vercel, GitHub тощо) навіть на прохання; він готує значення в буфері обміну (`xsel --clipboard`) або файлах, а користувач вставляє сам. На localhost тестові акаунти створювати можна.

## 4. Архітектура коду

```
src/app/page.tsx                  лендинг
src/app/login, register           вхід/реєстрація (AuthForm)
src/app/dashboard/layout.tsx      шапка кабінету (форма «Вийти» — ПЕРША <form> на сторінці!)
src/app/dashboard/page.tsx        список запрошень зі статусами
src/app/dashboard/new             конструктор (InvitationForm)
src/app/dashboard/[id]            картка: посилання, share, режим «ні», відповіді з вибором, видалення (двокрокове підтвердження, без confirm())
src/app/dashboard/[id]/edit       редагування екранів (той самий InvitationForm з initial)
src/app/dashboard/settings        ім'я, Telegram chat ID, email-сповіщення
src/app/i/[slug]                  публічна сторінка отримувача (InvitationPlayer, mode="live")
src/components/InvitationForm.tsx конструктор: «Основне» + список екранів + інтерактивне прев'ю
src/components/InvitationPlayer.tsx плеєр екранів (live/preview), надсилає відповідь на фіналі
src/components/YesNoButtons.tsx   кнопки так/ні з 4 режимами «ні»
src/components/Hearts.tsx         злива сердечок після «так» (детермінований псевдорандом, бо React Compiler lint забороняє Math.random у рендері)
src/components/NoModeToggle.tsx   select режиму «ні» в картці запрошення
src/components/InvitationCard.tsx стара односторінкова картка, лишилась для лендингу
src/lib/screens.ts                МОДЕЛЬ ЕКРАНІВ: типи, zod-схеми, дефолти, legacy-fallback, змінні
src/lib/templates.ts              6 шаблонів дизайну (romantic, night, sunset, garden, minimal, ukraine)
src/lib/actions/auth.ts           register/login/logout
src/lib/actions/invitations.ts    create/update/delete, setNoMode, updateSettings, submitResponse, addResponseComment
src/lib/auth.ts, notify.ts, url.ts, format.ts, validation.ts
src/db/schema.ts, src/db/index.ts
drizzle.config.ts                 dialect sqlite для file:, turso для libsql://
DEPLOY.md                         покрокова інструкція деплою українською
```

### Модель даних

- `users`: id, email (unique), password_hash, name, telegram_chat_id, notify_by_email, created_at.
- `invitations`: id, user_id, slug (8 символів з алфавіту без схожих літер), template_id, recipient_name, question, message, event_date, event_time, place, `no_mode` (`allow|runaway|shrink|multiply`), `screens` (JSON-масив екранів або NULL для старих), created_at. Поля `question`/`message` тепер похідні: беруться з екрана «question» при збереженні (для списку в кабінеті).
- `responses`: id, invitation_id, answer (`yes|no`), comment, `choices` (JSON `[{screen, value, kind}]`), created_at.
- Міграції: 0000 базова, 0001 `no_mode`, 0002 `screens` + `choices`. Усі застосовані до Turso.

### Екрани (`src/lib/screens.ts`)

Типи: `intro`, `question` (так/ні, режим «ні» береться з запрошення), `choice` (варіанти з емодзі + опція «Своє» `allowCustom`), `datepick` (`dateMode: any|list`, `daysAhead`, `dates[]`, `timeMode: slots|free`, `slots[]`), `rating` (5 емодзі 😐🙂😊😍🔥 з редагованими `labels`), `input` (вільний текст, `placeholder`, `required`), `details` (дата/час/місце, задані автором у «Основному»), `media` (картинка за URL), `final` (title/text для «так», noTitle/noText для «ні»).
Змінні в текстах: `{name}`, `{author}`, `{choice}` (усі вибори з екранів choice через кому), `{when}` (з datepick), `{date}`, `{time}`, `{place}`.
`parseScreens(json, inv)` повертає legacy-екрани (question → details → final), якщо JSON порожній або невалідний. `ensureFinal` додає фінал, якщо його немає.
Відповідь надсилається автоматично, коли отримувач доходить до екрана `final` (`submitResponse`), потім можна дописати коментар (`addResponseComment`). «Ні» веде одразу на фінал. Для режимів `runaway|shrink|multiply` сервер відхиляє answer=`no`.

## 5. Поточні дані на проді (акаунт Владислава)

| Кому | slug | Режим «ні» | Що це |
| --- | --- | --- | --- |
| Ніко | `p4jtp5si` | runaway | Перше запрошення «Приїдеш до мене з багетом?», старий формат (legacy-екрани), шаблон sunset |
| Максе | `3ie7iyih` | runaway | Демо для друга «Зберемось на пиво в п'ятницю?», шаблон night, legacy |
| Ніко | `e7j5abnw` | runaway | Операція «Багет» — 8 екранів на нових типах (інтро, питання, 2 вибори, дата/час, настрій, який багет, фінал), шаблон night |

Посилання виду `https://zaprosy-eta.vercel.app/i/<slug>`. Запрошення вставлялися прямим SQL у Turso скриптами на node з `@libsql/client` (приклад підходу — у `.env.turso` + `node -e`).

## 6. Як працювати з проєктом

- `pnpm dev` (локально база `data/zaprosy.db`, тека в .gitignore), `pnpm build` (спочатку міграції), `pnpm lint`, `pnpm db:generate` після зміни `src/db/schema.ts`, потім застосувати до Turso: `set -a; source .env.turso; set +a; pnpm db:migrate`.
- Коміти в стилі conventional commits англійською. **Хук корпоративного плагіна забороняє рядки Co-Authored-By / Generated with Claude** у коміт-повідомленнях — не додавати.
- Деплой = `git push` у `main`; збірка на Vercel ~30–45 с. Перевіряти в списку деплоїв Vercel (фільтри там «липкі», можуть ховати рядки) або `curl` сторінки.
- Тестування через Chrome-автоматизацію: у dev-режимі сторінки гідруються повільно після першої компіляції, кліки до гідрації губляться. Надійніше: дочекатись `__reactProps` на формі й керувати через JS (`requestSubmit()` на КОНКРЕТНІЙ формі, бо перша форма в кабінеті — це «Вийти»). Значення у контрольовані інпути задавати через нативний setter + подія `input`.
- Особливості машини: Ubuntu 20.04, glibc 2.31, Node 20.11 (nvm), gcc 9. `better-sqlite3` не працює (prebuild вимагає glibc 2.33, збірка з вихідників падає на `-std=c++20`), тому `@libsql/client`. `npx node-gyp@latest` ламається на Node 20.11, за потреби pin `node-gyp@10`. Є xsel для буфера обміну, xclip немає.

## 7. Відомі дрібниці та що не зроблено

- У Vercel змінна `DATABASE_URL` збережена як Config і позначена «Needs Attention» (виглядає як секрет). На роботу не впливає; можна перестворити як Secret.
- Vercel пропонував увімкнути 2FA — користувач вирішує сам.
- Файли `.env.turso`, `.env.vercel`, `.env.account` можна видалити після того, як усе заведено (вони дублюють Vercel).
- Немає: зміни пароля, відновлення пароля, завантаження файлів (картинки лише за URL), OG-зображення для прев'ю посилання в месенджерах, обмеження повторних відповідей з одного пристрою, свого домену (обговорювали `.com.ua`/`.in.ua` ~400 грн/рік), Telegram/SMTP налаштувань на проді.
- Ідеї, які користувач озвучував або які пропонувались: видалення зі списку запрошень або архівація замість видалення; оплата через monobank (відкладено); гіфки у фіналі.

## 8. Хронологія сесії (стисло)

1. Запит: «український аналог invitik». Уточнено: повноцінний застосунок, Next.js, шаблони, так/ні з коментарем, кабінет з логіном, сповіщення.
2. Скаффолд, better-sqlite3 → libsql, базовий сервіс, локальний тест, README.
3. Обговорення оплати (20 грн, monobank) → вирішили лишити безкоштовним → додали кнопку Buy Me a Coffee.
4. Вибір хостингу й цін → Vercel Hobby + Turso. GitHub репо, SSH-ключ, Turso база, змінні у Vercel (несекретні вніс асистент, секретні вставив користувач), перший деплой.
5. Створено акаунт автора й запрошення для Ніки та Макса прямим записом у БД.
6. Режим «ні тікає», потім перемикач режимів у кабінеті.
7. Запит «зроби як у invitik, цікаві сторінки» → багатоекранний конструктор, плеєр, редагування, 4 режими «ні», сердечка.
8. Запит «там заповнює отримувач, а не автор» → екрани вибору плану зі своїм варіантом, дати й часу, настрою, відкритого питання; змінна `{when}`.
9. Створено запрошення «Операція „Багет"» для Ніки на нових екранах.
10. Цей файл.
