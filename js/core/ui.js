/**
 * js/core/ui.js
 * Các thành phần giao diện dùng chung: Bé Mây mascot, thanh trạng thái, cổng phụ huynh (câu đố toán), hiệu ứng sao.
 */

export const UI = {
  /**
   * Tạo SVG linh vật Bé Mây (đám mây dễ thương, má hồng, vẫy tay)
   * @param {'normal'|'happy'|'yawn'|'celebrate'} mood
   * @param {string} size
   */
  renderMascot(mood = 'normal', size = '100px') {
    let eyes = `
      <circle cx="65" cy="75" r="5" fill="#2d3748" />
      <circle cx="115" cy="75" r="5" fill="#2d3748" />
      <circle cx="67" cy="73" r="2" fill="#ffffff" />
      <circle cx="117" cy="73" r="2" fill="#ffffff" />
    `;

    let mouth = `<path d="M 80 82 Q 90 92 100 82" stroke="#2d3748" stroke-width="4" fill="none" stroke-linecap="round" />`;

    if (mood === 'happy' || mood === 'celebrate') {
      eyes = `
        <path d="M 58 78 Q 65 68 72 78" stroke="#2d3748" stroke-width="4" fill="none" stroke-linecap="round" />
        <path d="M 108 78 Q 115 68 122 78" stroke="#2d3748" stroke-width="4" fill="none" stroke-linecap="round" />
      `;
      mouth = `<path d="M 78 82 Q 90 98 102 82 Z" fill="#f56565" stroke="#2d3748" stroke-width="3" />`;
    } else if (mood === 'yawn') {
      eyes = `
        <path d="M 58 74 L 72 74" stroke="#2d3748" stroke-width="4" stroke-linecap="round" />
        <path d="M 108 74 L 122 74" stroke="#2d3748" stroke-width="4" stroke-linecap="round" />
      `;
      mouth = `<ellipse cx="90" cy="85" rx="10" ry="14" fill="#2d3748" />`;
    }

    const handAnim = mood === 'celebrate' ? 'class="mascot-hand waving"' : 'class="mascot-hand"';

    return `
      <div class="mascot-container mascot-${mood}" style="width: ${size}; height: ${size}; display: inline-block;">
        <svg viewBox="0 0 180 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#e0f2fe" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0284c7" flood-opacity="0.15" />
            </filter>
          </defs>
          <!-- Thân đám mây -->
          <g filter="url(#softShadow)">
            <path d="M 50 100 
                     A 28 28 0 0 1 35 55 
                     A 32 32 0 0 1 75 35 
                     A 40 40 0 0 1 125 35 
                     A 30 30 0 0 1 155 65 
                     A 26 26 0 0 1 140 100 
                     Z" 
                  fill="url(#cloudGrad)" stroke="#38bdf8" stroke-width="3.5" stroke-linejoin="round" />
          </g>
          <!-- Má hồng -->
          <ellipse cx="50" cy="84" rx="9" ry="6" fill="#fbcfe8" opacity="0.8" />
          <ellipse cx="130" cy="84" rx="9" ry="6" fill="#fbcfe8" opacity="0.8" />
          <!-- Mắt & Miệng -->
          ${eyes}
          ${mouth}
          <!-- Tay vẫy -->
          <g ${handAnim}>
            <ellipse cx="28" cy="80" rx="9" ry="6" fill="#ffffff" stroke="#38bdf8" stroke-width="3" transform="rotate(-20 28 80)" />
          </g>
          <ellipse cx="152" cy="80" rx="9" ry="6" fill="#ffffff" stroke="#38bdf8" stroke-width="3" transform="rotate(20 152 80)" />
        </svg>
      </div>
    `;
  },

  /**
   * Cổng bảo vệ phụ huynh bằng câu hỏi toán cộng hai số 1 chữ số > 5
   * @returns {Promise<boolean>}
   */
  askParentMathGate() {
    return new Promise((resolve) => {
      const a = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9
      const b = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9
      const expected = a + b;

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-card">
          <div class="modal-header">
            <h3>🔒 Dành cho Ba Mẹ</h3>
            <button class="btn-close" id="btn-gate-close" aria-label="Đóng">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 12px; font-size: 1.1rem;">Xin vui lòng trả lời phép tính để mở vùng phụ huynh:</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 16px 0; color: var(--color-primary-dark);">
              ${a} + ${b} = ?
            </div>
            <input type="number" id="gate-answer" inputmode="numeric" placeholder="Nhập kết quả" 
                   style="font-size: 1.5rem; text-align: center; width: 160px; padding: 10px; border: 3px solid #cbd5e1; border-radius: 12px; margin-bottom: 16px;" autofocus />
            <div id="gate-error" style="color: #e53e3e; font-weight: bold; min-height: 24px; margin-bottom: 12px;"></div>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button class="btn-secondary" id="btn-gate-cancel">Huỷ bỏ</button>
              <button class="btn-primary" id="btn-gate-submit">Mở khoá</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector('#gate-answer');
      const err = modal.querySelector('#gate-error');

      function close(result) {
        modal.remove();
        resolve(result);
      }

      function submit() {
        const val = parseInt(input.value, 10);
        if (val === expected) {
          close(true);
        } else {
          err.textContent = 'Kết quả chưa đúng, vui lòng thử lại nhé!';
          input.value = '';
          input.focus();
        }
      }

      modal.querySelector('#btn-gate-close').onclick = () => close(false);
      modal.querySelector('#btn-gate-cancel').onclick = () => close(false);
      modal.querySelector('#btn-gate-submit').onclick = submit;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
      });
      input.focus();
    });
  },

  /**
   * Tạo hiệu ứng pháo hoa sao bay
   */
  triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'];
    const emojis = ['⭐', '✨', '🌸', '🎉', '🌟'];

    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 0.5}s`;
      p.style.fontSize = `${Math.random() * 16 + 20}px`;
      container.appendChild(p);
    }

    setTimeout(() => {
      container.remove();
    }, 2500);
  },

  /**
   * Hiển thị bong bóng lời khen / động viên từ Bé Mây
   */
  showCheerBubble(text, vi, mood = 'celebrate') {
    const existing = document.querySelector('.cheer-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `cheer-toast cheer-${mood}`;
    toast.innerHTML = `
      <div class="cheer-mascot">${this.renderMascot(mood, '52px')}</div>
      <div class="cheer-content">
        <div class="cheer-ja">${text}</div>
        <div class="cheer-vi">${vi}</div>
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('cheer-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('cheer-show');
      setTimeout(() => toast.remove(), 400);
    }, 1800);
  }
};
