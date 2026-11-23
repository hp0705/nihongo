/**
 * js/games/bubble_pop.js
 * Trò 3: "Bóng bay chữ" - giải toả căng thẳng, nhận diện nhanh mặt chữ kana.
 */

import { UI } from '../core/ui.js';

export default {
  id: 'bubble_pop',

  async start(ctx) {
    const { data, audio, progress, srs, rng, root, lesson, level = 1, onExit } = ctx;
    root.innerHTML = '';

    const questionsCount = data.config?.session?.questions_per_game || 8;
    const poolIds = data.taughtKanaIds(lesson.order);
    const mustInclude = lesson.kana || [];

    if (poolIds.length === 0) {
      return { stars: 3, correct: 0, wrong: 0, answers: [] };
    }

    const questions = srs.pickItems(poolIds, progress.state.kana, questionsCount, {
      mustInclude,
      maxOldRatio: 0.4,
      rng
    });

    const levelConfig = data.config?.games?.bubble_pop?.levels?.[Math.min(level - 1, 2)] || { speed: 'slow', bubbles: 5 };
    const numBubbles = Math.max(3, Math.min(poolIds.length, levelConfig.bubbles || 5));
    const speedMultiplier = levelConfig.speed === 'fast' ? 1.4 : (levelConfig.speed === 'medium' ? 1.0 : 0.7);

    const answers = [];
    let totalCorrect = 0;
    let totalWrong = 0;

    return new Promise((resolve) => {
      let isExited = false;
      let animFrameId = null;
      let idleTimer = null;
      let isPaused = false;
      let qIndex = 0;

      function cleanup() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (idleTimer) clearTimeout(idleTimer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }

      function handleExit() {
        cleanup();
        isExited = true;
        if (onExit) onExit();
        resolve(null);
      }

      function onVisibilityChange() {
        isPaused = document.hidden;
      }
      document.addEventListener('visibilitychange', onVisibilityChange);

      function renderHeader(currentStep, totalSteps) {
        return `
          <div class="game-header">
            <button class="btn-exit-hold" id="btn-game-exit" aria-label="Thoát">
              <span class="exit-icon">✖</span>
              <div class="exit-fill" id="exit-progress-fill"></div>
            </button>
            <div class="game-progress-bar">
              ${Array.from({ length: totalSteps }, (_, i) => `
                <div class="progress-dot ${i < currentStep ? 'done' : (i === currentStep ? 'current' : '')}"></div>
              `).join('')}
            </div>
            <button class="btn-audio-replay-small" id="btn-replay-header" aria-label="Nghe lại">🔊</button>
          </div>
        `;
      }

      function bindExitButton() {
        const btn = root.querySelector('#btn-game-exit');
        const fill = root.querySelector('#exit-progress-fill');
        if (!btn || !fill) return;

        let startTime = 0;
        let animId = null;

        function startHold(e) {
          e.preventDefault();
          startTime = Date.now();
          fill.style.width = '0%';

          function step() {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, (elapsed / 1000) * 100);
            fill.style.width = `${pct}%`;
            if (elapsed >= 1000) {
              cancelAnimationFrame(animId);
              handleExit();
            } else {
              animId = requestAnimationFrame(step);
            }
          }
          animId = requestAnimationFrame(step);
        }

        function endHold() {
          if (animId) cancelAnimationFrame(animId);
          fill.style.width = '0%';
        }

        btn.addEventListener('pointerdown', startHold);
        btn.addEventListener('pointerup', endHold);
        btn.addEventListener('pointerleave', endHold);
        btn.addEventListener('pointercancel', endHold);
      }

      async function showQuestion(idx) {
        if (isExited) return;
        if (idx >= questions.length) {
          cleanup();
          let stars = 1;
          if (totalWrong <= 1) stars = 3;
          else if (totalWrong <= 3) stars = 2;

          resolve({
            stars,
            correct: totalCorrect,
            wrong: totalWrong,
            answers
          });
          return;
        }

        const targetId = questions[idx];
        const targetKana = data.kanaById[targetId];

        // Lấy danh sách đáp án nhiễu
        const distractors = srs.makeDistractors(targetId, poolIds, numBubbles - 1, 'kana', rng, data);
        const bubbleIds = rng.shuffle([targetId, ...distractors]);

        let wrongCount = 0;
        let isQuestionDone = false;

        root.innerHTML = `
          <div class="game-container bubble-pop-game">
            ${renderHeader(idx, questions.length)}
            
            <div class="bubble-playfield" id="bubble-playfield">
              <!-- Các quả bóng bay sẽ trôi nổi ở đây -->
            </div>
          </div>
        `;

        bindExitButton();

        const playfield = root.querySelector('#bubble-playfield');
        const replayHeaderBtn = root.querySelector('#btn-replay-header');

        async function playTargetVoice() {
          if (replayHeaderBtn) replayHeaderBtn.classList.add('pulse');
          const path = audio.audioFor('kana', targetKana);
          await audio.play(path, { fallbackText: targetKana.char });
          if (replayHeaderBtn) replayHeaderBtn.classList.remove('pulse');
        }

        if (replayHeaderBtn) {
          replayHeaderBtn.onclick = () => {
            audio.playSfx('click');
            playTargetVoice();
          };
        }

        // Tự động phát âm thanh câu hỏi
        setTimeout(playTargetVoice, 200);

        // Reset timer 8s không chạm thì gợi ý
        function resetIdleTimer() {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            if (!isQuestionDone && !isExited) {
              const correctBubble = bubbles.find(b => b.id === targetId);
              if (correctBubble && correctBubble.el) {
                correctBubble.el.classList.add('hint-pulse');
              }
              playTargetVoice();
              resetIdleTimer();
            }
          }, 8000);
        }
        resetIdleTimer();

        // Khởi tạo các quả bóng bay
        const fieldWidth = playfield.clientWidth || 360;
        const fieldHeight = playfield.clientHeight || 450;
        const bubbleColors = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

        const bubbles = bubbleIds.map((id, index) => {
          const k = data.kanaById[id];
          const el = document.createElement('div');
          el.className = 'floating-bubble';
          el.dataset.id = id;
          el.style.backgroundColor = bubbleColors[index % bubbleColors.length];

          el.innerHTML = `
            <span class="bubble-char">${k.char}</span>
            <div class="bubble-shine"></div>
          `;

          playfield.appendChild(el);

          const size = 96;
          const x = (index * (fieldWidth - size) / (bubbleIds.length - 1 || 1)) + (rng.random() * 20 - 10);
          const y = fieldHeight - size - (index * 40) - (rng.random() * 30);
          const vy = -(1.2 + rng.random() * 0.8) * speedMultiplier;
          const vx = (rng.random() - 0.5) * 1.0;

          return {
            id,
            el,
            size,
            x: Math.max(10, Math.min(fieldWidth - size - 10, x)),
            y,
            vx,
            vy,
            popped: false
          };
        });

        // Bắt sự kiện chạm bóng
        bubbles.forEach(b => {
          b.el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (isQuestionDone || b.popped) return;
            resetIdleTimer();

            if (b.id === targetId) {
              isQuestionDone = true;
              b.popped = true;
              audio.playSfx('pop');
              audio.playSfx('correct');
              b.el.classList.add('bubble-explode');
              totalCorrect++;

              const isFirstTry = wrongCount === 0;
              answers.push({ kind: 'kana', id: targetId, correct: isFirstTry });
              progress.recordAnswer('kana', targetId, isFirstTry, data.config.mastery);

              // Phát lời khen tiếng Nhật ngẫu nhiên khen マイちゃん
              audio.playPraise(data).then(phrase => {
                if (phrase) UI.showCheerBubble(phrase.text, phrase.vi, 'celebrate');
              });

              if (idleTimer) clearTimeout(idleTimer);

              setTimeout(() => {
                if (animFrameId) cancelAnimationFrame(animFrameId);
                qIndex++;
                showQuestion(qIndex);
              }, 1200);
            } else {
              wrongCount++;
              totalWrong++;
              audio.playSfx('wrong');
              b.el.classList.add('bubble-shake');

              // Phát lời động viên tiếng Nhật cho マイちゃん
              audio.playEncouragement(data).then(phrase => {
                if (phrase) UI.showCheerBubble(phrase.text, phrase.vi, 'yawn');
                setTimeout(playTargetVoice, 200);
              });

              if (wrongCount >= 2) {
                const correctB = bubbles.find(item => item.id === targetId);
                if (correctB && correctB.el) {
                  correctB.el.classList.add('hint-pulse');
                }
              }

              setTimeout(() => {
                b.el.classList.remove('bubble-shake');
              }, 500);
            }
          });
        });

        // Vòng lặp vật lý trôi bóng nhẹ nhàng
        let lastTime = performance.now();
        function loop(now) {
          if (isExited || isQuestionDone) return;
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;

          if (!isPaused) {
            const curWidth = playfield.clientWidth || fieldWidth;
            const curHeight = playfield.clientHeight || fieldHeight;

            bubbles.forEach(b => {
              if (b.popped) return;

              b.y += b.vy * 60 * dt;
              b.x += b.vx * 60 * dt;

              // Chạm mép trên thì quay lại dưới
              if (b.y < -b.size) {
                b.y = curHeight + 20;
                b.x = rng.random() * (curWidth - b.size - 20) + 10;
              }

              // Chạm mép trái/phải thì bật lại
              if (b.x < 5) {
                b.x = 5;
                b.vx = Math.abs(b.vx);
              } else if (b.x > curWidth - b.size - 5) {
                b.x = curWidth - b.size - 5;
                b.vx = -Math.abs(b.vx);
              }

              b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
            });
          }

          animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
      }

      showQuestion(0);
    });
  }
};
