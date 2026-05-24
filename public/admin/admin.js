// Загружаем список тем
fetch('/themes')
    .then(response => response.json())
    .then(data => {
        const themeSelect = document.getElementById('themeSelect');
        data.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme;
            themeSelect.appendChild(option);
        });
        themeSelect.value = data.currentTheme;
    });

// Загружаем конфигурацию (режим, команды, длительность)
fetch('/config')
    .then(response => response.json())
    .then(data => {
        document.getElementById('gameModeSelect').value = data.gameConfig.mode;
        document.getElementById('roundDurationInput').value = data.gameConfig.roundDuration;

        data.teams.forEach((team, index) => {
            const teamNumber = index + 1;
            const nameLabel = document.getElementById(`team${teamNumber}NameLabel`);
            const scoreLabel = document.getElementById(`team${teamNumber}ScoreLabel`);
            if (team.name) {
                nameLabel.textContent = `Команда ${teamNumber}: ${team.name}`;
            }
            scoreLabel.textContent = `Счет: ${team.score}`;
        });
    });

// Изменение режима игры
document.getElementById('gameModeSelect').addEventListener('change', function() {
    fetch('/game-mode', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({key: this.value})
    });
});

// Изменение темы
document.getElementById('themeSelect').addEventListener('change', function() {
    fetch('/theme', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({key: this.value})
    });
});

// Изменение длительности раунда
document.getElementById('roundDurationInput').addEventListener('change', function() {
    const newValue = parseInt(this.value, 10);
    if (newValue && newValue >= 10) {
        fetch('/round-duration', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: newValue})
        });
    } else {
        alert('Минимальная длительность 10 секунд');
        // Восстановим предыдущее значение из базы, чтобы не терять
        fetch('/config')
            .then(res => res.json())
            .then(config => {
                this.value = config.gameConfig.roundDuration;
            });
    }
});

// Переименование команд
document.getElementById('teamsContainer').addEventListener('click', function(event) {
    const id = event.target.id;
    if (id.includes('RenameBtn')) {
        const teamNumber = id.match(/\d+/)[0];
        const newName = prompt('Введите новое название команды:');
        if (newName) {
            fetch(`/team/${teamNumber}/name`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({key: newName})
            })
                .then(() => {
                    const nameLabel = document.getElementById(`team${teamNumber}NameLabel`);
                    nameLabel.textContent = `Команда ${teamNumber}: ${newName}`;
                });
        }
    }
});

// Управление игрой (start/stop/resume/shutdown)
document.getElementById('isRunning').addEventListener('click', function(event) {
    const id = event.target.id;
    let action = '';
    if (id.includes('start')) action = 'start game';
    else if (id.includes('stop')) action = 'stop game';
    else if (id.includes('resume')) action = 'resume game';
    else if (id.includes('shutdown')) action = 'shutdown game';

    if (action) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: action})
        });
    }
});