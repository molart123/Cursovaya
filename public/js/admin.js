let ws;
let gamePaused = false;

function connect() {
  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register', role: 'admin' }));
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'pause_status') {
      gamePaused = msg.paused;
      updatePauseButton();
    }
    if (msg.type === 'time_update') {
      document.getElementById('timeDisplay').textContent = msg.remaining;
    }
  };
  ws.onclose = () => setTimeout(connect, 3000);
}

document.getElementById('startBtn').addEventListener('click', () => {
  const mode = parseInt(document.getElementById('modeSelect').value);
  const theme = document.getElementById('themeSelect').value;
  ws.send(JSON.stringify({
    type: 'start_game',
    mode,
    theme,
    rounds: 5,
    time: 15
  }));
  document.getElementById('status').textContent = 'Игра запущена';
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  if (!gamePaused) {
    ws.send(JSON.stringify({ type: 'pause' }));
  } else {
    ws.send(JSON.stringify({ type: 'resume' }));
  }
});

document.getElementById('themeApplyBtn').addEventListener('click', () => {
  const theme = document.getElementById('themeSelect').value;
  ws.send(JSON.stringify({ type: 'set_theme', theme }));
});

function updatePauseButton() {
  const btn = document.getElementById('pauseBtn');
  if (gamePaused) {
    btn.textContent = '▶ Продолжить';
    btn.className = 'resume-btn';
  } else {
    btn.textContent = '⏸ Пауза';
    btn.className = 'pause-btn';
  }
}

connect();