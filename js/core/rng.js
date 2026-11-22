/**
 * js/core/rng.js
 * PRNG có seed (Mulberry32) để hỗ trợ test lặp lại và ngẫu nhiên trong game.
 */

export function createRng(seed = Date.now()) {
  let s = Math.floor(seed) >>> 0;

  function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    random: next,

    // Số nguyên trong khoảng [min, max]
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },

    // Chọn 1 phần tử ngẫu nhiên
    choice(arr) {
      if (!arr || arr.length === 0) return null;
      return arr[Math.floor(next() * arr.length)];
    },

    // Xáo trộn mảng (Fisher-Yates) trả về mảng mới
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };
}

export const defaultRng = createRng();
