# Деплой «Запроси» на Vercel + Turso

Обидва сервіси мають безкоштовні тарифи, яких вистачить на старт: Vercel Hobby для застосунку, Turso Free для бази даних. Код міняти не потрібно, лише змінні оточення.

## 1. Репозиторій на GitHub

```bash
git remote add origin git@github.com:<ваш_нік>/zaprosy.git
git push -u origin main
```

## 2. База даних у Turso

Через сайт: зайдіть на https://app.turso.tech, створіть групу й базу `zaprosy` у тому ж регіоні, що й функції Vercel (у `vercel.json` задано `iad1`, тобто AWS us-east-1). На сторінці бази скопіюйте **URL** (`libsql://zaprosy-<нік>.turso.io`) і створіть **токен** (Create Token, без терміну дії).

Або через CLI:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create zaprosy --location fra
turso db show zaprosy --url
turso db tokens create zaprosy
```

## 3. Проєкт на Vercel

1. Зайдіть на https://vercel.com під **особистим акаунтом** (не створюйте Team, інакше буде запропоновано Pro за 20 $).
2. Add New → Project → імпортуйте репозиторій `zaprosy`. Framework визначиться як Next.js, команду збірки не чіпайте: вона вже містить застосування міграцій.
3. У розділі Environment Variables додайте:

| Змінна | Значення |
| --- | --- |
| `DATABASE_URL` | URL бази з Turso, починається з `libsql://` |
| `DATABASE_AUTH_TOKEN` | токен з Turso |
| `AUTH_SECRET` | результат команди `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://<проєкт>.vercel.app`, пізніше замініть на свій домен |
| `NEXT_PUBLIC_SUPPORT_URL` | `https://buymeacoffee.com/vkuruchukv` |

Telegram і SMTP можна додати будь-коли пізніше, після цього потрібен редеплой.

4. Натисніть Deploy. Під час збірки `drizzle-kit migrate` створить таблиці в Turso, далі `next build` збере застосунок.

## 4. Домен

Project → Settings → Domains → Add. Vercel покаже, які записи DNS додати в реєстратора (зазвичай CNAME на `cname.vercel-dns.com`). Після цього оновіть `NEXT_PUBLIC_APP_URL` і зробіть редеплой.

## 5. Оновлення

Кожен `git push` у `main` автоматично розгортає нову версію. Нові міграції після зміни `src/db/schema.ts` створюються командою `pnpm db:generate` і застосовуються самі під час збірки.

## Якщо щось пішло не так

- **Build падає на `drizzle-kit migrate`**: перевірте `DATABASE_URL` і `DATABASE_AUTH_TOKEN`, токен має бути для цієї бази.
- **Помилка AUTH_SECRET не задано**: змінна не додана або додана лише для Preview, а не для Production.
- **Кнопка донату не показується**: змінні з префіксом `NEXT_PUBLIC_` вшиваються під час збірки, після їх зміни потрібен редеплой.
- **Повільний перший запит**: це холодний старт безкоштовного тарифу, наступні запити швидкі.
