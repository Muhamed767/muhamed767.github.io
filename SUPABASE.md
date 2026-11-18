# CUSTOMCARS B — Supabase

Проект: customcarsb. Организация: mb. Тариф при создании: Free ($0/месяц).
Регион: Frankfurt / eu-central-1.

Панель: https://supabase.com/dashboard/project/lhmaiejlaiujcqxsyidy
API: https://lhmaiejlaiujcqxsyidy.supabase.co
Сайт: https://customcarsb.netlify.app
GitHub: https://github.com/Muhamed767/muhamed767.github.io

## Как работает подключение

Статический сайт запрашивает опубликованный каталог из таблицы `public.site_catalog`.
В `payload` находится объект каталога с `settings` и массивом `cars`.
Строка каталога: `id = customcarsb`, `published = true`.
В Supabase Table Editor можно менять каталог; обновления появляются при следующем открытии сайта.
Фотографии существующих моделей встроены в app.js; для новых фото используйте полные HTTPS-ссылки.

В `supabase-config.js` хранится только публичный publishable key. Он предназначен для браузера.
RLS и права таблицы разрешают посетителям только чтение опубликованного каталога.
Запись из браузера запрещена. Секретные ключи и пароль базы в сайт не добавляются.

Если Supabase недоступен, сайт показывает встроенный резервный каталог.
Заявки продолжают отправляться самим посетителем через WhatsApp/Telegram.
Ссылка «Вход для владельца» открывает Supabase Table Editor. Вход выполняется через аккаунт владельца Supabase.

## GitHub и Netlify

Это сайт без сборки: publish directory — корень репозитория, build command — пусто.
Публичная конфигурация загружается непосредственно из supabase-config.js на GitHub Pages и Netlify.
Переменные среды Netlify не нужны: статический JavaScript не читает их без отдельной сборки.
Автопубликация требует, чтобы Netlify был связан с этим репозиторием и веткой main.

## Восстановление

Перед изменениями сохранены исходные app.js, index.html, текущий каталог и полный Git bundle
в папке backups рядом с локальной папкой site. Они не публикуются на сайте.
Для отмены подключения восстановите app.js и index.html из этой копии.
Схема таблицы и политики сохранены в supabase/schema.sql; повторно на существующей таблице не запускайте.
