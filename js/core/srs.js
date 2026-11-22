/**
 * js/core/srs.js
 * Thuật toán lặp lại ngắt quãng (SRS) nhẹ nhàng cho bé & thuật toán chọn câu hỏi thông minh.
 * Hàm thuần (pure functions), không phụ thuộc DOM để dễ viết test.
 */

import { defaultRng } from './rng.js';

/**
 * Tính ngày mới cộng thêm n ngày từ chuỗi 'YYYY-MM-DD'
 */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Lấy chuỗi ngày hôm nay theo giờ địa phương (YYYY-MM-DD)
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cập nhật tiến độ của một mục sau khi bé trả lời đúng/sai
 * @param {object} entry Tiến độ hiện tại { box, streak, correct, wrong, due }
 * @param {boolean} isCorrect Đúng hay sai
 * @param {string} today Chuỗi ngày hôm nay (YYYY-MM-DD)
 * @param {object} masteryConfig Cấu hình mastery trong game_config.json
 */
export function applyAnswer(entry, isCorrect, today = getTodayString(), masteryConfig = { boxes_days: [0, 1, 3, 7], demote_on_wrong: 1 }) {
  const currentBox = entry?.box ?? 0;
  const currentStreak = entry?.streak ?? 0;
  const totalCorrect = (entry?.correct ?? 0) + (isCorrect ? 1 : 0);
  const totalWrong = (entry?.wrong ?? 0) + (isCorrect ? 0 : 1);

  let newBox = currentBox;
  let newStreak = currentStreak;

  if (isCorrect) {
    newStreak += 1;
    // Đúng 2 lần liên tiếp thì lên hộp (tối đa hộp 3)
    if (newStreak >= 2) {
      newBox = Math.min(3, currentBox + 1);
      newStreak = 0;
    }
  } else {
    // Sai thì hạ 1 hộp (tối thiểu hộp 0)
    const demote = masteryConfig.demote_on_wrong ?? 1;
    newBox = Math.max(0, currentBox - demote);
    newStreak = 0;
  }

  const boxesDays = masteryConfig.boxes_days || [0, 1, 3, 7];
  const daysToAdd = boxesDays[newBox] ?? 0;
  const newDue = addDays(today, daysToAdd);

  return {
    box: newBox,
    streak: newStreak,
    correct: totalCorrect,
    wrong: totalWrong,
    due: newDue,
    last_reviewed: today
  };
}

/**
 * Chọn n mục câu hỏi từ pool, ưu tiên hộp thấp, quá hạn và vừa sai
 * @param {string[]} poolIds Danh sách ID trong kho (pool)
 * @param {object} entries Bảng tra cứu ID -> entry tiến độ
 * @param {number} n Số lượng câu hỏi cần chọn
 * @param {object} opts Tuỳ chọn: { mustInclude, maxOldRatio, today, rng }
 */
export function pickItems(poolIds, entries = {}, n = 8, opts = {}) {
  if (!poolIds || poolIds.length === 0) return [];
  const rng = opts.rng || defaultRng;
  const today = opts.today || getTodayString();
  const mustInclude = opts.mustInclude ? [...opts.mustInclude] : [];
  const maxOldRatio = opts.maxOldRatio ?? 0.4;

  // Tính điểm ưu tiên (trọng số) cho từng mục
  function getWeight(id) {
    const e = entries[id];
    if (!e) return 10; // Chưa từng học: ưu tiên cao

    let w = 1;
    // Hộp 0: x8, Hộp 1: x5, Hộp 2: x2, Hộp 3: x1
    w += (3 - (e.box ?? 0)) * 2.5;

    // Quá hạn ôn tập: tăng trọng số
    if (e.due && e.due <= today) {
      w += 4;
    }

    // Tỉ lệ sai cao: tăng trọng số
    if (e.wrong > 0 && e.wrong >= (e.correct || 0)) {
      w += 3;
    }
    return Math.max(1, w);
  }

  // Tách mục mới (trong mustInclude) và mục cũ
  const mustSet = new Set(mustInclude);
  const oldPool = poolIds.filter(id => !mustSet.has(id));

  const result = [];

  // 1. Luôn đưa các mục bắt buộc vào trước (xáo trộn)
  const shuffledMust = rng.shuffle(mustInclude.filter(id => poolIds.includes(id)));
  for (const id of shuffledMust) {
    if (result.length < n) {
      result.push(id);
    }
  }

  // Giới hạn số mục cũ tối đa nếu đang ở bài mới
  const maxOldCount = Math.floor(n * maxOldRatio);
  let oldCount = 0;

  // 2. Điền cho đủ n mục bằng bốc thăm theo trọng số
  while (result.length < n) {
    // Xác định pool khả dụng cho lượt này
    let availablePool = poolIds;
    if (shuffledMust.length > 0 && oldCount >= maxOldCount && mustInclude.length > 0) {
      availablePool = mustInclude;
    }

    const weights = availablePool.map(id => {
      let baseW = getWeight(id);
      // Giảm trọng số nếu vừa mới chọn ở câu trước để tránh lặp liên tiếp
      const lastItem = result[result.length - 1];
      const secondLastItem = result[result.length - 2];
      if (id === lastItem) baseW *= 0.1;
      if (id === secondLastItem) baseW *= 0.4;
      return baseW;
    });

    const totalWeight = weights.reduce((acc, v) => acc + v, 0);
    let r = rng.random() * totalWeight;
    let chosen = availablePool[availablePool.length - 1];

    for (let i = 0; i < availablePool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = availablePool[i];
        break;
      }
    }

    // Không để 3 câu liên tiếp giống nhau nếu pool có từ 2 mục trở lên
    const last1 = result[result.length - 1];
    const last2 = result[result.length - 2];
    if (poolIds.length > 1 && chosen === last1 && chosen === last2) {
      const altPool = poolIds.filter(id => id !== chosen);
      chosen = rng.choice(altPool);
    }

    if (!mustSet.has(chosen)) {
      oldCount++;
    }

    result.push(chosen);
  }

  // Xáo trộn nhẹ để mục bắt buộc không dồn hết lên đầu (trừ khi pool quá nhỏ)
  return rng.shuffle(result);
}

/**
 * Tạo danh sách k đáp án nhiễu (distractors) cho mục đúng targetId
 * @param {string} targetId ID mục đúng
 * @param {string[]} poolIds Danh sách ID làm kho chọn nhiễu
 * @param {number} k Số lượng đáp án nhiễu cần tạo
 * @param {'kana'|'word'} kind Loại mục
 * @param {object} rng Trình sinh số ngẫu nhiên
 * @param {object} metaLookups Bảng tra cứu { kanaById, wordById }
 */
export function makeDistractors(targetId, poolIds, k = 2, kind = 'kana', rng = defaultRng, metaLookups = {}) {
  const { kanaById = {}, wordById = {} } = metaLookups;
  const targetMeta = kind === 'kana' ? kanaById[targetId] : wordById[targetId];

  // Loại bỏ mục trùng với targetId
  const candidates = poolIds.filter(id => id !== targetId);
  if (candidates.length === 0) return [];

  // Nhóm ưu tiên
  const prioritized = [];
  const secondary = [];

  for (const id of candidates) {
    const meta = kind === 'kana' ? kanaById[id] : wordById[id];
    if (!meta) {
      secondary.push(id);
      continue;
    }

    // Không chọn 2 đáp án phát âm giống nhau (trùng romaji)
    if (targetMeta && meta.romaji && targetMeta.romaji && meta.romaji.toLowerCase() === targetMeta.romaji.toLowerCase()) {
      continue;
    }

    if (kind === 'kana') {
      // Ưu tiên chữ cùng hàng (cùng phụ âm hoặc nguyên âm)
      if (targetMeta?.row && meta.row === targetMeta.row) {
        prioritized.push(id);
      } else {
        secondary.push(id);
      }
    } else {
      // Ưu tiên từ cùng độ dài ký tự
      if (targetMeta?.word && meta.word && meta.word.length === targetMeta.word.length) {
        prioritized.push(id);
      } else {
        secondary.push(id);
      }
    }
  }

  const shuffledPrioritized = rng.shuffle(prioritized);
  const shuffledSecondary = rng.shuffle(secondary);
  const pool = [...shuffledPrioritized, ...shuffledSecondary];

  const chosen = [];
  const usedRomaji = new Set([targetMeta?.romaji?.toLowerCase()]);

  for (const id of pool) {
    if (chosen.length >= k) break;
    const meta = kind === 'kana' ? kanaById[id] : wordById[id];
    const rom = meta?.romaji?.toLowerCase();
    if (rom && usedRomaji.has(rom)) continue; // Tránh trùng âm với mục đã chọn

    chosen.push(id);
    if (rom) usedRomaji.add(rom);
  }

  // Nếu vẫn chưa đủ k (do kho hẹp), lấy bù từ candidates chưa dùng
  if (chosen.length < k) {
    for (const id of rng.shuffle(candidates)) {
      if (chosen.length >= k) break;
      if (!chosen.includes(id)) {
        chosen.push(id);
      }
    }
  }

  return chosen.slice(0, k);
}
