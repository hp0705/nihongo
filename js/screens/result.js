/**
 * js/screens/result.js
 * Màn hình kết quả trò chơi: Hiệu ứng sao bay, hộp quà sticker và đóng con dấu ga.
 */

import { UI } from '../core/ui.js';

export default {
  render({ root, data, audio, progress, navigate, result, lessonId, gameId }) {
    root.innerHTML = '';

    const stars = result?.stars || 1;
    const lesson = data.lessonById[lessonId] || data.lessonsOrdered[0];

    // Ghi nhận sao và kết quả trò chơi
    progress.addStars(stars);
    progress.recordGameResult(lessonId, gameId, stars);
    progress.markMissionGameDone(lessonId, gameId);

    // Kiểm tra xem đã hoàn thành toàn bộ trò chơi của ga để đóng dấu chưa
    const availableGames = (lesson.games || []).filter(g => {
      if (g === 'karuta' && data.readableWords(lesson.order).length < 6) return false;
      return true;
    });

    const isAllGamesPlayed = availableGames.every(g => progress.getLessonStars(lesson.id, g) > 0);
    const wasAlreadyStamped = progress.hasStamp(lesson.id);
    let newlyStamped = false;
    if (isAllGamesPlayed && !wasAlreadyStamped) {
      progress.setStamp(lesson.id);
      newlyStamped = true;
    }

    // Kiểm tra xem có nhận được sticker từ nhiệm vụ hôm nay không
    const mission = progress.getTodayMission(data.lessonsOrdered);
    let newlyUnlockedSticker = null;
    if (mission.completed && !mission.claimed_sticker) {
      // Chọn 1 sticker chưa có
      const currentStickers = progress.getStickers();
      const allStickers = data.config.stickers || [];
      const unowned = allStickers.filter(s => !currentStickers.includes(s));
      if (unowned.length > 0) {
        newlyUnlockedSticker = unowned[Math.floor(Math.random() * unowned.length)];
        progress.unlockSticker(newlyUnlockedSticker);
      }
      mission.claimed_sticker = true;
      progress.save();
    }

    // Chọn lời khen tiếng Nhật ngẫu nhiên (ưu tiên khen マイちゃん)
    const praisePhrases = [
      'ui_mai_jouzu',
      'ui_mai_sugoi',
      'ui_mai_yatta',
      'ui_mai_kakkoii',
      'ui_mai_sono_choushi',
      'ui_yoku_dekimashita'
    ];
    const randomPraiseId = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
    const praiseItem = data.uiPhraseById[randomPraiseId];

    root.innerHTML = `
      <div class="screen-result">
        <div class="result-card">
          <div class="result-mascot">
            ${UI.renderMascot('celebrate', '110px')}
          </div>

          <div class="result-praise-box">
            <h2 class="praise-ja">${praiseItem?.text || 'すごい!'}</h2>
            <p class="praise-vi">${praiseItem?.vi || 'Bé làm tốt lắm!'}</p>
          </div>

          <!-- Hiển thị các ngôi sao đạt được -->
          <div class="result-stars-row">
            ${[1, 2, 3].map(i => `
              <div class="star-burst ${i <= stars ? 'active' : ''}" style="animation-delay: ${i * 0.25}s">
                <span class="star-big">⭐</span>
              </div>
            `).join('')}
          </div>

          <!-- Thông báo phần thưởng con dấu ga mới -->
          ${newlyStamped ? `
            <div class="reward-banner stamp-banner">
              <span class="stamp-giant">💮</span>
              <div class="reward-text">
                <div class="reward-title">Đã nhận Con Dấu Ga ${lesson.station?.name || lesson.id}!</div>
                <div class="reward-desc">Chúc mừng bé đã chinh phục trọn vẹn ga này!</div>
              </div>
            </div>
          ` : ''}

          <!-- Thông báo mở khoá sticker từ nhiệm vụ hôm nay -->
          ${newlyUnlockedSticker ? `
            <div class="reward-banner sticker-banner">
              <span class="gift-box-anim">🎁 ➔ ${newlyUnlockedSticker}</span>
              <div class="reward-text">
                <div class="reward-title">Quà nhiệm vụ hôm nay!</div>
                <div class="reward-desc">Bé được tặng thêm 1 sticker mới vào sổ!</div>
              </div>
            </div>
          ` : ''}

          <!-- Các nút hành động -->
          <div class="result-actions">
            <button class="btn-primary btn-action-large" id="btn-result-continue">
              ▶ Chơi tiếp
            </button>
            <button class="btn-secondary btn-action-large" id="btn-result-home">
              🏠 Về bản đồ ga
            </button>
          </div>
        </div>
      </div>
    `;

    // Hiệu ứng pháo hoa & âm thanh khen ngợi
    setTimeout(() => {
      audio.playSfx('fanfare');
      UI.triggerConfetti();
      if (praiseItem) {
        const audioPath = audio.audioFor('ui', praiseItem);
        audio.play(audioPath, { fallbackText: praiseItem.text });
      }
      if (newlyStamped) {
        setTimeout(() => audio.playSfx('stamp'), 800);
      }
    }, 200);

    // Chơi tiếp
    root.querySelector('#btn-result-continue').onclick = () => {
      audio.playSfx('click');
      navigate(`#/station/${lesson.id}`);
    };

    // Về trang chủ
    root.querySelector('#btn-result-home').onclick = () => {
      audio.playSfx('click');
      navigate('#/home');
    };
  }
};
