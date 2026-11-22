/**
 * js/games/meet.js
 * Trò 1: "Gặp chữ" - học nhận diện chữ mới qua thẻ lớn, phát âm và từ minh hoạ.
 */

export default {
  id: 'meet',

  async start(ctx) {
    const { data, audio, progress, rng, root, lesson, settings, onExit } = ctx;
    root.innerHTML = '';

    const lessonKanaIds = lesson.kana || [];
    if (lessonKanaIds.length === 0) {
      return { stars: 3, correct: 0, wrong: 0, answers: [] };
    }

    const answers = [];
    let totalWrong = 0;
    let totalCorrect = 0;

    return new Promise((resolve) => {
      let isExited = false;
      let exitTimer = null;

      function cleanup() {
        if (exitTimer) clearTimeout(exitTimer);
      }

      function handleExit() {
        cleanup();
        isExited = true;
        if (onExit) onExit();
        resolve(null);
      }

      // Tạo header game: Nút thoát giữ 1s & thanh tiến độ
      function renderHeader(currentStep, totalSteps) {
        return `
          <div class="game-header">
            <button class="btn-exit-hold" id="btn-game-exit" aria-label="Thoát trò chơi">
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

      // GIAI ĐOẠN 1: Xem từng thẻ chữ lớn
      let cardIndex = 0;

      async function showCard(index) {
        if (isExited) return;
        if (index >= lessonKanaIds.length) {
          // Sang giai đoạn 2: Mini-check
          startMiniCheck(0);
          return;
        }

        const kanaId = lessonKanaIds[index];
        const kana = data.kanaById[kanaId];
        const anchorWord = kana.anchor_word_id ? data.wordById[kana.anchor_word_id] : null;

        let hasListened = false;

        // Định dạng từ minh hoạ: tô màu chữ đang học trong từ
        let wordHtml = '';
        if (anchorWord) {
          const chars = Array.from(anchorWord.word);
          const formattedChars = chars.map(c => {
            if (c === kana.char) {
              return `<span class="char-highlight">${c}</span>`;
            }
            return c;
          }).join('');

          wordHtml = `
            <div class="anchor-word-box">
              <span class="anchor-emoji">${anchorWord.emoji || '✨'}</span>
              <div class="anchor-text">
                <div class="anchor-word-kana">${formattedChars}</div>
                ${settings.romaji ? `<div class="anchor-word-romaji">${anchorWord.romaji}</div>` : ''}
                <div class="anchor-word-vi">${anchorWord.vi}</div>
              </div>
            </div>
          `;
        }

        root.innerHTML = `
          <div class="game-container meet-game">
            ${renderHeader(index, lessonKanaIds.length * 2)}
            <div class="card-large">
              <div class="kana-char-display">${kana.char}</div>
              
              <div class="kana-details">
                ${settings.romaji ? `<div class="kana-romaji">${kana.romaji}</div>` : ''}
                ${settings.vi_hint && kana.vi_hint ? `<div class="kana-vi-hint">(${kana.vi_hint})</div>` : ''}
              </div>

              <button class="btn-audio-huge" id="btn-play-kana" aria-label="Nghe phát âm">
                <span class="audio-wave">🔊</span>
                <span class="audio-hint-text">Chạm để nghe</span>
              </button>

              ${wordHtml}

              <button class="btn-primary btn-next-card disabled" id="btn-next-card" disabled>
                Tiếp theo ➔
              </button>
            </div>
          </div>
        `;

        bindExitButton();

        const playBtn = root.querySelector('#btn-play-kana');
        const nextBtn = root.querySelector('#btn-next-card');

        async function playKanaAudio() {
          audio.playSfx('click');
          playBtn.classList.add('pulse');
          const path = audio.audioFor('kana', kana);
          await audio.play(path, { fallbackText: kana.char });
          playBtn.classList.remove('pulse');

          if (!hasListened) {
            hasListened = true;
            nextBtn.classList.remove('disabled');
            nextBtn.removeAttribute('disabled');
            nextBtn.classList.add('glow');
          }
        }

        playBtn.onclick = playKanaAudio;
        // Tự động phát lần đầu cho bé nghe
        setTimeout(playKanaAudio, 300);

        nextBtn.onclick = () => {
          if (!hasListened) return;
          audio.playSfx('click');
          cardIndex++;
          showCard(cardIndex);
        };
      }

      // GIAI ĐOẠN 2: Mini-check 3 lựa chọn cho từng chữ vừa học
      let checkIndex = 0;

      async function showMiniCheck(index) {
        if (isExited) return;
        if (index >= lessonKanaIds.length) {
          // Hoàn thành cả 2 giai đoạn!
          finishGame();
          return;
        }

        const targetId = lessonKanaIds[index];
        const targetKana = data.kanaById[targetId];

        // Lấy 2 đáp án nhiễu từ các chữ trong bài hoặc các chữ đã học
        const allPool = Array.from(new Set([...lessonKanaIds, ...data.taughtKanaIds(lesson.order)]));
        const distractors = ctx.srs.makeDistractors(targetId, allPool, 2, 'kana', rng, data);
        const choices = rng.shuffle([targetId, ...distractors]);

        let wrongCountForThisQuestion = 0;
        let isQuestionAnswered = false;

        root.innerHTML = `
          <div class="game-container meet-check-game">
            ${renderHeader(lessonKanaIds.length + index, lessonKanaIds.length * 2)}
            <div class="question-instruction">
              <span class="instruction-text">Bé hãy chọn chữ:</span>
              <button class="btn-audio-replay" id="btn-replay" aria-label="Nghe lại">🔊</button>
            </div>

            <div class="target-prompt">
              <span class="prompt-speaker-icon">👂</span>
              <span class="prompt-hint-romaji">${settings.romaji ? targetKana.romaji : '???'}</span>
            </div>

            <div class="choices-grid choices-3">
              ${choices.map(id => {
                const k = data.kanaById[id];
                return `
                  <button class="choice-card" data-id="${id}">
                    <span class="choice-char">${k.char}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;

        bindExitButton();

        const replayBtn = root.querySelector('#btn-replay');
        async function playTargetVoice() {
          replayBtn.classList.add('pulse');
          const path = audio.audioFor('kana', targetKana);
          await audio.play(path, { fallbackText: targetKana.char });
          replayBtn.classList.remove('pulse');
        }

        replayBtn.onclick = playTargetVoice;
        setTimeout(playTargetVoice, 200);

        const choiceBtns = root.querySelectorAll('.choice-card');
        choiceBtns.forEach(btn => {
          btn.onclick = async () => {
            if (isQuestionAnswered) return;
            const chosenId = btn.dataset.id;

            if (chosenId === targetId) {
              isQuestionAnswered = true;
              btn.classList.add('correct');
              audio.playSfx('correct');
              totalCorrect++;
              const isFirstTryCorrect = wrongCountForThisQuestion === 0;
              answers.push({ kind: 'kana', id: targetId, correct: isFirstTryCorrect });
              progress.recordAnswer('kana', targetId, isFirstTryCorrect, data.config.mastery);

              setTimeout(() => {
                checkIndex++;
                showMiniCheck(checkIndex);
              }, 900);
            } else {
              wrongCountForThisQuestion++;
              totalWrong++;
              btn.classList.add('shake', 'wrong');
              audio.playSfx('wrong');

              // Phát lại âm đúng
              setTimeout(playTargetVoice, 300);

              // Sau 2 lần sai: tự động tô gợi ý đáp án đúng
              if (wrongCountForThisQuestion >= 2) {
                choiceBtns.forEach(b => {
                  if (b.dataset.id === targetId) {
                    b.classList.add('hint-highlight');
                  }
                });
              }

              setTimeout(() => {
                btn.classList.remove('shake');
              }, 600);
            }
          };
        });
      }

      function startMiniCheck(idx) {
        checkIndex = idx;
        showMiniCheck(checkIndex);
      }

      function finishGame() {
        cleanup();
        // Tính sao theo luật: sai <= 1: 3 sao; sai <= 3: 2 sao; còn lại: 1 sao
        let stars = 1;
        if (totalWrong <= 1) stars = 3;
        else if (totalWrong <= 3) stars = 2;

        resolve({
          stars,
          correct: totalCorrect,
          wrong: totalWrong,
          answers
        });
      }

      // Khởi động thẻ đầu tiên
      showCard(0);
    });
  }
};
