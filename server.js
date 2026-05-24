const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 63342;

app.use(express.json());
app.use(express.static(__dirname));

// Отдать всю конфигурацию
app.get('/config', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    res.json(db);
});

// Получить список тем и текущую тему
app.get('/themes', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const themeNames = Object.keys(db.themes); // извлекаем ключи объекта
    res.json({
        themes: themeNames,
        currentTheme: db.gameConfig.theme
    });
});

// Изменить режим игры
app.post('/game-mode', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    db.gameConfig.mode = req.body.key;
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    res.json({ok: true});
});

// Изменить тему
app.post('/theme', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    db.gameConfig.theme = req.body.key;
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    res.json({ok: true});
});

// Переименовать команду
app.post('/team/:id/name', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const teamIndex = req.params.id - 1;
    db.teams[teamIndex].name = req.body.key;
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    res.json({ok: true});
});

// Управление игрой (start/stop/resume/shutdown)
app.post('/game/process', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const gameIsStarting = db.gameConfig.isStarting;

    if (req.body.key === 'stop game' && gameIsStarting) {
        db.gameConfig.isRunning = false;
    } else if (req.body.key === 'resume game' && gameIsStarting) {
        db.gameConfig.isRunning = true;
    } else if (req.body.key === 'start game' && !gameIsStarting) {
        db.gameConfig.isRunning = true;
        db.gameConfig.isStarting = true;
    } else if (req.body.key === 'shutdown game' && gameIsStarting) {
        db.gameConfig.isRunning = false;
        db.gameConfig.isStarting = false;
        db.teams.forEach(team => team.score = 0);
    }

    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    res.json({ok: true});
});

// Изменить длительность раунда
app.post('/round-duration', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const newDuration = parseInt(req.body.key, 10);
    if (newDuration && newDuration >= 10) {
        db.gameConfig.roundDuration = newDuration;
        fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
        res.json({ok: true});
    } else {
        res.status(400).json({ok: false, message: 'Минимальная длительность 10 секунд'});
    }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));