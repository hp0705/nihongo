/**
 * js/core/audio.js
 * Quản lý phát âm thanh tiếng Nhật chuẩn (mp3) và hiệu ứng âm thanh (sfx).
 * Xử lý chính sách chặn âm thanh trên trình duyệt di động (iOS/Android).
 */

export class AudioManager {
  constructor(options = {}) {
    this.audioContext = null;
    this.isUnlocked = false;
    this.currentAudio = null;
    this.warnedFiles = new Set();
    this.missingFiles = new Set();
    this.audioCache = new Map(); // path -> AudioBuffer or Audio
    this.speechFallbackEnabled = options.speechFallbackEnabled ?? false;
    this.sfxEnabled = options.sfxEnabled ?? true;
  }

  /**
   * Mở khoá AudioContext sau tương tác đầu tiên của người dùng
   */
  async unlock() {
    if (this.isUnlocked) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Phát 1 frame im lặng nhỏ để mở khoá iOS Safari
      if (this.audioContext) {
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      }
      this.isUnlocked = true;
    } catch (e) {
      console.warn('Lỗi khi mở khoá AudioContext:', e);
      this.isUnlocked = true; // Vẫn tiếp tục với HTML5 Audio
    }
  }

  /**
   * Tải trước các file âm thanh để sẵn sàng phát không trễ
   */
  async preload(paths = []) {
    if (!Array.isArray(paths)) return;
    for (const p of paths) {
      if (!p || this.audioCache.has(p)) continue;
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = p;
        this.audioCache.set(p, audio);
      } catch {
        // bỏ qua
      }
    }
  }

  /**
   * Lấy đường dẫn âm thanh tương đối từ đối tượng dữ liệu
   */
  audioFor(kind, item, speed = 'normal') {
    if (!item) return null;
    if (kind === 'kana') {
      return item.audio?.normal || `assets/audio/ja/kana/${item.romaji}.mp3`;
    }
    if (kind === 'word') {
      if (speed === 'slow') {
        return item.audio?.slow || `assets/audio/ja/words/${item.romaji}_slow.mp3`;
      }
      return item.audio?.normal || `assets/audio/ja/words/${item.romaji}.mp3`;
    }
    if (kind === 'ui') {
      return item.audio?.normal || `assets/audio/ja/ui/${item.id.replace('ui_', '')}.mp3`;
    }
    return null;
  }

  /**
   * Phát 1 file âm thanh, trả về Promise hoàn thành khi âm thanh dứt.
   * Nếu thiếu file: ghi console.warn một lần, không bao giờ crash hay treo game.
   */
  play(path, options = {}) {
    if (!path) return Promise.resolve();

    return new Promise((resolve) => {
      this.stopCurrentVoice();

      const audio = new Audio();
      this.currentAudio = audio;
      audio.src = path;
      if (options.rate) audio.playbackRate = options.rate;
      if (options.volume !== undefined) audio.volume = options.volume;

      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          if (options.onEnd) options.onEnd();
          resolve();
        }
      };

      audio.onended = done;
      audio.onerror = (e) => {
        if (!this.warnedFiles.has(path)) {
          console.warn(`[AudioManager] Không tìm thấy hoặc không phát được file: ${path}`);
          this.warnedFiles.add(path);
          this.missingFiles.add(path);
        }

        // Nếu bật dự phòng Web Speech và có chuỗi fallbackText
        if (this.speechFallbackEnabled && options.fallbackText && 'speechSynthesis' in window) {
          this.speakWebSpeech(options.fallbackText, options.rate || 1.0).then(done);
        } else {
          done();
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (!this.warnedFiles.has(path)) {
            console.warn(`[AudioManager] Lỗi play() cho ${path}:`, err.message);
            this.warnedFiles.add(path);
          }
          done();
        });
      }
    });
  }

  /**
   * Phát lần lượt danh sách đường dẫn
   */
  async playSequence(paths = []) {
    for (const p of paths) {
      if (p) {
        await this.play(p);
      }
    }
  }

  stopCurrentVoice() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // bỏ qua
      }
      this.currentAudio = null;
    }
  }

  stopAll() {
    this.stopCurrentVoice();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // bỏ qua
      }
    }
  }

  /**
   * Dự phòng bằng giọng Web Speech khi thiếu file và phụ huynh bật cấu hình
   */
  speakWebSpeech(text, rate = 0.9) {
    return new Promise((resolve) => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        u.rate = rate;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Tạo hiệu ứng âm thanh (SFX) sinh động bằng Web Audio API
   * (Đảm bảo luôn có tiếng ding, pop, đúng, vỗ tay ngay cả khi chưa có sfx mp3 ngoài)
   */
  playSfx(type) {
    if (!this.sfxEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (!this.audioContext || this.audioContext.state === 'suspended') return;
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'pop') {
        // Tiếng bóng bay nổ
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'correct') {
        // Tiếng chuông đúng 2 nốt Đô - Sol
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc2.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.45);
      } else if (type === 'wrong') {
        // Âm nhẹ rung không phạt nặng
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.setValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'stamp') {
        // Tiếng đóng con dấu ga
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'fanfare') {
        // Nốt nhạc chúc mừng
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.25);
        });
      }
    } catch {
      // bỏ qua lỗi sinh âm thanh Web Audio
    }
  }

  getMissingFiles() {
    return Array.from(this.missingFiles);
  }

  getPraisePhrase(data) {
    const praiseIds = [
      'ui_mai_jouzu',
      'ui_mai_sugoi',
      'ui_mai_yatta',
      'ui_mai_seikai',
      'ui_mai_kakkoii',
      'ui_mai_sono_choushi'
    ];
    const phraseId = praiseIds[Math.floor(Math.random() * praiseIds.length)];
    return data?.uiPhraseById?.[phraseId] || null;
  }

  getEncouragePhrase(data) {
    const encourageIds = [
      'ui_mai_mouikkai',
      'ui_mai_daijoubu',
      'ui_mai_mouchotto',
      'ui_mai_yukkuri'
    ];
    const phraseId = encourageIds[Math.floor(Math.random() * encourageIds.length)];
    return data?.uiPhraseById?.[phraseId] || null;
  }

  /**
   * Phát lời khen tiếng Nhật ngẫu nhiên (nhắc tên マイちゃん)
   */
  async playPraise(data, onEnd) {
    const phrase = this.getPraisePhrase(data);
    if (phrase) {
      const path = this.audioFor('ui', phrase);
      await this.play(path, { fallbackText: phrase.text, onEnd });
      return phrase;
    }
    return null;
  }

  /**
   * Phát lời động viên tiếng Nhật khi sai (nhẹ nhàng nhắc マイちゃん thử lại)
   */
  async playEncouragement(data, onEnd) {
    const phrase = this.getEncouragePhrase(data);
    if (phrase) {
      const path = this.audioFor('ui', phrase);
      await this.play(path, { fallbackText: phrase.text, onEnd });
      return phrase;
    }
    return null;
  }
}
