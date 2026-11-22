/**
 * tests/srs.test.mjs
 * Kiểm tra thuật toán lặp lại ngắt quãng (SRS), chọn câu hỏi và tạo đáp án nhiễu.
 */

import assert from 'node:assert';
import { applyAnswer, pickItems, makeDistractors, addDays } from '../js/core/srs.js';
import { createRng } from '../js/core/rng.js';

function run() {
  console.log('--- Kiểm tra srs.js ---');
  const rng = createRng(12345);
  const masteryConfig = { boxes_days: [0, 1, 3, 7], demote_on_wrong: 1 };
  const today = '2026-11-22';

  // 1. Kiểm tra applyAnswer
  let entry = { box: 0, streak: 0, correct: 0, wrong: 0, due: today };

  // Đúng lần 1 -> streak = 1, box vẫn 0
  entry = applyAnswer(entry, true, today, masteryConfig);
  assert.strictEqual(entry.box, 0);
  assert.strictEqual(entry.streak, 1);
  assert.strictEqual(entry.correct, 1);
  assert.strictEqual(entry.wrong, 0);

  // Đúng lần 2 -> streak = 0, box lên 1, due = today + 1 ngày
  entry = applyAnswer(entry, true, today, masteryConfig);
  assert.strictEqual(entry.box, 1);
  assert.strictEqual(entry.streak, 0);
  assert.strictEqual(entry.correct, 2);
  assert.strictEqual(entry.due, addDays(today, 1));

  // Đúng thêm 2 lần -> lên box 2
  entry = applyAnswer(entry, true, today, masteryConfig);
  entry = applyAnswer(entry, true, today, masteryConfig);
  assert.strictEqual(entry.box, 2);
  assert.strictEqual(entry.due, addDays(today, 3));

  // Đúng thêm 2 lần -> lên box 3 (tối đa)
  entry = applyAnswer(entry, true, today, masteryConfig);
  entry = applyAnswer(entry, true, today, masteryConfig);
  assert.strictEqual(entry.box, 3);
  assert.strictEqual(entry.due, addDays(today, 7));

  // Sai 1 lần -> hạ 1 box xuống box 2, streak về 0
  entry = applyAnswer(entry, false, today, masteryConfig);
  assert.strictEqual(entry.box, 2);
  assert.strictEqual(entry.streak, 0);
  assert.strictEqual(entry.wrong, 1);

  // 2. Kiểm tra pickItems với pool 5 chữ và n = 8
  const pool = ['h_a', 'h_i', 'h_u', 'h_e', 'h_o'];
  for (let trial = 0; trial < 20; trial++) {
    const picked = pickItems(pool, {}, 8, { rng });
    assert.strictEqual(picked.length, 8, `pickItems phải trả về đúng 8 mục (thực tế: ${picked.length})`);

    // Không có 3 câu liên tiếp giống nhau
    for (let i = 0; i < picked.length - 2; i++) {
      const isThreeIdentical = (picked[i] === picked[i + 1] && picked[i + 1] === picked[i + 2]);
      assert.strictEqual(isThreeIdentical, false, `Không được có 3 câu liên tiếp giống nhau tại vị trí ${i}: ${picked.join(', ')}`);
    }
  }

  // 3. Kiểm tra makeDistractors
  const mockKanaById = {
    h_a: { id: 'h_a', char: 'あ', romaji: 'a', row: 'a' },
    h_i: { id: 'h_i', char: 'い', romaji: 'i', row: 'a' },
    h_u: { id: 'h_u', char: 'う', romaji: 'u', row: 'a' },
    h_ka: { id: 'h_ka', char: 'か', romaji: 'ka', row: 'ka' },
    h_ki: { id: 'h_ki', char: 'き', romaji: 'ki', row: 'ka' }
  };

  const distractors = makeDistractors('h_a', Object.keys(mockKanaById), 2, 'kana', rng, { kanaById: mockKanaById });
  assert.strictEqual(distractors.length, 2, 'Phải tạo đủ 2 đáp án nhiễu');
  assert.strictEqual(distractors.includes('h_a'), false, 'Đáp án nhiễu không bao giờ trùng mục đúng');

  console.log('✅ tests/srs.test.mjs: ĐẠT TOÀN BỘ TIÊU CHÍ');
}

run();
