const boardId = window.location.pathname.includes('/board/2') ? 2 : 1;
let ws;
let currentMode = null;
let activeTeams = [];
let teamMapping = {}; // teamId -> DOM-контейнер
let localTimer = null;
let localTimeRemaining = 0;
let paused = false;

// Инициализация WebSocket
function connect() {
  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register', role: 'board', boardId }));
  };
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
  ws.onclose = () => setTimeout(connect, 3000);
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'registered':
      console.log(`Доска ${boardId} зарегистрирована`);
      break;
    case 'game_started':
      currentMode = msg.mode;
      setTheme(msg.theme);
      setupLayout(msg.mode);
      break;
    case 'next_question':
      updateQuestion(msg);
      break;
    case 'show_answer':
      showAnswer(msg);
      break;
    case 'game_paused':
      setPaused(true);
      break;
    case 'game_resumed':
      setPaused(false);
      if (msg.remainingTime) startLocalTimer(msg.remainingTime);
      break;
    case 'game_over':
      showGameOver(msg.teamScores);
      break;
    case 'theme_change':
      setTheme(msg.theme);
      break;
  }
}

function setupLayout(mode) {
  const split = document.getElementById('split-screen');
  const single = document.getElementById('single-screen');
  if (mode === 4) {
    split.style.display = 'flex';
    single.style.display = 'none';
    activeTeams = boardId === 1 ? ['A', 'B'] : ['C', 'D'];
    document.getElementById('team-left').querySelector('.team-letter').textContent = activeTeams[0];
    document.getElementById('team-right').querySelector('.team-letter').textContent = activeTeams[1];
    teamMapping = {
      [activeTeams[0]]: document.getElementById('team-left'),
      [activeTeams[1]]: document.getElementById('team-right')
    };
  } else {
    split.style.display = 'none';
    single.style.display = 'flex';
    if (mode === 1) {
      activeTeams = boardId === 1 ? ['A'] : [];
      if (boardId === 2) {
        single.querySelector('.team-full').style.display = 'none';
        return;
      }
    } else if (mode === 2) {
      activeTeams = boardId === 1 ? ['A'] : ['B'];
    }
    teamMapping = {};
    if (activeTeams.length) {
      teamMapping[activeTeams[0]] = document.querySelector('.team-full');
      document.querySelector('.team-full .team-letter').textContent = activeTeams[0];
    }
  }
  // Сброс счёта
  Object.values(teamMapping).forEach(container => {
    container.querySelector('.score-box').textContent = '0';
    container.querySelector('.question-text').textContent = '';
    container.querySelector('.options-grid').innerHTML = '';
  });
}

function updateQuestion(msg) {
  clearLocalTimer();
  paused = false;
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('pause-indicator').style.display = 'none';
  const q = msg.question;
  // Для каждой активной команды на этой доске обновить интерфейс
  Object.entries(teamMapping).forEach(([teamId, container]) => {
    container.querySelector('.question-text').textContent = q.text;
    container.querySelector('.score-box').textContent = msg.teamScores[teamId] || 0;
    const grid = container.querySelector('.options-grid');
    grid.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => submitAnswer(teamId, idx));
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); submitAnswer(teamId, idx); });
      grid.appendChild(btn);
    });
  });
  startLocalTimer(msg.time);
}

function submitAnswer(teamId, choice) {
  if (paused || !currentMode || !activeTeams.includes(teamId)) return;
  ws.send(JSON.stringify({ type: 'answer', teamId, choice }));
  // Локальная блокировка кнопок этой команды
  const container = teamMapping[teamId];
  if (container) {
    container.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
  }
}

function startLocalTimer(seconds) {
  clearLocalTimer();
  localTimeRemaining = seconds;
  updateTimerDisplay();
  localTimer = setInterval(() => {
    if (!paused) {
      localTimeRemaining--;
      updateTimerDisplay();
      if (localTimeRemaining <= 0) {
        clearLocalTimer();
      }
    }
  }, 1000);
}

function clearLocalTimer() {
  if (localTimer) { clearInterval(localTimer); localTimer = null; }
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('timer');
  if (!timerEl) {
    const t = document.createElement('div');
    t.id = 'timer';
    t.style.cssText = 'position:fixed; top:10px; right:20px; font-size:2em; background:rgba(0,0,0,0.7); color:white; padding:5px 15px; border-radius:10px;';
    document.body.appendChild(t);
  }
  document.getElementById('timer').textContent = localTimeRemaining;
}

function showAnswer(msg) {
  clearLocalTimer();
  const correct = msg.correct;
  Object.entries(teamMapping).forEach(([teamId, container]) => {
    const optButtons = container.querySelectorAll('.option-btn');
    optButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === correct) {
        btn.classList.add('correct');
      } else if (msg.answers[teamId] === idx && idx !== correct) {
        btn.classList.add('incorrect');
      }
    });
    container.querySelector('.score-box').textContent = msg.teamScores[teamId] || 0;
  });
}

function showGameOver(scores) {
  clearLocalTimer();
  document.getElementById('pause-overlay').style.display = 'none';
  const single = document.querySelector('.team-full');
  if (single && single.style.display !== 'none') {
    single.innerHTML = `<h2>Игра завершена!</h2><div>Счёт: ${JSON.stringify(scores)}</div>`;
  } else {
    document.getElementById('split-screen').innerHTML = `<div style="color:white; text-align:center; width:100%;"><h2>Игра завершена!</h2><div>Счёт: ${JSON.stringify(scores)}</div></div>`;
  }
}

function setPaused(pause) {
  paused = pause;
  if (pause) {
    document.getElementById('pause-overlay').style.display = 'flex';
    document.getElementById('pause-indicator').style.display = 'block';
    clearLocalTimer();
  } else {
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('pause-indicator').style.display = 'none';
  }
}

function setTheme(theme) {
  const link = document.getElementById('theme-style');
  link.href = `css/${theme}.css`;
}

// Первоначальное подключение
connect();