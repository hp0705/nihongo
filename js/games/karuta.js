/**
 * js/games/karuta.js
 * Trò 4: "Karuta" - đấu thẻ bài truyền thống Nhật Bản với Bé Mây.
 */

import { UI } from '../core/ui.js';

export default {
  id: 'karuta',

  async start(ctx) {
    const { data, audio, progress, srs, rng, root, lesson, level = 1, settings, onExit } = ctx;
    root.innerHTML = '';

    const readableWords = data.readableWords(lesson.order);
    if (readableWords.length < 4) {
      return { stars: 3, correct: 0, wrong: 0, answers: [] };
    }

    const karutaConfig = data.config?.games?.karuta || {};
    const cardsOnBoardCount = karutaConfig.cards_on_board?.[Math.min(level - 1, 2)] || 4;
    const botReactionSeconds = karutaConfig.bot_reaction_seconds?.[Math.min(level - 1, 2)] || 5;
    const botName = karutaConfig.bot_name || 'Bé Mây';

    const questionsCount = Math.min(readableWords.length, data.config?.session?.questions_per_game || 8);
    const poolIds = readableWords.map(w => w.id);

    const questions = srs.pickItems(poolIds, progress.state.words, questionsCount, { rng });

    const answers = [];
    let childScore = 0;
    let botScore = 0;
    let totalWrong = 0;
    let totalCorrect = 0;
    let consecutiveMistakes = 0;

    return new Promise((resolve) => {
      let isExited = false;
      let botTimer = null;
      let qIndex = 0;

      function cleanup() {
        if (botTimer) clearTimeout(botTimer);
      }

      function handleExit() {
        cleanup();
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
            <div class="karuta-score-board">
              <div class="score-badge child-badge">
                <span class="badge-avatar">🧒</span>
                <span class="badge-num" id="child-score">${childScore}</span>
              </div>
              <span class="score-vs">VS</span>
              <div class="score-badge bot-badge">
                <span class="badge-avatar">☁️</span>
                <span class="badge-num" id="bot-score">${botScore}</span>
              </div>
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
        cleanup();

        if (idx >= questions.length) {
          // Kết thúc ván Karuta
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

        // Lấy các thẻ nhiễu trên chiếu tatami
        const distractors = srs.makeDistractors(targetId, poolIds, cardsOnBoardCount - 1, 'word', rng, data);
        const boardCardIds = rng.shuffle([targetId, ...distractors]);

        let isRoundOver = false;
        let roundWrong = 0;

        root.innerHTML = `
          <div class="game-container karuta-game">
            ${renderHeader(idx, questions.length)}
            
            <div class="karuta-tatami-board">
              <div class="tatami-grid cards-${boardCardIds.length}">
                ${boardCardIds.map(id => {
                  const w = data.wordById[id];
                  return `
                    <div class="karuta-card" data-id="${id}">
                      <div class="karuta-emoji">${w.emoji || '✨'}</div>
                      <div class="karuta-word">${w.word}</div>
                      ${settings.romaji ? `<div class="karuta-romaji">${w.romaji}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;

        bindExitButton();

        const replayBtn = root.querySelector('#btn-replay-header');
        async function playWordAudio() {
          if (replayBtn) replayBtn.classList.add('pulse');
          const path = audio.audioFor('word', targetWord, 'normal');
          await audio.play(path, { fallbackText: targetWord.word });
          if (replayBtn) replayBtn.classList.remove('pulse');
        }

        if (replayBtn) {
          replayBtn.onclick = () => {
            audio.playSfx('click');
            playWordAudio();
          };
        }

        // Tự động đọc từ
        setTimeout(playWordAudio, 200);

        // Tính thời gian phản ứng của Bé Mây
        let reactionTime = (botReactionSeconds + (rng.random() * 1.5 - 0.75)) * 1000;
        if (consecutiveMistakes >= 2) {
          // Giãn thêm 2 giây cho Bé Mây nếu bé liên tiếp sai
          reactionTime += 2000;
        }

        // Bé Mây tự động lấy thẻ nếu bé không bấm kịp
        botTimer = setTimeout(() => {
          if (isRoundOver || isExited) return;
          isRoundOver = true;
          botScore++;
          totalWrong++;
          consecutiveMistakes++;

          const targetCard = root.querySelector(`.karuta-card[data-id="${targetId}"]`);
          if (targetCard) {
            targetCard.classList.add('fly-to-bot');
          }

          audio.playSfx('wrong');
          answers.push({ kind: 'word', id: targetId, correct: false });
          progress.recordAnswer('word', targetId, false, data.config.mastery);

          // Hiện ngay bong bóng động viên nhẹ nhàng cho マイちゃん
          const botEncouragePhrase = audio.getEncouragePhrase(data);
          if (botEncouragePhrase) {
            UI.showCheerBubble(botEncouragePhrase.text, botEncouragePhrase.vi, 'yawn');
            audio.play(audio.audioFor('ui', botEncouragePhrase), { fallbackText: botEncouragePhrase.text });
          }

          setTimeout(() => {
            qIndex++;
            showQuestion(qIndex);
          }, 1400);
        }, Math.max(2500, reactionTime));

        // Bé chạm thẻ
        const cards = root.querySelectorAll('.karuta-card');
        cards.forEach(card => {
          card.onclick = () => {
            if (isRoundOver || isExited) return;
            const chosenId = card.dataset.id;

            if (chosenId === targetId) {
              isRoundOver = true;
              cleanup();
              childScore++;
              totalCorrect++;
              consecutiveMistakes = 0;

              card.classList.add('fly-to-child');
              audio.playSfx('correct');

              const isFirstTry = roundWrong === 0;
              answers.push({ kind: 'word', id: targetId, correct: isFirstTry });
              progress.recordAnswer('word', targetId, isFirstTry, data.config.mastery);

              // Hiện ngay bong bóng khen ngợi マイちゃん và phát âm thanh tiếng Nhật
              const phrase = audio.getPraisePhrase(data);
              if (phrase) {
                UI.showCheerBubble(phrase.text, phrase.vi, 'celebrate');
                audio.play(audio.audioFor('ui', phrase), { fallbackText: phrase.text });
              }

              setTimeout(() => {
                qIndex++;
                showQuestion(qIndex);
              }, 1400);
            } else {
              roundWrong++;
              totalWrong++;
              card.classList.add('shake', 'wrong');
              audio.playSfx('wrong');

              // Hiện ngay bong bóng động viên マイちゃん và phát âm thanh tiếng Nhật
              const phrase = audio.getEncouragePhrase(data);
              if (phrase) {
                UI.showCheerBubble(phrase.text, phrase.vi, 'yawn');
                audio.play(audio.audioFor('ui', phrase), { fallbackText: phrase.text }).then(() => {
                  setTimeout(playWordAudio, 200);
                });
              } else {
                setTimeout(playWordAudio, 200);
              }

              // Sau 2 lần bấm sai: tự động làm thẻ đúng phát sáng
              if (roundWrong >= 2) {
                const correctCard = root.querySelector(`.karuta-card[data-id="${targetId}"]`);
                if (correctCard) correctCard.classList.add('hint-highlight');
              }

              setTimeout(() => {
                card.classList.remove('shake');
              }, 500);
            }
          };
        });
      }

      showQuestion(0);
    });
  }
};
