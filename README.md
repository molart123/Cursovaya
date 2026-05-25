# 🎯 Laser Game — Игровая система

Многопользовательская тировая игра с веб-интерфейсом. Игроки стреляют по мишеням на игровых досках (планшеты/телефоны), администратор управляет игрой с отдельного устройства.

---

## 📁 Структура проекта

```
laser-game/
├── server.js               # Сервер (Node.js + Express)
├── db.json                 # База данных (конфиг, команды, темы)
├── package.json
└── public/
    ├── admin/
    │   ├── admin.html
    │   ├── admin.js
    │   └── admin.css
    ├── boards/
    │   ├── board1/
    │   │   ├── board1.html
    │   │   ├── board1.js
    │   │   └── board1.css
    │   └── board2/
    │       ├── board2.html
    │       ├── board2.js
    │       └── board2.css
    └── themes/
        ├── super_heroes/
        │   ├── small_enemy.jpg
        │   ├── medium_enemy.jpg
        │   └── big_enemy.jpg
        └── frost_legion/
            ├── small_enemy.jpg
            ├── medium_enemy.jpg
            ├── big_enemy.jpg
            └── frost_background.jpg
```

---

## 🚀 Запуск

### 1. Установи зависимости
```bash
npm install
```

### 2. Запусти сервер
```bash
npm start
```

### 3. Узнай IP компьютера
Открой командную строку (`cmd`) и введи:
```bash
ipconfig
```
Найди строку **IPv4-адрес** — например `192.168.1.100`

### 4. Открой нужные страницы на устройствах

| Страница | URL |
|----------|-----|
| Админ-панель | `http://192.168.1.100:3000/admin/admin.html` |
| Доска 1 | `http://192.168.1.100:3000/boards/board1/board1.html` |
| Доска 2 | `http://192.168.1.100:3000/boards/board2/board2.html` |

> Все устройства должны быть в **одной Wi-Fi сети**.

---
## 🎮 Режимы игры

| Режим | Описание |
|-------|----------|
| `1board1team` | 1 доска, 1 команда |
| `2board1team` | 2 доски, 1 команда (доска 1 + доска 2 для одной команды) |
| `2board2team` | 2 доски, 2 команды (каждая доска — своя команда) |
| `2board4team` | 2 доски, 4 команды (на каждой доске по 2 зоны) |

---

## 🎨 Темы

Темы хранятся в `db.json` → `themes`. Каждая тема может содержать:

- `small_enemy` — картинка лёгкой мишени (1 HP, 5 очков)
- `medium_enemy` — картинка средней мишени (2 HP, 10 очков)
- `big_enemy` — картинка тяжёлой мишени (3 HP, 20 очков)
- `background` — фоновое изображение игрового поля (необязательно)

### Добавить новую тему

1. Создай папку `public/themes/моя_тема/`
2. Положи туда картинки
3. Добавь запись в `db.json`:

```json
"моя_тема": {
  "small_enemy": "themes/моя_тема/small.jpg",
  "medium_enemy": "themes/моя_тема/medium.jpg",
  "big_enemy": "themes/моя_тема/big.jpg",
  "background": "themes/моя_тема/bg.jpg"
}
```

---

## ⚙️ API сервера

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/config` | Полный конфиг и состояние |
| GET | `/themes` | Список тем |
| GET | `/board/state` | Состояние игры для досок |
| POST | `/game-mode` | Сменить режим `{ key: "..." }` |
| POST | `/theme` | Сменить тему `{ key: "..." }` |
| POST | `/round-duration` | Длительность раунда `{ key: 120 }` |
| POST | `/game/process` | Управление игрой (см. ниже) |
| POST | `/board/score` | Добавить очки `{ teamId, points }` |
| POST | `/team/:id/name` | Переименовать команду `{ key: "..." }` |

### Команды `/game/process`

```json
{ "key": "start game" }    // Начать новый раунд
{ "key": "stop game" }     // Пауза
{ "key": "resume game" }   // Продолжить с паузы
{ "key": "shutdown game" } // Сбросить всё
```

---

## 📊 Очки за мишени

| Мишень | HP | Очки |
|--------|----|------|
| Лёгкая (easy) | 1 | 5 |
| Средняя (medium) | 2 | 10 |
| Тяжёлая (hard) | 3 | 20 |