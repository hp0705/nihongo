/**
 * js/screens/home.js
 * Màn hình chính: Tuyến tàu Shinkansen nằm ngang, bậc con vật, nhiệm vụ hôm nay, sổ sticker và vùng phụ huynh.
 */

import { UI } from '../core/ui.js';

export default {
  render({ root, data, audio, progress, navigate }) {
    root.innerHTML = '';

    const stars = progress.getStars();
    const animalLevel = progress.getAnimalLevel(data.config.levels);
    const streak = progress.touchDay();
    const mission = progress.getTodayMission(data.lessonsOrdered);
    const stickers = progress.getStickers();
    const totalStickers = data.config.stickers?.length || 20;

    const missionDoneCount = mission.games.filter(g => g.done).length;

    root.innerHTML = `
      <div class="screen-home">
        <!-- Header: Bậc con vật, Sao, Chuỗi ngày, Phụ huynh -->
        <header class="home-header">
          <div class="user-rank-badge">
            <span class="rank-emoji">${animalLevel.currentLevel.emoji}</span>
            <div class="rank-info">
              <span class="rank-name">${animalLevel.currentLevel.name_vi} (${animalLevel.currentLevel.name_ja})</span>
              <div class="rank-bar-bg">
                <div class="rank-bar-fill" style="width: ${animalLevel.progressRatio * 100}%"></div>
              </div>
            </div>
          </div>

          <div class="header-stats">
            <div class="stat-pill star-pill">
              <span class="stat-icon">⭐</span>
              <span class="stat-value">${stars}</span>
            </div>
            <div class="stat-pill streak-pill" title="Số ngày liên tiếp lên tàu">
              <span class="stat-icon">🔥</span>
              <span class="stat-value">${streak} ngày</span>
            </div>
            <button class="btn-parent-gate" id="btn-open-parent" aria-label="Khu vực phụ huynh">
              ⚙️
            </button>
          </div>
        </header>

        <!-- Khung chào Bé Mây & Nhiệm vụ hôm nay -->
        <section class="mascot-mission-banner">
          <div class="mascot-greeting" id="mascot-greeting">
            ${UI.renderMascot('normal', '90px')}
            <div class="mascot-speech-bubble">
              <p class="bubble-ja">こんにちは！</p>
              <p class="bubble-vi">Bé Mây chào bé, cùng lên tàu nào!</p>
            </div>
          </div>

          <!-- Thẻ Nhiệm vụ hôm nay -->
          <div class="today-mission-card ${mission.completed ? 'completed' : ''}" id="mission-card">
            <div class="mission-header">
              <span class="mission-title">🎯 Nhiệm vụ hôm nay (${missionDoneCount}/3)</span>
              ${mission.completed ? '<span class="mission-badge-done">Đã hoàn thành! 🎉</span>' : ''}
            </div>
            <div class="mission-steps">
              ${mission.games.map((g, idx) => {
                const lesson = data.lessonById[g.lessonId];
                const gameNameMap = {
                  meet: 'Gặp chữ',
                  listen_pick: 'Nghe & chọn',
                  bubble_pop: 'Bóng bay',
                  karuta: 'Karuta',
                  word_builder: 'Ghép từ'
                };
                return `
                  <div class="mission-step-item ${g.done ? 'step-done' : ''}" data-lesson-id="${g.lessonId}" data-game-id="${g.gameId}">
                    <span class="step-check">${g.done ? '✅' : '⚪'}</span>
                    <span class="step-text">${lesson?.station?.emoji || '🚉'} ${gameNameMap[g.gameId] || g.gameId}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>

        <!-- Bản đồ tuyến đường sắt Shinkansen cuộn ngang -->
        <main class="railway-map-section">
          <div class="railway-scroll-wrapper" id="railway-scroll">
            <div class="railway-track">
              ${data.lessonsOrdered.map((lesson, idx) => {
                const isUnlocked = progress.isStationUnlocked(lesson.id, data.lessonsOrdered);
                const hasStamp = progress.hasStamp(lesson.id);
                const isReview = lesson.type === 'review';

                // Lấy tổng số sao đạt được tại ga này
                const bestStars = progress.state.lessons[lesson.id]?.best_stars || {};
                const starsCount = Object.values(bestStars).reduce((acc, s) => acc + s, 0);

                return `
                  <div class="station-node ${isUnlocked ? 'unlocked' : 'locked'} ${hasStamp ? 'stamped' : ''} ${isReview ? 'node-review' : ''}" 
                       data-lesson-id="${lesson.id}">
                    <div class="station-pole"></div>
                    <div class="station-pin">
                      <span class="station-emoji">${lesson.station?.emoji || '🚉'}</span>
                      ${!isUnlocked ? '<span class="lock-icon">🔒</span>' : ''}
                      ${hasStamp ? '<span class="stamp-icon">💮</span>' : ''}
                    </div>
                    <div class="station-signboard">
                      <div class="station-name-ja">${lesson.station?.name || lesson.id}</div>
                      <div class="station-title-vi">${lesson.title_vi}</div>
                      ${isUnlocked ? `
                        <div class="station-stars">
                          ⭐ ${starsCount}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </main>

        <!-- Footer: Nút sổ sticker -->
        <footer class="home-footer">
          <button class="btn-sticker-book" id="btn-open-stickers">
            <span class="book-icon">📖</span>
            <span class="book-label">Sổ Sticker (${stickers.length}/${totalStickers})</span>
          </button>
        </footer>
      </div>
    `;

    // Âm thanh chào khi bấm vào Bé Mây
    const mascotGreeting = root.querySelector('#mascot-greeting');
    if (mascotGreeting) {
      mascotGreeting.onclick = async () => {
        audio.playSfx('click');
        const konnichiwa = data.uiPhraseById['ui_konnichiwa'];
        if (konnichiwa) {
          const path = audio.audioFor('ui', konnichiwa);
          await audio.play(path, { fallbackText: 'こんにちは' });
        }
      };
    }

    // Mở ga tàu khi chạm vào ga
    const stationNodes = root.querySelectorAll('.station-node.unlocked');
    stationNodes.forEach(node => {
      node.onclick = () => {
        audio.playSfx('click');
        const lessonId = node.dataset.lessonId;
        navigate(`#/station/${lessonId}`);
      };
    });

    // Mở trò từ thẻ Nhiệm vụ hôm nay
    const missionSteps = root.querySelectorAll('.mission-step-item:not(.step-done)');
    missionSteps.forEach(step => {
      step.onclick = () => {
        audio.playSfx('click');
        const { lessonId, gameId } = step.dataset;
        navigate(`#/play/${lessonId}/${gameId}`);
      };
    });

    // Mở sổ Sticker
    const stickerBtn = root.querySelector('#btn-open-stickers');
    if (stickerBtn) {
      stickerBtn.onclick = () => {
        audio.playSfx('click');
        navigate('#/stickers');
      };
    }

    // Mở vùng phụ huynh qua cổng toán
    const parentBtn = root.querySelector('#btn-open-parent');
    if (parentBtn) {
      parentBtn.onclick = async () => {
        audio.playSfx('click');
        const passed = await UI.askParentMathGate();
        if (passed) {
          navigate('#/parent');
        }
      };
    }
  }
};
