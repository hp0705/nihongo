/**
 * js/screens/stickers.js
 * Sổ sưu tầm Sticker (20 hình chủ đề Nhật Bản: Onigiri, Sushi, Núi Phú Sĩ, Tàu Shinkansen...).
 */

export default {
  render({ root, data, audio, progress, navigate }) {
    root.innerHTML = '';

    const allStickers = data.config.stickers || [];
    const unlockedStickers = new Set(progress.getStickers());

    root.innerHTML = `
      <div class="screen-stickers">
        <header class="stickers-header">
          <button class="btn-back-circle" id="btn-back-home" aria-label="Quay lại">◀</button>
          <div class="stickers-title-box">
            <h2>📖 Sổ Sticker Của Bé</h2>
            <p class="stickers-counter">Đã sưu tầm: ${unlockedStickers.size} / ${allStickers.length}</p>
          </div>
          <div class="header-blank"></div>
        </header>

        <main class="stickers-grid-container">
          <div class="stickers-grid">
            ${allStickers.map((emoji, index) => {
              const isUnlocked = unlockedStickers.has(emoji);
              return `
                <div class="sticker-slot ${isUnlocked ? 'unlocked' : 'locked'}">
                  ${isUnlocked ? `
                    <span class="sticker-emoji">${emoji}</span>
                  ` : `
                    <span class="sticker-silhouette">🔒</span>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </main>
      </div>
    `;

    root.querySelector('#btn-back-home').onclick = () => {
      audio.playSfx('click');
      navigate('#/home');
    };
  }
};
