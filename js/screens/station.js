/**
 * js/screens/station.js
 * Trang ga tàu (Lesson Hub): Hiển thị danh sách các trò chơi của bài và số sao đạt được.
 */

export default {
  render({ root, data, audio, progress, navigate, lessonId }) {
    root.innerHTML = '';

    const lesson = data.lessonById[lessonId] || data.lessonsOrdered[0];
    const isStamped = progress.hasStamp(lesson.id);
    const readableWords = data.readableWords(lesson.order);

    const gameNames = {
      meet: { name: 'Gặp chữ mới', emoji: '📇', desc: 'Nghe và nhận diện mặt chữ' },
      listen_pick: { name: 'Nghe & chọn', emoji: '👂', desc: 'Nối âm thanh với chữ' },
      bubble_pop: { name: 'Bóng bay chữ', emoji: '🎈', desc: 'Bấm nổ bóng bay đúng âm' },
      karuta: { name: 'Đấu Karuta', emoji: '🎴', desc: 'Tranh thẻ bài với Bé Mây' },
      word_builder: { name: 'Ghép từ vựng', emoji: '🧩', desc: 'Xếp các chữ cái thành từ' }
    };

    // Lọc các trò chơi khả dụng
    const availableGames = (lesson.games || []).filter(gId => {
      // Trò karuta cần tối thiểu 6 từ đọc được
      if (gId === 'karuta' && readableWords.length < 6) {
        return false;
      }
      return true;
    });

    // Tìm trò tiếp theo chưa chơi hoặc chưa đạt 3 sao
    const nextGameId = availableGames.find(gId => progress.getLessonStars(lesson.id, gId) === 0) || availableGames[0];

    root.innerHTML = `
      <div class="screen-station">
        <!-- Header -->
        <header class="station-header">
          <button class="btn-back-circle" id="btn-back-home" aria-label="Quay lại bản đồ">
            ◀
          </button>
          <div class="station-title-box">
            <span class="station-big-emoji">${lesson.station?.emoji || '🚉'}</span>
            <div class="station-heading-text">
              <h2>Ga ${lesson.station?.name || lesson.id}</h2>
              <p class="station-subtitle">${lesson.title_vi}</p>
            </div>
          </div>
          <div class="station-stamp-badge ${isStamped ? 'stamped' : ''}">
            ${isStamped ? '💮 Đã đóng dấu' : '⭕ Chưa đóng dấu'}
          </div>
        </header>

        <!-- Danh sách chữ của bài (nếu là bài mới) -->
        ${lesson.type === 'new' && lesson.kana ? `
          <div class="station-kana-banner">
            <span class="kana-banner-label">Hành khách lên tàu:</span>
            <div class="kana-banner-list">
              ${lesson.kana.map(kId => {
                const k = data.kanaById[kId];
                return `<span class="kana-chip">${k?.char || kId}</span>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Nút chơi nhanh trò tiếp theo -->
        <div class="station-quick-play">
          <button class="btn-primary btn-play-next" id="btn-quick-play">
            ▶ Chơi tiếp: ${gameNames[nextGameId]?.name || nextGameId}
          </button>
        </div>

        <!-- Danh sách các trò chơi của ga -->
        <main class="station-games-list">
          ${availableGames.map(gId => {
            const meta = gameNames[gId] || { name: gId, emoji: '🎮', desc: '' };
            const stars = progress.getLessonStars(lesson.id, gId);
            return `
              <div class="game-item-card" data-game-id="${gId}">
                <div class="game-item-icon">${meta.emoji}</div>
                <div class="game-item-info">
                  <div class="game-item-title">${meta.name}</div>
                  <div class="game-item-desc">${meta.desc}</div>
                </div>
                <div class="game-item-stars">
                  ${[1, 2, 3].map(i => `
                    <span class="star-icon ${i <= stars ? 'earned' : 'empty'}">⭐</span>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </main>
      </div>
    `;

    // Quay lại bản đồ ga
    root.querySelector('#btn-back-home').onclick = () => {
      audio.playSfx('click');
      navigate('#/home');
    };

    // Nút chơi nhanh
    root.querySelector('#btn-quick-play').onclick = () => {
      audio.playSfx('click');
      navigate(`#/play/${lesson.id}/${nextGameId}`);
    };

    // Chọn trực tiếp trò chơi
    const gameCards = root.querySelectorAll('.game-item-card');
    gameCards.forEach(card => {
      card.onclick = () => {
        audio.playSfx('click');
        const gId = card.dataset.gameId;
        navigate(`#/play/${lesson.id}/${gId}`);
      };
    });
  }
};
