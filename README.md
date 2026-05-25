# Laser Shooting Gallery 🎯

Интерактивная игра для 1–4 команд на 1–2 интерактивных досках с управлением через админ-панель и лазерные пистолеты (клики).

## Возможности
- **4 режима**: 1 доска/1 команда, 2 доски/1 команда, 2 доски/2 команды, 2 доски/4 команды.
- **Сменные темы**: наборы фонов и иконок врагов (супергерои, ледяной легион), можно добавлять свои.
- **Управление с админки**: запуск, пауза, стоп, смена темы, переименование команд, настройка длительности раунда.
- **Таблица рекордов**: сохраняется на сервере, сбрасывается через админку.
- **Сервер на Node.js + Express**: все настройки и счёт хранятся в `db.json`, клиенты обновляются через REST API.

## Структура проекта

project/
├── public/
│ ├── admin.html / admin.css / admin.js # Админ-панель
│ ├── boards/
│ │ ├── board1.html / board1.css / board1.js # Доска 1 (команды 1 и 2)
│ │ └── board2.html / board2.css / board2.js # Доска 2 (команды 3 и 4)
│ └── themes/
│ ├── super_heroes/
│ │ ├── small_enemy.jpg, medium_enemy.jpg, big_enemy.jpg, hero_background.jpg
│ └── frost_legion/
│ ├── small_enemy.jpg, medium_enemy.jpg, big_enemy.jpg, frost_background.jpg
├── db.json # БД игры (темы, счёт, настройки)
├── server.js # Сервер Express
└── README.md


## Быстрый старт
1. Установите Node.js (v14+).
2. Клонируйте репозиторий и перейдите в папку проекта.
3. Выполните `npm install express`.
4. Запустите сервер: `node server.js`. Он будет доступен на `http://localhost:63342`.
5. Откройте в браузерах:
   - Админка: `http://localhost:63342/admin.html`
   - Доска 1: `http://localhost:63342/boards/board1.html`
   - Доска 2: `http://localhost:63342/boards/board2.html` (если нужна)
6. На админ‑панели выберите режим, тему, длительность и нажмите **Начать игру**.
7. Стреляйте по врагам кликами (лазерным пистолетом) – счёт будет обновляться в реальном времени.

## Настройка тем
Темы хранятся в `db.json` в объекте `themes`. Каждая тема содержит:
- `small_enemy`, `medium_enemy`, `big_enemy` – пути к изображениям врагов.
- `background` – фоновое изображение игрового поля.

**Добавление новой темы:**
1. Создайте папку в `public/themes/` (например, `pirates`), положите в неё картинки врагов и фон.
2. Добавьте запись в `db.json`:
```json
"pirates": {
  "small_enemy": "themes/pirates/small_pirate.png",
  "medium_enemy": "themes/pirates/medium_pirate.png",
  "big_enemy": "themes/pirates/big_captain.png",
  "background": "themes/pirates/pirate_ship.jpg"
}