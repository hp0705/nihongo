/**
 * js/main.js
 * Điểm khởi chạy chính của Nihongo Adventure.
 * Quản lý khởi động, nạp dữ liệu, router hash, phiên âm thanh và giới hạn thời gian.
 */

import { loadAll } from './core/data.js';
import { AudioManager } from './core/audio.js';
import { ProgressManager } from './core/progress.js';
import * as srs from './core/srs.js';
import { defaultRng } from './core/rng.js';
import { UI } from './core/ui.js';

// Screens
import homeScreen from './screens/home.js';
import stationScreen from './screens/station.js';
import resultScreen from './screens/result.js';
import stickersScreen from './screens/stickers.js';
import parentScreen from './screens/parent.js';

// Games
import meetGame from './games/meet.js';
import listenPickGame from './games/listen_pick.js';
import bubblePopGame from './games/bubble_pop.js';
import karutaGame from './games/karuta.js';
import wordBuilderGame from './games/word_builder.js';

const gamesMap = {
  meet: meetGame,
  listen_pick: listenPickGame,
  bubble_pop: bubblePopGame,
  karuta: karutaGame,
  word_builder: wordBuilderGame
};

class App {
  constructor() {
    this.root = document.getElementById('app');
    this.data = null;
    this.audio = new AudioManager();
    this.progress = new ProgressManager();
    this.rng = defaultRng;

    this.currentRoute = '';
    this.lastResult = null;
    this.sessionStartTime = Date.now();
    this.hasUnlockedAudio = false;

    // Giới hạn thời gian chơi
    this.timeWarningShown = false;
  }

  async init() {
    this.showLoading();

    try {
      // Nạp toàn bộ dữ liệu từ các file JSON trong ./data/
      this.data = await loadAll('./data');

      // Đồng bộ thiết lập âm thanh
      const settings = this.progress.getSettings();
      this.audio.speechFallbackEnabled = !!settings.speech_fallback;

      // Khởi động router
      window.addEventListener('hashchange', () => this.handleRoute());

      // Khởi động bộ đếm giới hạn thời gian mỗi ngày
      this.startTimerCheck();

      // Nếu chưa có hash hoặc hash là rỗng -> vào màn khởi động
      if (!window.location.hash || window.location.hash === '#/') {
        this.navigate('#/start');
      } else {
        this.handleRoute();
      }

      // Đăng ký Service Worker cho PWA (khi chạy https hoặc localhost)
      this.registerServiceWorker();

    } catch (err) {
      console.error('Lỗi nạp dữ liệu:', err);
      this.showErrorScreen(err);
    }
  }

  showLoading() {
    this.root.innerHTML = `
      <div class="screen-loading">
        <div class="loading-spinner"></div>
        <div class="loading-mascot">${UI.renderMascot('normal', '80px')}</div>
        <p class="loading-text">Chuyến tàu Shinkansen đang khởi hành...</p>
      </div>
    `;
  }

  showErrorScreen(err) {
    this.root.innerHTML = `
      <div class="screen-error">
        <div class="error-mascot">${UI.renderMascot('yawn', '90px')}</div>
        <div class="error-card">
          <h2>⚠️ Ôi, chưa tải được dữ liệu!</h2>
          <p class="error-desc">
            Không thể nạp dữ liệu học tiếng Nhật từ thư mục <code>./data/</code>.
          </p>
          <div class="error-details">
            Chi tiết: <code>${err?.message || err}</code>
          </div>
          <p class="error-advice">
            Ba mẹ hãy kiểm tra lại kết nối mạng hoặc thử tải lại trang nhé.
          </p>
          <button class="btn-primary" onclick="window.location.reload()">
            🔄 Tải lại trang
          </button>
        </div>
      </div>
    `;
  }

  renderStartScreen() {
    this.root.innerHTML = `
      <div class="screen-start">
        <div class="start-content">
          <div class="start-mascot-row">
            ${UI.renderMascot('celebrate', '130px')}
          </div>
          <h1 class="start-title">
            <span class="train-badge">🚅</span> Nihongo Adventure
          </h1>
          <p class="start-subtitle">Chuyến tàu Shinkansen của Bé Mây</p>

          <button class="btn-start-huge glow" id="btn-start-game" aria-label="Bắt đầu học">
            <span class="start-btn-ja">はじめよう!</span>
            <span class="start-btn-vi">Bắt đầu nào!</span>
          </button>

          <p class="start-hint">Chạm vào nút để bật âm thanh tiếng Nhật chuẩn nhé!</p>
        </div>
      </div>
    `;

    const startBtn = this.root.querySelector('#btn-start-game');
    let starting = false;
    startBtn.onclick = async () => {
      if (starting) return;
      starting = true;
      startBtn.classList.add('pulse');
      startBtn.style.pointerEvents = 'none';

      // Mở khoá âm thanh AudioContext
      await this.audio.unlock();
      this.hasUnlockedAudio = true;
      this.audio.playSfx('fanfare');

      // Phát lời chào "はじめよう!" và CHỜ phát hết 100% âm thanh
      const hajimeyou = this.data.uiPhraseById['ui_hajimeyou'];
      if (hajimeyou) {
        const path = this.audio.audioFor('ui', hajimeyou);
        await this.audio.play(path, { fallbackText: 'はじめよう' });
      }

      // Nghỉ nhẹ 300ms sau khi âm thanh dứt rồi mới chuyển sang màn hình chính
      setTimeout(() => {
        this.navigate('#/home');
      }, 300);
    };
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  async handleRoute() {
    const rawHash = window.location.hash || '#/start';
    this.currentRoute = rawHash;

    const parts = rawHash.replace(/^#\/?/, '').split('/');
    const route = parts[0] || 'start';

    // Dừng mọi âm thanh cũ khi chuyển màn hình
    this.audio.stopAll();

    if (route === 'start') {
      this.renderStartScreen();
    } else if (route === 'home') {
      homeScreen.render({
        root: this.root,
        data: this.data,
        audio: this.audio,
        progress: this.progress,
        navigate: (h) => this.navigate(h)
      });
    } else if (route === 'station') {
      const lessonId = parts[1] || 'L1';
      stationScreen.render({
        root: this.root,
        data: this.data,
        audio: this.audio,
        progress: this.progress,
        navigate: (h) => this.navigate(h),
        lessonId
      });
    } else if (route === 'play') {
      const lessonId = parts[1] || 'L1';
      const gameId = parts[2] || 'meet';
      await this.runGame(lessonId, gameId);
    } else if (route === 'result') {
      const lessonId = parts[1] || 'L1';
      const gameId = parts[2] || 'meet';
      resultScreen.render({
        root: this.root,
        data: this.data,
        audio: this.audio,
        progress: this.progress,
        navigate: (h) => this.navigate(h),
        result: this.lastResult,
        lessonId,
        gameId
      });
    } else if (route === 'stickers') {
      stickersScreen.render({
        root: this.root,
        data: this.data,
        audio: this.audio,
        progress: this.progress,
        navigate: (h) => this.navigate(h)
      });
    } else if (route === 'parent') {
      parentScreen.render({
        root: this.root,
        data: this.data,
        audio: this.audio,
        progress: this.progress,
        navigate: (h) => this.navigate(h)
      });
    } else {
      this.navigate('#/home');
    }
  }

  async runGame(lessonId, gameId) {
    const lesson = this.data.lessonById[lessonId];
    const gameModule = gamesMap[gameId];

    if (!lesson || !gameModule) {
      console.warn('Không tìm thấy bài hoặc trò:', lessonId, gameId);
      this.navigate('#/home');
      return;
    }

    const settings = this.progress.getSettings();
    const ctx = {
      data: this.data,
      audio: this.audio,
      progress: this.progress,
      srs,
      rng: this.rng,
      root: this.root,
      lesson,
      level: 1,
      settings,
      onExit: () => {
        this.navigate(`#/station/${lesson.id}`);
      }
    };

    try {
      const result = await gameModule.start(ctx);
      if (result) {
        this.lastResult = result;
        this.navigate(`#/result/${lessonId}/${gameId}`);
      }
    } catch (err) {
      console.error('Lỗi trong khi chơi game:', err);
      this.navigate(`#/station/${lesson.id}`);
    }
  }

  startTimerCheck() {
    setInterval(async () => {
      const settings = this.progress.getSettings();
      const limitMin = settings.daily_limit_min || 0;
      if (limitMin <= 0 || this.timeWarningShown) return;

      const elapsedMin = (Date.now() - this.sessionStartTime) / (1000 * 60);
      if (elapsedMin >= limitMin) {
        this.timeWarningShown = true;
        this.showRestDialog();
      }
    }, 15000);
  }

  showRestDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-body" style="text-align: center;">
          <div style="margin-bottom: 12px;">
            ${UI.renderMascot('yawn', '100px')}
          </div>
          <h3 style="font-size: 1.5rem; color: #1e293b; margin-bottom: 8px;">Oáp~ Bé Mây buồn ngủ rồi!</h3>
          <p style="font-size: 1.1rem; color: #475569; margin-bottom: 18px;">
            Bé đã học chăm chỉ <strong>${this.progress.getSettings().daily_limit_min} phút</strong> rồi. Mình cùng nghỉ ngơi uống nước nhé!
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-primary" id="btn-rest-confirm" style="font-size: 1.1rem; padding: 12px 24px;">
              Dạ, nghỉ thôi!
            </button>
            <button class="btn-secondary" id="btn-rest-more" style="font-size: 1rem; padding: 12px 20px;">
              Ba mẹ cho chơi thêm
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-rest-confirm').onclick = () => {
      modal.remove();
      this.navigate('#/home');
    };

    modal.querySelector('#btn-rest-more').onclick = async () => {
      modal.remove();
      const passed = await UI.askParentMathGate();
      if (passed) {
        this.timeWarningShown = false;
        this.sessionStartTime = Date.now(); // Gia hạn thêm 1 phiên
      }
    };
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Không thể đăng ký service worker:', err);
      });
    }
  }
}

// Khởi chạy app khi trang tải xong
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
