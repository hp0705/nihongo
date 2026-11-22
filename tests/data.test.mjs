/**
 * tests/data.test.mjs
 * Kiểm tra loadAll(), taughtKanaIds() và readableWords() với dữ liệu thực tế.
 */

import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll } from '../js/core/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Trình giả lập fetch đọc file từ ổ đĩa khi chạy trên Node.js
async function mockFetch(url) {
  const cleanUrl = url.split('?')[0];
  const relativePath = cleanUrl.replace(/^\.\//, '');
  const filePath = path.resolve(rootDir, relativePath);
  const content = await fs.readFile(filePath, 'utf-8');
  return {
    ok: true,
    status: 200,
    async json() {
      return JSON.parse(content);
    }
  };
}

async function run() {
  console.log('--- Kiểm tra data.js ---');
  const data = await loadAll('./data', mockFetch);

  // 1. Kiểm tra cấu trúc tra cứu
  assert.strictEqual(typeof data.kanaById, 'object', 'kanaById phải là object');
  assert.strictEqual(typeof data.wordById, 'object', 'wordById phải là object');
  assert.strictEqual(Array.isArray(data.lessonsOrdered), true, 'lessonsOrdered phải là array');
  assert.strictEqual(data.lessonsOrdered.length, 6, 'MVP phải có 6 bài học');

  // 2. Kiểm tra taughtKanaIds
  const kanaL1 = data.taughtKanaIds(1);
  assert.strictEqual(kanaL1.length, 5, 'L1 (hàng A) phải dạy đúng 5 chữ');
  assert.deepStrictEqual(kanaL1, ['h_a', 'h_i', 'h_u', 'h_e', 'h_o']);

  const kanaL2 = data.taughtKanaIds(2);
  assert.strictEqual(kanaL2.length, 10, 'Sau L2 phải dạy 10 chữ');

  const kanaR1 = data.taughtKanaIds(3); // R1 là bài ôn (order 3)
  assert.strictEqual(kanaR1.length, 10, 'R1 là ôn tập nên tổng số chữ không tăng (10 chữ)');

  const kanaL3 = data.taughtKanaIds(4);
  assert.strictEqual(kanaL3.length, 15, 'Sau L3 phải dạy 15 chữ');

  const kanaL4 = data.taughtKanaIds(5);
  assert.strictEqual(kanaL4.length, 20, 'Sau L4 phải dạy 20 chữ');

  // 3. Kiểm tra readableWords theo tiêu chí nghiệm thu
  // readableWords sau L1 = 5 từ, sau L2 = 13, sau L3 = 29, sau L4 = 43
  const wordsL1 = data.readableWords(1);
  assert.strictEqual(wordsL1.length, 5, `readableWords sau L1 phải = 5 từ (thực tế: ${wordsL1.length})`);

  const wordsL2 = data.readableWords(2);
  assert.strictEqual(wordsL2.length, 13, `readableWords sau L2 phải = 13 từ (thực tế: ${wordsL2.length})`);

  const wordsR1 = data.readableWords(3);
  assert.strictEqual(wordsR1.length, 13, `readableWords sau R1 phải = 13 từ (thực tế: ${wordsR1.length})`);

  const wordsL3 = data.readableWords(4);
  assert.strictEqual(wordsL3.length, 29, `readableWords sau L3 phải = 29 từ (thực tế: ${wordsL3.length})`);

  const wordsL4 = data.readableWords(5);
  assert.strictEqual(wordsL4.length, 43, `readableWords sau L4 phải = 43 từ (thực tế: ${wordsL4.length})`);

  console.log('✅ tests/data.test.mjs: ĐẠT TOÀN BỘ TIÊU CHÍ');
}

run().catch((err) => {
  console.error('❌ tests/data.test.mjs thất bại:', err);
  process.exit(1);
});
