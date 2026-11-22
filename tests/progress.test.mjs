/**
 * tests/progress.test.mjs
 * Kiểm tra lưu trữ tiến độ, sao lưu, phục hồi và xử lý lỗi bộ nhớ.
 */

import assert from 'node:assert';
import { ProgressManager } from '../js/core/progress.js';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

function run() {
  console.log('--- Kiểm tra progress.js ---');
  const storage = new MockStorage();
  const pm = new ProgressManager({ storage });

  // 1. Kiểm tra trạng thái mặc định
  assert.strictEqual(pm.getStars(), 0);
  assert.strictEqual(pm.getStickers().length, 0);

  // 2. Kiểm tra cộng sao
  pm.addStars(5);
  assert.strictEqual(pm.getStars(), 5);

  // 3. Kiểm tra mở khoá sticker
  const isNew = pm.unlockSticker('🍙');
  assert.strictEqual(isNew, true, 'Mở khoá sticker mới lần đầu phải trả về true');
  const isDuplicate = pm.unlockSticker('🍙');
  assert.strictEqual(isDuplicate, false, 'Sticker đã có thì trả về false');
  assert.strictEqual(pm.getStickers().length, 1);

  // 4. Kiểm tra export() và import() dữ liệu y hệt
  const exportedJson = pm.export();
  assert.strictEqual(typeof exportedJson, 'string');

  const pm2 = new ProgressManager({ storage: new MockStorage() });
  const importRes = pm2.import(exportedJson);
  assert.strictEqual(importRes.success, true);
  assert.strictEqual(pm2.getStars(), 5);
  assert.deepStrictEqual(pm2.getStickers(), ['🍙']);

  // 5. Kiểm tra import chuỗi JSON hỏng: không ghi đè dữ liệu cũ và báo lỗi
  const corruptRes = pm2.import('{"schema": 1, corrupt json');
  assert.strictEqual(corruptRes.success, false);
  assert.strictEqual(pm2.getStars(), 5, 'Dữ liệu cũ phải được giữ nguyên khi file hỏng');

  console.log('✅ tests/progress.test.mjs: ĐẠT TOÀN BỘ TIÊU CHÍ');
}

run();
