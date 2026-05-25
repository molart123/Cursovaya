// Темы
fetch('/themes')
    .then(r => r.json())
    .then(data => {
        const sel = document.getElementById('themeSelect');
        data.themes.forEach(t => {
            const o = document.createElement('option');
            o.value = t;
            o.textContent = t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            sel.appendChild(o);
        });
        sel.value = data.currentTheme;
    });

// Конфиг
fetch('/config')
    .then(r => r.json())
    .then(data => {
        document.getElementById('gameModeSelect').value = data.gameConfig.mode;
        document.getElementById('roundDurationInput').value = data.gameConfig.roundDuration;
        data.teams.forEach((t, i) => {
            const n = i + 1;
            document.getElementById('team' + n + 'NameLabel').textContent =
                (t.name || 'Команда ' + n) + ':';
            document.getElementById('team' + n + 'ScoreLabel').textContent =
                'Счёт: ' + t.score;
        });
    });

// Таймер
function updateTimer() {
    fetch('/board/state')
        .then(r => r.json())
        .then(d => {
            const m = Math.floor(d.remaining / 60);
            const s = d.remaining % 60;
            document.getElementById('timerDisplay').textContent =
                String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        });
}
setInterval(updateTimer, 1000);
updateTimer();

// События
document.getElementById('gameModeSelect').addEventListener('change', function() {
    fetch('/game-mode', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({key: this.value})
    });
});

document.getElementById('themeSelect').addEventListener('change', function() {
    fetch('/theme', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({key: this.value})
    });
});

document.getElementById('roundDurationInput').addEventListener('change', function() {
    const v = parseInt(this.value, 10);
    if (!isNaN(v) && v >= 10) {
        fetch('/round-duration', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({key: v})
        });
    } else {
        alert('Минимум 10 секунд');
        fetch('/config').then(r=>r.json()).then(d=>{
            this.value = d.gameConfig.roundDuration;
        });
    }
});

document.getElementById('teamsContainer').addEventListener('click', function(e) {
    if (e.target.id.includes('RenameBtn')) {
        const n = e.target.id.match(/\d+/)[0];
        const name = prompt('Новое название:');
        if (name) {
            fetch('/team/' + n + '/name', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({key: name})
            }).then(() => {
                document.getElementById('team' + n + 'NameLabel').textContent = name + ':';
            });
        }
    }
});

document.getElementById('isRunning').addEventListener('click', function(e) {
    const id = e.target.id;
    let action = '';
    if (id.includes('start')) action = 'start game';
    else if (id.includes('stop')) action = 'stop game';
    else if (id.includes('resume')) action = 'resume game';
    else if (id.includes('shutdown')) action = 'shutdown game';
    if (action) {
        fetch('/game/process', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({key: action})
        });
    }
});