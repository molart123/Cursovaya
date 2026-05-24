    (function() {
      const teamId = '2';
      const teamName = 'Команда 2';

      const gameArea = document.getElementById('gameArea');
      const scoreDisplay = document.getElementById('scoreDisplay');
      const timerDisplay = document.getElementById('timerDisplay');
      const messageOverlay = document.getElementById('messageOverlay');

      let gameConfig = null;
      let gameActive = false;
      let gamePaused = false;
      let score = 0;
      let timeLeft = 0;
      let timerInterval = null;
      let enemies = [];
      let animationFrameId = null;
      let canShoot = true;

      const channel = new BroadcastChannel('laser-game');

      const themes = {
        heroes_vs_villains: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%221.5%22 fill=%22white%22/%3E%3C/svg%3E") repeat, #0b0b2a',
        frost_legion: 'linear-gradient(#2d5a27, #1a3b18)',
      };

      channel.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'config') {
          gameConfig = msg;
          applyTheme(gameConfig.theme);
        } else if (msg.type === 'start') {
          if (!gameConfig) return;
          if (gameConfig.mode === '1' && teamId !== '1') {
            showMessage('Ожидание игры...');
            return;
          }
          startGame();
        } else if (msg.type === 'pause') {
          pauseGame();
        } else if (msg.type === 'resume') {
          resumeGame();
        } else if (msg.type === 'end') {
          endGame(true);
        }
      };

      function applyTheme(theme) {
        const bg = themes[theme] || themes.heroes_vs_villains;
        document.body.style.background = bg;
      }

      function startGame() {
        resetGame();
        gameActive = true;
        gamePaused = false;
        timeLeft = gameConfig.duration;
        updateTimerDisplay();
        timerInterval = setInterval(tickTimer, 1000);
        spawnEnemyLoop();
        animationFrameId = requestAnimationFrame(moveEnemies);
        hideMessage();
        canShoot = true;
      }

      function resetGame() {
        enemies.forEach(e => e.element.remove());
        enemies = [];
        score = 0;
        scoreDisplay.textContent = 'Очки: 0';
        if (timerInterval) clearInterval(timerInterval);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }

      function pauseGame() {
        if (!gameActive || gamePaused) return;
        gamePaused = true;
        if (timerInterval) clearInterval(timerInterval);
        showMessage('⏸️ ПАУЗА');
      }

      function resumeGame() {
        if (!gameActive || !gamePaused) return;
        gamePaused = false;
        timerInterval = setInterval(tickTimer, 1000);
        hideMessage();
      }

      function endGame(adminEnded = false) {
        if (!gameActive) return;
        gameActive = false;
        gamePaused = false;
        if (timerInterval) clearInterval(timerInterval);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        channel.postMessage({ type: 'score', team: teamName, score: score, mode: gameConfig?.mode || '1' });
        showMessage(`🏁 Игра окончена!\nВаш счёт: ${score}`, false);
        enemies.forEach(e => e.element.remove());
        enemies = [];
      }

      function tickTimer() {
        if (gamePaused) return;
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) endGame();
      }

      function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      }

      let spawnInterval = null;
      function spawnEnemyLoop() {
        if (spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(() => {
          if (!gameActive || gamePaused) return;
          if (enemies.length >= 12) return;
          createEnemy();
        }, 1000);
      }

      function createEnemy() {
        const rand = Math.random();
        let life, cssClass;
        if (rand < 0.6) { life = 1; cssClass = 'easy'; }
        else if (rand < 0.85) { life = 2; cssClass = 'medium'; }
        else { life = 3; cssClass = 'hard'; }

        const enemy = {
          life: life,
          maxLife: life,
          element: document.createElement('div'),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        };
        enemy.element.className = `enemy ${cssClass}`;
        updateEnemyPosition(enemy);
        gameArea.appendChild(enemy.element);
        enemies.push(enemy);
      }

      function updateEnemyPosition(enemy) {
        enemy.element.style.left = enemy.x + '%';
        enemy.element.style.top = enemy.y + '%';
      }

      let lastTimestamp = 0;
      function moveEnemies(timestamp) {
        if (!gameActive || gamePaused) {
          animationFrameId = requestAnimationFrame(moveEnemies);
          return;
        }
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        enemies.forEach(enemy => {
          enemy.x += enemy.vx * dt;
          enemy.y += enemy.vy * dt;
          if (enemy.x < 0 || enemy.x > 94) { enemy.vx *= -1; enemy.x = Math.max(0, Math.min(94, enemy.x)); }
          if (enemy.y < 0 || enemy.y > 94) { enemy.vy *= -1; enemy.y = Math.max(0, Math.min(94, enemy.y)); }
          updateEnemyPosition(enemy);
        });
        animationFrameId = requestAnimationFrame(moveEnemies);
      }

      function handleShot(e) {
        if (!gameActive || gamePaused || !canShoot) return;
        canShoot = false;
        const rect = gameArea.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        createShotEffect(e.clientX - rect.left, e.clientY - rect.top);

        const hitEnemy = getEnemyAtPoint(x, y);
        if (hitEnemy) {
          hitEnemy.life--;
          if (hitEnemy.life <= 0) {
            const points = hitEnemy.maxLife === 1 ? 5 : (hitEnemy.maxLife === 2 ? 10 : 20);
            score += points;
            scoreDisplay.textContent = 'Очки: ' + score;
            hitEnemy.element.remove();
            enemies = enemies.filter(e => e !== hitEnemy);
          }
        }
      }

      function getEnemyAtPoint(px, py) {
        for (const enemy of enemies) {
          const el = enemy.element;
          const rect = el.getBoundingClientRect();
          const gameRect = gameArea.getBoundingClientRect();
          const elCenterX = ((rect.left + rect.width/2) - gameRect.left) / gameRect.width * 100;
          const elCenterY = ((rect.top + rect.height/2) - gameRect.top) / gameRect.height * 100;
          const radiusX = (rect.width / gameRect.width * 100) / 2;
          const radiusY = (rect.height / gameRect.height * 100) / 2;
          if (Math.abs(px - elCenterX) <= radiusX && Math.abs(py - elCenterY) <= radiusY) return enemy;
        }
        return null;
      }

      function createShotEffect(pixelX, pixelY) {
        const img = document.createElement('div');
        img.className = 'shot-effect';
        img.style.left = pixelX + 'px';
        img.style.top = pixelY + 'px';
        gameArea.appendChild(img);
        setTimeout(() => img.classList.add('fading'), 2000);
        img.addEventListener('transitionend', () => img.remove());
        setTimeout(() => { if (img.parentNode) img.remove(); }, 3500);
      }

      function enableShot(e) { canShoot = true; }

      gameArea.addEventListener('mousedown', handleShot);
      window.addEventListener('mouseup', enableShot);
      gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) handleShot(touch);
      });
      window.addEventListener('touchend', enableShot);

      function showMessage(text, persistent = true) {
        messageOverlay.textContent = text;
        messageOverlay.style.display = 'block';
        if (!persistent) setTimeout(() => { messageOverlay.style.display = 'none'; }, 5000);
      }

      function hideMessage() { messageOverlay.style.display = 'none'; }

      applyTheme('heroes_vs_villains');
      showMessage('Ожидание запуска игры...');
    })();