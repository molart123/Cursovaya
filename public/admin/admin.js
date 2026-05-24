// Загружаем все данные с сервера при старте
fetch('/config')
    .then(response => response.json())
    .then(data => {
        // Устанавливаем режим игры
        document.getElementById('gameModeSelect').value = data.gameConfig.mode;

        // Заполняем список тем и устанавливаем текущую
        const themeSelect = document.getElementById('themeSelect');
        data.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme;
            themeSelect.appendChild(option);
        });
        themeSelect.value = data.gameConfig.theme;

        // Устанавливаем названия команд
        data.teams.forEach((team, index) => {
            const teamNumber = index + 1;
            const nameLabel = document.getElementById(`team${teamNumber}NameLabel`);
            if (team.name) {
                nameLabel.textContent = `Команда ${teamNumber}: ${team.name}`;
            }
            const scoreLabel = document.getElementById(`team${teamNumber}ScoreLabel`);
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
                    document.getElementById(`team${teamNumber}NameLabel`).textContent = `Команда ${teamNumber}: ${newName}`;
                });
        }
    }
});

// Управление игрой (start/stop/resume/shutdown)
document.getElementById('isRunning').addEventListener('click', function(event) {
    const id = event.target.id;

    if (id.includes('start')) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: 'start game'})
        });
    }
    if (id.includes('stop')) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: 'stop game'})
        });
    }
    if (id.includes('resume')) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: 'resume game'})
        });
    }
    if (id.includes('shutdown')) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({key: 'shutdown game'})
        });
    }
});