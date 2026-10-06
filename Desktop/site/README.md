# CAMILLA Beauty Studio — upgraded site

The project includes a lightweight Python server and SQLite backend, so the
requested command works without installing Django:

```bash
python manage.py runserver
```

Then open http://127.0.0.1:8000/. A custom port is also supported:

```bash
python manage.py runserver 0.0.0.0:8080
```

The backend exposes `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`,
`/api/auth/me`, `/api/services`, `/api/bookings` and `/api/notifications`.
SQLite data is stored in `camilla.sqlite3` and should not be committed.

## Аккаунты

- Клиенты создают аккаунт через кнопку с иконкой профиля. После входа они могут оформить запись и открыть «Мои записи».
- Аккаунт владельца создан с email `behruzoripov123vip17@gmail.com`. При первом запуске сервер генерирует отдельный пароль и сохраняет его только локально в `.camilla-owner-credentials.txt` (права доступа: только владелец файла). Этот файл и база данных исключены из Git.
- В панели владельца есть все записи, их статусы, базовая аналитика и уведомления о каждой новой записи. Это уведомления внутри сайта; для настоящей отправки писем на Gmail потребуется отдельно подключить почтовый сервис и его ключи.

### Настройка email-уведомлений

Сервер умеет отправлять уведомление на email владельца сразу после новой записи. Скопируйте `.env.example` в локальный `.env`, укажите пароль приложения Google (не пароль от Gmail) и запустите сервер с этими переменными окружения. Реальные секреты не сохраняйте в JavaScript, HTML или Git.

## What's inside
- `index.html` — page structure (all sections preserved from the original site)
- `css/style.css` — design system + all motion (scroll reveals, pinned reel, ripples, Ken Burns, cursors, marquees…)
- `js/i18n.js` — RU / UZ / EN dictionary (language switcher in the header, saved in localStorage)
- `js/app.js` — services data, catalog, booking flow, animations
- `images/` — portfolio & gallery photos

## Owner settings (js/app.js, top of file)
```js
const CONFIG = {
  instagram: "shakhlo_nails",      // Instagram handle
  telegram: "shahloNailSTUDIO",    // Telegram username
  instagramURL: "https://www.instagram.com/shakhlo_nails",
  telegramURL: "https://t.me/shahloNailSTUDIO",
  tz: "Asia/Tashkent"
};
```
- **Prices / services / durations** — edit the `SERVICES` array in `js/app.js` (names in 3 languages).
- **Specialist photo** — replace the placeholder block in `index.html` (`#specialist` → `.spec-photo`) with an `<img>`.
- Booking flow ends with "Send via Telegram / Instagram / Copy text": the message is copied to the clipboard and the messenger opens (messengers don't allow pre-filled DMs, so the client pastes the text).

## Motion upgrades (scroll & click)
Word-mask hero reveal • staggered scroll reveals • pinned horizontal Reels strip with % counter and center-focus scaling • Ken Burns breathing on images • parallax orbs & floating hero cards • custom cursor with hover-grow • click ripples on every button/chip/tab • magnetic buttons • tilt cards • scrollspy nav + hide-on-scroll glass header • scroll progress bar • animated counters • sparkle burst on booking confirmation • shake + toast on validation errors • lightbox zoom • marquees • full `prefers-reduced-motion` fallback.
