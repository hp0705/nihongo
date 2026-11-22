/**
 * js/core/progress.js
 * Quản lý lưu trữ tiến độ học, huy hiệu sticker, con dấu ga và cài đặt của bé.
 * Khóa lưu trữ: "nihongo_adventure_progress_v1"
 */

import { applyAnswer, getTodayString } from './srs.js';

const STORAGE_KEY = 'nihongo_adventure_progress_v1';
const CURRENT_SCHEMA = 1;

function createDefaultState(contentVersion = '0.1.0') {
  const today = getTodayString();
  return {
    schema: CURRENT_SCHEMA,
    content_version: contentVersion,
    profile: {
      name: 'Bé Mây',
      avatar: '🐥'
    },
    stats: {
      stars: 0,
      sessions: 0,
      streak: 1,
      last_play: today
    },
    kana: {},
    words: {},
    lessons: {
      L1: { best_stars: {}, stamp: false }
    },
    stickers: [],
    today_mission: null,
    settings: {
      romaji: true,
      vi_hint: true,
      audio_speed: 'normal',
      daily_limit_min: 20,
      music: true,
      speech_fallback: false
    }
  };
}

class StorageWrapper {
  constructor() {
    this.memoryStore = {};
    this.isLocalStorageAvailable = this.checkLocalStorage();
  }

  checkLocalStorage() {
    try {
      const testKey = '__nihongo_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key) {
    if (this.isLocalStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryStore[key] ?? null;
  }

  setItem(key, val) {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, val);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memoryStore[key] = String(val);
  }

  removeItem(key) {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
        return;
      } catch {
        // Fallback
      }
    }
    delete this.memoryStore[key];
  }
}

export class ProgressManager {
  constructor(options = {}) {
    this.storage = options.storage || new StorageWrapper();
    this.state = null;
    this.init();
  }

  init() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = this.migrate(parsed);
      } else {
        this.state = createDefaultState();
        this.save();
      }
    } catch (e) {
      console.warn('Lỗi đọc tiến độ, khởi tạo lại tiến độ mặc định:', e);
      this.state = createDefaultState();
      this.save();
    }
  }

  migrate(data) {
    if (!data || typeof data !== 'object') {
      return createDefaultState();
    }
    // Đảm bảo có đủ các cấu trúc cần thiết
    const def = createDefaultState();
    return {
      schema: CURRENT_SCHEMA,
      content_version: data.content_version || def.content_version,
      profile: { ...def.profile, ...(data.profile || {}) },
      stats: { ...def.stats, ...(data.stats || {}) },
      kana: data.kana || {},
      words: data.words || {},
      lessons: data.lessons || {},
      stickers: Array.isArray(data.stickers) ? data.stickers : [],
      today_mission: data.today_mission || null,
      settings: { ...def.settings, ...(data.settings || {}) }
    };
  }

  save() {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Không thể lưu tiến độ vào storage:', e);
    }
  }

  getKana(id) {
    return this.state.kana[id] || { box: 0, streak: 0, correct: 0, wrong: 0, due: getTodayString() };
  }

  getWord(id) {
    return this.state.words[id] || { box: 0, streak: 0, correct: 0, wrong: 0, due: getTodayString() };
  }

  recordAnswer(kind, id, isCorrect, masteryConfig) {
    const today = getTodayString();
    if (kind === 'kana') {
      const current = this.getKana(id);
      this.state.kana[id] = applyAnswer(current, isCorrect, today, masteryConfig);
    } else if (kind === 'word') {
      const current = this.getWord(id);
      this.state.words[id] = applyAnswer(current, isCorrect, today, masteryConfig);
    }
    this.save();
  }

  addStars(n) {
    const delta = Math.max(0, Math.floor(n));
    this.state.stats.stars = (this.state.stats.stars || 0) + delta;
    this.save();
    return this.state.stats.stars;
  }

  getStars() {
    return this.state.stats.stars || 0;
  }

  recordGameResult(lessonId, gameId, stars) {
    if (!this.state.lessons[lessonId]) {
      this.state.lessons[lessonId] = { best_stars: {}, stamp: false };
    }
    const currentBest = this.state.lessons[lessonId].best_stars[gameId] || 0;
    if (stars > currentBest) {
      this.state.lessons[lessonId].best_stars[gameId] = stars;
    }
    this.state.stats.sessions = (this.state.stats.sessions || 0) + 1;
    this.save();
  }

  getLessonStars(lessonId, gameId) {
    return this.state.lessons[lessonId]?.best_stars?.[gameId] || 0;
  }

  setStamp(lessonId) {
    if (!this.state.lessons[lessonId]) {
      this.state.lessons[lessonId] = { best_stars: {}, stamp: true };
    } else {
      this.state.lessons[lessonId].stamp = true;
    }
    this.save();
    return true;
  }

  hasStamp(lessonId) {
    return !!this.state.lessons[lessonId]?.stamp;
  }

  unlockSticker(emoji) {
    if (!emoji) return false;
    if (!this.state.stickers.includes(emoji)) {
      this.state.stickers.push(emoji);
      this.save();
      return true; // Mới mở khóa
    }
    return false; // Đã có rồi
  }

  getStickers() {
    return [...this.state.stickers];
  }

  touchDay() {
    const today = getTodayString();
    const lastPlay = this.state.stats.last_play;

    if (!lastPlay) {
      this.state.stats.streak = 1;
      this.state.stats.last_play = today;
      this.save();
      return this.state.stats.streak;
    }

    if (lastPlay === today) {
      return this.state.stats.streak;
    }

    const [y1, m1, d1] = lastPlay.split('-').map(Number);
    const [y2, m2, d2] = today.split('-').map(Number);
    const diffDays = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.state.stats.streak = (this.state.stats.streak || 0) + 1;
    } else if (diffDays > 1) {
      // Bỏ ngày thì quay về 1, không hiện thông báo buồn
      this.state.stats.streak = 1;
    }

    this.state.stats.last_play = today;
    this.save();
    return this.state.stats.streak;
  }

  getTodayMission(lessonsOrdered, forceNew = false) {
    const today = getTodayString();
    if (!forceNew && this.state.today_mission && this.state.today_mission.date === today) {
      return this.state.today_mission;
    }

    // Sinh 3 trò cho ngày hôm nay từ các ga đã mở
    const unlockedLessons = lessonsOrdered.filter(l => this.isStationUnlocked(l.id, lessonsOrdered));
    const latestLesson = unlockedLessons[unlockedLessons.length - 1] || lessonsOrdered[0];
    const reviewLesson = unlockedLessons.length > 1 ? unlockedLessons[0] : latestLesson;

    const missionGames = [];

    // Trò 1: trò từ bài mới nhất (ưu tiên meet nếu có, hoặc trò đầu)
    const g1 = latestLesson.games.includes('meet') ? 'meet' : latestLesson.games[0];
    missionGames.push({ lessonId: latestLesson.id, gameId: g1, done: false });

    // Trò 2: trò thứ 2 từ bài mới nhất (hoặc bubble_pop)
    const g2 = latestLesson.games.find(g => g !== g1) || latestLesson.games[0];
    missionGames.push({ lessonId: latestLesson.id, gameId: g2, done: false });

    // Trò 3: trò từ bài ôn hoặc trò khác
    const g3 = reviewLesson.games.find(g => g !== g1 && g !== g2) || reviewLesson.games[reviewLesson.games.length - 1] || 'listen_pick';
    missionGames.push({ lessonId: reviewLesson.id, gameId: g3, done: false });

    const newMission = {
      date: today,
      games: missionGames,
      completed: false,
      claimed_sticker: false
    };

    this.state.today_mission = newMission;
    this.save();
    return newMission;
  }

  markMissionGameDone(lessonId, gameId) {
    if (!this.state.today_mission) return;
    const item = this.state.today_mission.games.find(g => g.lessonId === lessonId && g.gameId === gameId && !g.done);
    if (item) {
      item.done = true;
    }
    const allDone = this.state.today_mission.games.every(g => g.done);
    if (allDone) {
      this.state.today_mission.completed = true;
    }
    this.save();
  }

  isStationUnlocked(lessonId, lessonsOrdered) {
    if (!lessonsOrdered || lessonsOrdered.length === 0) return true;
    const targetIdx = lessonsOrdered.findIndex(l => l.id === lessonId);
    if (targetIdx <= 0) return true; // Ga đầu tiên (L1) luôn luôn mở

    const target = lessonsOrdered[targetIdx];

    if (target.type === 'review' && Array.isArray(target.review_of)) {
      // Mở khi các bài được ôn đã được mở/có dấu
      return target.review_of.every(revId => {
        const revIdx = lessonsOrdered.findIndex(l => l.id === revId);
        return revIdx < targetIdx && (this.hasStamp(revId) || this.isStationUnlocked(revId, lessonsOrdered));
      });
    }

    // Bài new: mở khi ga trước nó đã đóng dấu HOẶC đã chơi ít nhất 1 trò đạt sao
    const prevLesson = lessonsOrdered[targetIdx - 1];
    if (this.hasStamp(prevLesson.id)) return true;

    const prevStars = this.state.lessons[prevLesson.id]?.best_stars || {};
    return Object.values(prevStars).some(stars => stars > 0);
  }

  getAnimalLevel(levelsConfig = []) {
    const stars = this.getStars();
    if (!levelsConfig || levelsConfig.length === 0) {
      return { currentLevel: { name_ja: 'ひよこ', name_vi: 'Gà con', emoji: '🐥', stars_needed: 0 }, nextLevel: null, currentStars: stars, starsForNext: 0, progressRatio: 1 };
    }

    let currentIdx = 0;
    for (let i = 0; i < levelsConfig.length; i++) {
      if (stars >= levelsConfig[i].stars_needed) {
        currentIdx = i;
      } else {
        break;
      }
    }

    const currentLevel = levelsConfig[currentIdx];
    const nextLevel = levelsConfig[currentIdx + 1] || null;

    let progressRatio = 1;
    let starsForNext = 0;
    if (nextLevel) {
      const range = nextLevel.stars_needed - currentLevel.stars_needed;
      const currentInRange = stars - currentLevel.stars_needed;
      progressRatio = Math.min(1, Math.max(0, currentInRange / range));
      starsForNext = nextLevel.stars_needed - stars;
    }

    return {
      currentLevel,
      nextLevel,
      currentStars: stars,
      starsForNext,
      progressRatio
    };
  }

  getSettings() {
    return { ...this.state.settings };
  }

  setSetting(key, val) {
    this.state.settings[key] = val;
    this.save();
  }

  export() {
    return JSON.stringify(this.state, null, 2);
  }

  import(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Dữ liệu không phải là đối tượng JSON hợp lệ');
      }
      this.state = this.migrate(parsed);
      this.save();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  reset() {
    this.state = createDefaultState();
    this.save();
  }
}
