const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(express.json());

// Загрузка базы данных
let database;
try {
  database = JSON.parse(fs.readFileSync('database.json', 'utf8'));
} catch (e) {
  database = {
    themes: ["space", "nature", "future"],
    rounds: 5,
    timePerQuestion: 15,
    questions: [],
    leaderboard: [],
    teams: []
  };
}

// Состояния игры
const State = { LOBBY: 'lobby', PLAYING: 'playing', PAUSED: 'paused', ANSWER: 'answer', FINISHED: 'finished' };

class Game {
  constructor() {
    this.state = State.LOBBY;
    this.mode = null; // 1, 2, 4
    this.currentQuestionIndex = -1;
    this.questions = [];
    this.timePerQuestion = 15;
    this.answers = {}; // teamId -> choice index
    this.timer = null;
    this.remainingTime = 0;
    this.timerStarted = null;
    this.theme = 'space';
    this.teams = { A: 0, B: 0, C: 0, D: 0 }; // очки
    this.teamClients = { A: null, B: null, C: null, D: null }; // привязка ws
  }

  setMode(mode) {
    this.mode = mode;
    // Сброс команд в зависимости от режима
    if (mode == 1) {
      this.activeTeams = ['A'];
    } else if (mode == 2) {
      this.activeTeams = ['A', 'B'];
    } else if (mode == 4) {
      this.activeTeams = ['A', 'B', 'C', 'D'];
    }
    // Обнуляем очки
    Object.keys(this.teams).forEach(k => this.teams[k] = 0);
  }

  startGame(questions, time) {
    this.questions = questions.slice(0, database.rounds);
    this.timePerQuestion = time || database.timePerQuestion;
    this.currentQuestionIndex = 0;
    this.state = State.PLAYING;
    this.sendToAllBoards({ type: 'game_started', mode: this.mode, theme: this.theme });
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }
    const q = this.questions[this.currentQuestionIndex];
    this.answers = {};
    this.activeTeams.forEach(t => this.answers[t] = null);
    this.sendToAllBoards({
      type: 'next_question',
      question: q,
      time: this.timePerQuestion,
      teamScores: this.teams,
      activeTeams: this.activeTeams
    });
    this.startTimer(this.timePerQuestion);
  }

  startTimer(duration) {
    this.clearTimer();
    this.remainingTime = duration;
    this.timerStarted = Date.now();
    this.timer = setTimeout(() => this.timeExpired(), duration * 1000);
  }

  pauseTimer() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    const elapsed = (Date.now() - this.timerStarted) / 1000;
    this.remainingTime = Math.max(0, this.remainingTime - elapsed);
    this.timer = null;
  }

  resumeTimer() {
    if (this.remainingTime <= 0) {
      this.timeExpired();
      return;
    }
    this.timerStarted = Date.now();
    this.timer = setTimeout(() => this.timeExpired(), this.remainingTime * 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  timeExpired() {
    this.clearTimer();
    this.processAnswers();
  }

  submitAnswer(teamId, choice) {
    if (this.state !== State.PLAYING) return false;
    if (!this.activeTeams.includes(teamId)) return false;
    if (this.answers[teamId] !== null) return false; // уже отвечено
    this.answers[teamId] = choice;
    // Проверить, все ли ответили
    if (Object.values(this.answers).filter(v => v !== null).length === this.activeTeams.length) {
      this.clearTimer();
      this.processAnswers();
    }
    return true;
  }

  processAnswers() {
    const q = this.questions[this.currentQuestionIndex];
    const correct = q.correct;
    // Подсчёт очков
    this.activeTeams.forEach(team => {
      if (this.answers[team] === correct) this.teams[team] += 1;
    });
    this.state = State.ANSWER;
    this.sendToAllBoards({
      type: 'show_answer',
      correct: correct,
      answers: this.answers,
      teamScores: this.teams,
      questionId: q.id
    });
    // Переход к следующему вопросу через паузу
    setTimeout(() => {
      if (this.state === State.ANSWER) {
        this.currentQuestionIndex++;
        this.state = State.PLAYING;
        this.nextQuestion();
      }
    }, 4000); // 4 секунды показа правильного ответа
  }

  pauseGame() {
    if (this.state === State.PLAYING || this.state === State.ANSWER) {
      this.pauseTimer();
      this.state = State.PAUSED;
      this.sendToAllBoards({ type: 'game_paused' });
      this.sendToAdmin({ type: 'pause_status', paused: true });
    }
  }

  resumeGame() {
    if (this.state === State.PAUSED) {
      this.state = this.answers && Object.keys(this.answers).length ? State.PLAYING : State.PLAYING;
      this.resumeTimer();
      this.sendToAllBoards({ type: 'game_resumed', remainingTime: this.remainingTime });
      this.sendToAdmin({ type: 'pause_status', paused: false });
    }
  }

  endGame() {
    this.clearTimer();
    this.state = State.FINISHED;
    this.sendToAllBoards({
      type: 'game_over',
      teamScores: this.teams,
      leaderboard: database.leaderboard
    });
  }

  sendToAllBoards(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.role === 'board') {
        client.send(JSON.stringify(data));
      }
    });
  }

  sendToAdmin(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.role === 'admin') {
        client.send(JSON.stringify(data));
      }
    });
  }
}

const game = new Game();

// WebSocket обработка
wss.on('connection', (ws) => {
  ws.role = null;
  ws.boardId = null;

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) { return; }

    // Регистрация
    if (data.type === 'register') {
      if (data.role === 'admin') {
        ws.role = 'admin';
        ws.send(JSON.stringify({ type: 'registered', role: 'admin' }));
      } else if (data.role === 'board' && data.boardId) {
        ws.role = 'board';
        ws.boardId = data.boardId; // 1 или 2
        ws.send(JSON.stringify({ type: 'registered', boardId: data.boardId }));
        // Привязка команд будет назначена позже при старте игры
      }
      return;
    }

    // Команда паузы (только админ может поставить/снять)
    if (data.type === 'pause') {
      if (ws.role === 'admin') {
        game.pauseGame();
      }
      return;
    }
    if (data.type === 'resume') {
      if (ws.role === 'admin') {
        game.resumeGame();
      }
      return;
    }

    // Ответ от доски
    if (data.type === 'answer' && ws.role === 'board') {
      // Определяем команду по boardId и teamId
      if (!game.mode) return;
      const teamId = data.teamId;
      if (game.activeTeams.includes(teamId)) {
        const success = game.submitAnswer(teamId, data.choice);
        ws.send(JSON.stringify({ type: 'answer_accepted', teamId }));
      }
      return;
    }

    // Старт игры (от админа)
    if (data.type === 'start_game' && ws.role === 'admin') {
      game.setMode(data.mode);
      game.theme = data.theme || 'space';
      database.rounds = data.rounds || database.rounds;
      database.timePerQuestion = data.time || database.timePerQuestion;
      game.startGame(database.questions, database.timePerQuestion);
      return;
    }

    // Смена темы (админ)
    if (data.type === 'set_theme' && ws.role === 'admin') {
      game.theme = data.theme;
      game.sendToAllBoards({ type: 'theme_change', theme: data.theme });
      ws.send(JSON.stringify({ type: 'theme_changed', theme: data.theme }));
      return;
    }
  });

  ws.on('close', () => {
    // удаление привязок не критично, при переподключении регистрируются заново
  });
});

server.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000');
});