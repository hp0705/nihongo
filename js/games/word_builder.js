/**
 * js/games/word_builder.js
 * Trò 5: "Ghép từ" - ghép các chữ rời thành từ vựng hoàn chỉnh.
 */

import { UI } from '../core/ui.js';

export default {
  id: 'word_builder',

  async start(ctx) {
    const { data, audio, progress, srs, rng, root, lesson, level = 1, settings, onExit } = ctx;
    root.innerHTML = '';

    const readableWords = data.readableWords(lesson.order);
    if (readableWords.length === 0) {
      return { stars: 3, correct: 0, wrong: 0, answers: [] };
    }

    const wbConfig = data.config?.games?.word_builder || {};
    const hintAfterWrong = wbConfig.hint_after_wrong || 2;
    const maxTilesByLevel = wbConfig.max_tiles?.[Math.min(level - 1, 2)] || 3;

    const questionsCount = Math.min(readableWords.length, data.config?.session?.questions_per_game || 8);
    const poolIds = readableWords.map(w => w.id);
    const questions = srs.pickItems(poolIds, progress.state.words, questionsCount, { rng });

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
        const targetWord = data.wordById[targetId];

        // Lấy danh sách ký tự cấu thành từ
        // word.kana_ids là mảng các kana id cấu thành từ
        const requiredKanaIds = targetWord.kana_ids || [];
        const requiredChars = requiredKanaIds.map(id => data.kanaById[id]?.char || id);

        // Chuẩn bị các viên gạch (tiles): các chữ đúng + một số chữ nhiễu từ các chữ đã học
        const allTaughtKanaIds = data.taughtKanaIds(lesson.order);
        const distractorKanaPool = allTaughtKanaIds.filter(id => !requiredKanaIds.includes(id));
        const numDistractors = Math.max(0, Math.min(2, maxTilesByLevel - requiredKanaIds.length));

        const chosenDistractorIds = rng.shuffle(distractorKanaPool).slice(0, numDistractors);

        // Tạo danh sách tiles có id định danh duy nhất cho từng tile (để hỗ trợ ký tự trùng lặp như おいしい)
        const tiles = [
          ...requiredKanaIds.map((kId, i) => ({
            tileId: `req_${i}_${kId}`,
            kanaId: kId,
            char: data.kanaById[kId]?.char || kId,
            isUsed: false
          })),
          ...chosenDistractorIds.map((kId, i) => ({
            tileId: `dist_${i}_${kId}`,
            kanaId: kId,
            char: data.kanaById[kId]?.char || kId,
            isUsed: false
          }))
        ];

        const shuffledTiles = rng.shuffle(tiles);

        // Trạng thái các ô trống
        let currentSlotIndex = 0; // Ô đang cần điền tiếp theo
        let roundWrong = 0;
        let isWordCompleted = false;

        root.innerHTML = `
          <div class="game-container word-builder-game">
            ${renderHeader(idx, questions.length)}

            <div class="wb-target-card">
              <div class="wb-emoji" id="wb-emoji-anim">${targetWord.emoji || '✨'}</div>
              <div class="wb-meaning">${targetWord.vi}</div>
              ${settings.romaji ? `<div class="wb-romaji">${targetWord.romaji}</div>` : ''}
            </div>

            <!-- Các ô trống để ghép chữ -->
            <div class="wb-slots-row" id="wb-slots-row">
              ${requiredKanaIds.map((kId, i) => `
                <div class="wb-slot ${i === 0 ? 'active' : ''}" data-index="${i}" data-expected-char="${data.kanaById[kId]?.char || kId}">
                  <span class="slot-placeholder">?</span>
                </div>
              `).join('')}
            </div>

            <!-- Khay chứa các viên gạch chữ -->
            <div class="wb-tiles-tray" id="wb-tiles-tray">
              ${shuffledTiles.map(tile => `
                <button class="wb-tile" data-tile-id="${tile.tileId}" data-char="${tile.char}">
                  ${tile.char}
                </button>
              `).join('')}
            </div>
          </div>
        `;

        bindExitButton();

        const replayBtn = root.querySelector('#btn-replay-header');
        async function playWordAudio(speed = 'normal') {
          if (replayBtn) replayBtn.classList.add('pulse');
          const path = audio.audioFor('word', targetWord, speed);
          await audio.play(path, { fallbackText: targetWord.word });
          if (replayBtn) replayBtn.classList.remove('pulse');
        }

        if (replayBtn) {
          replayBtn.onclick = () => {
            audio.playSfx('click');
            playWordAudio('normal');
          };
        }

        // Tự động phát âm thanh từ
        setTimeout(() => playWordAudio('normal'), 200);

        const slotEls = root.querySelectorAll('.wb-slot');
        const tileBtns = root.querySelectorAll('.wb-tile');

        function updateSlotHighlights() {
          slotEls.forEach((slot, i) => {
            if (i === currentSlotIndex) {
              slot.classList.add('active');
            } else {
              slot.classList.remove('active');
            }
          });
        }

        function checkNextHint() {
          if (roundWrong >= hintAfterWrong && currentSlotIndex < requiredChars.length) {
            const expectedChar = requiredChars[currentSlotIndex];
            tileBtns.forEach(btn => {
              if (btn.dataset.char === expectedChar && !btn.classList.contains('locked')) {
                btn.classList.add('hint-highlight');
              }
            });
          }
        }

        // Xử lý khi bé bấm hoặc kéo thả tile
        tileBtns.forEach(btn => {
          btn.onclick = async () => {
            if (isWordCompleted || btn.classList.contains('locked')) return;

            const char = btn.dataset.char;
            const expectedChar = requiredChars[currentSlotIndex];

            if (char === expectedChar) {
              // Đúng! Khóa viên gạch vào ô trống
              audio.playSfx('correct');
              btn.classList.add('locked');
              btn.classList.remove('hint-highlight');

              const currentSlot = slotEls[currentSlotIndex];
              currentSlot.classList.remove('active');
              currentSlot.classList.add('filled');
              currentSlot.innerHTML = `<span class="slot-char">${char}</span>`;

              currentSlotIndex++;

              if (currentSlotIndex >= requiredChars.length) {
                // Hoàn thành từ!
                isWordCompleted = true;
                totalCorrect++;
                const isFirstTry = roundWrong === 0;
                answers.push({ kind: 'word', id: targetId, correct: isFirstTry });
                progress.recordAnswer('word', targetId, isFirstTry, data.config.mastery);

                const emojiEl = root.querySelector('#wb-emoji-anim');
                if (emojiEl) emojiEl.classList.add('celebrate-jump');

                // Phát lại toàn bộ từ, sau đó phát trọn vẹn lời khen マイちゃん rồi mới chuyển câu
                const wordAudioPath = audio.audioFor('word', targetWord, 'normal');
                audio.play(wordAudioPath, { fallbackText: targetWord.word }).then(() => {
                  const phrase = audio.getPraisePhrase(data);
                  let praisePromise = Promise.resolve();
                  if (phrase) {
                    UI.showCheerBubble(phrase.text, phrase.vi, 'celebrate');
                    praisePromise = audio.play(audio.audioFor('ui', phrase), { fallbackText: phrase.text });
                  }
                  praisePromise.then(() => {
                    setTimeout(() => {
                      if (!isExited) {
                        qIndex++;
                        showQuestion(qIndex);
                      }
                    }, 400);
                  });
                });
              } else {
                updateSlotHighlights();
              }
            } else {
              // Sai! Rung nhẹ và nảy về
              roundWrong++;
              totalWrong++;
              audio.playSfx('wrong');
              btn.classList.add('shake', 'wrong');

              // Phát lời động viên tiếng Nhật cho マイちゃん
              audio.playEncouragement(data).then(phrase => {
                if (phrase) UI.showCheerBubble(phrase.text, phrase.vi, 'yawn');
              });

              setTimeout(() => {
                btn.classList.remove('shake', 'wrong');
              }, 500);

              checkNextHint();
            }
          };
        });
      }

      showQuestion(0);
    });
  }
};
