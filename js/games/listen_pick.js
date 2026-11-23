/**
 * js/games/listen_pick.js
 * Trò 2: "Nghe và chọn" - rèn luyện phản xạ nối âm thanh với mặt chữ và từ vựng.
 */

import { UI } from '../core/ui.js';

export default {
  id: 'listen_pick',

  async start(ctx) {
    const { data, audio, progress, srs, rng, root, lesson, level = 1, settings, onExit } = ctx;
    root.innerHTML = '';

    const questionsCount = data.config?.session?.questions_per_game || 8;
    const isWordMode = level >= 3;

    // Chuẩn bị pool câu hỏi
    let poolIds = [];
    let mustInclude = [];
    let kind = 'kana';

    if (isWordMode) {
      kind = 'word';
      const readableWords = data.readableWords(lesson.order);
      poolIds = readableWords.map(w => w.id);
      mustInclude = lesson.intro_words?.filter(id => poolIds.includes(id)) || [];
      if (poolIds.length === 0) {
        // Fallback sang kana nếu chưa có từ đọc được
        kind = 'kana';
        poolIds = data.taughtKanaIds(lesson.order);
        mustInclude = lesson.kana || [];
      }
    } else {
      kind = 'kana';
      poolIds = data.taughtKanaIds(lesson.order);
      mustInclude = lesson.kana || [];
    }

    if (poolIds.length === 0) {
      return { stars: 3, correct: 0, wrong: 0, answers: [] };
    }

    // Chọn n câu hỏi theo SRS
    const progressMap = kind === 'kana' ? progress.state.kana : progress.state.words;
    const questions = srs.pickItems(poolIds, progressMap, questionsCount, {
      mustInclude,
      maxOldRatio: 0.4,
      rng
    });

    const choicesCount = level === 1 ? 3 : 4;
    const answers = [];
    let totalCorrect = 0;
    let totalWrong = 0;

    return new Promise((resolve) => {
      let isExited = false;
      let qIndex = 0;

      function handleExit() {
        isExited = true;
        if (onExit) onExit();
        resolve(null);
      }

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
            <div class="game-header-blank"></div>
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
          // Xong toàn bộ câu hỏi
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
        const targetItem = kind === 'kana' ? data.kanaById[targetId] : data.wordById[targetId];

        // Tạo distractors
        const distractors = srs.makeDistractors(targetId, poolIds, choicesCount - 1, kind, rng, data);
        const choices = rng.shuffle([targetId, ...distractors]);

        let wrongCount = 0;
        let isAnswered = false;

        root.innerHTML = `
          <div class="game-container listen-pick-game">
            ${renderHeader(idx, questions.length)}
            
            <div class="question-instruction">
              <span class="instruction-text">Bé nghe và chọn đáp án nhé:</span>
            </div>

            <div class="audio-prompt-center">
              <button class="btn-big-speaker" id="btn-replay-speaker" aria-label="Nghe lại âm thanh">
                <span class="speaker-icon">🔊</span>
                <span class="speaker-label">Nghe lại</span>
              </button>
            </div>

            <div class="choices-grid ${choices.length === 3 ? 'choices-3' : 'choices-4'}">
              ${choices.map(id => {
                const item = kind === 'kana' ? data.kanaById[id] : data.wordById[id];
                if (kind === 'kana') {
                  return `
                    <button class="choice-card" data-id="${id}">
                      <span class="choice-char">${item.char}</span>
                    </button>
                  `;
                } else {
                  return `
                    <button class="choice-card choice-word-card" data-id="${id}">
                      <span class="choice-emoji">${item.emoji || '✨'}</span>
                      <span class="choice-word">${item.word}</span>
                      ${settings.romaji ? `<span class="choice-romaji">${item.romaji}</span>` : ''}
                    </button>
                  `;
                }
              }).join('')}
            </div>
          </div>
        `;

        bindExitButton();

        const replayBtn = root.querySelector('#btn-replay-speaker');
        async function playVoice() {
          replayBtn.classList.add('pulse');
          const audioPath = audio.audioFor(kind, targetItem, 'normal');
          const fallbackText = kind === 'kana' ? targetItem.char : targetItem.word;
          await audio.play(audioPath, { fallbackText });
          replayBtn.classList.remove('pulse');
        }

        replayBtn.onclick = playVoice;
        setTimeout(playVoice, 200);

        const choiceCards = root.querySelectorAll('.choice-card');
        choiceCards.forEach(btn => {
          btn.onclick = async () => {
            if (isAnswered) return;
            const chosenId = btn.dataset.id;

            if (chosenId === targetId) {
              isAnswered = true;
              btn.classList.add('correct');
              audio.playSfx('correct');
              totalCorrect++;
              const isFirstTry = wrongCount === 0;
              answers.push({ kind, id: targetId, correct: isFirstTry });
              progress.recordAnswer(kind, targetId, isFirstTry, data.config.mastery);

              // Phát lời khen tiếng Nhật ngẫu nhiên khen マイちゃん
              audio.playPraise(data).then(phrase => {
                if (phrase) UI.showCheerBubble(phrase.text, phrase.vi, 'celebrate');
              });

              setTimeout(() => {
                qIndex++;
                showQuestion(qIndex);
              }, 1300);
            } else {
              wrongCount++;
              totalWrong++;
              btn.classList.add('shake', 'wrong');
              audio.playSfx('wrong');

              // Phát lời động viên tiếng Nhật cho マイちゃん
              audio.playEncouragement(data).then(phrase => {
                if (phrase) UI.showCheerBubble(phrase.text, phrase.vi, 'yawn');
                setTimeout(playVoice, 200);
              });

              // Sau 2 lần sai tự động gợi ý đáp án đúng
              if (wrongCount >= 2) {
                choiceCards.forEach(b => {
                  if (b.dataset.id === targetId) {
                    b.classList.add('hint-highlight');
                  }
                });
              }

              setTimeout(() => {
                btn.classList.remove('shake');
              }, 500);
            }
          };
        });
      }

      showQuestion(0);
    });
  }
};
