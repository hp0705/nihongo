# HỢP ĐỒNG TRÒ CHƠI (GAME CONTRACT)

Mỗi trò chơi trong `js/games/*.js` tuân thủ hợp đồng chuẩn sau để tích hợp vào router và hệ thống phần thưởng:

```javascript
export default {
  id: 'game_id', // ví dụ: 'meet', 'listen_pick', 'bubble_pop', 'karuta', 'word_builder'
  
  /**
   * Khởi chạy trò chơi và trả về Promise khi trò chơi kết thúc hoặc bé thoát
   * @param {object} ctx Ngữ cảnh trò chơi
   *   - ctx.data: đối tượng dữ liệu (kanaById, wordById, taughtKanaIds, readableWords...)
   *   - ctx.audio: đối tượng AudioManager (play, playSfx, audioFor, unlock...)
   *   - ctx.progress: đối tượng ProgressManager (recordAnswer, recordGameResult...)
   *   - ctx.srs: các hàm srs (pickItems, makeDistractors, applyAnswer...)
   *   - ctx.rng: trình sinh số ngẫu nhiên có seed
   *   - ctx.root: DOM Element để render trò chơi
   *   - ctx.lesson: đối tượng bài học hiện tại từ lessons_ja.json
   *   - ctx.level: cấp độ trò chơi (1-3)
   *   - ctx.settings: cài đặt hiện tại (romaji, vi_hint, audio_speed...)
   *   - ctx.onExit: hàm callback khi bé bấm nút thoát ✖
   * @param {object} params Các tham số bổ sung
   * @returns {Promise<{
   *   stars: number,           // 1, 2 hoặc 3 sao
   *   correct: number,         // số câu trả lời đúng
   *   wrong: number,           // số lần trả lời sai
   *   answers: Array<{kind: 'kana'|'word', id: string, correct: boolean}>
   * }>}
   */
  async start(ctx, params) { ... }
};
```

## Quy tắc giao diện & UX bắt buộc trong trò chơi
1. **Nút ✖ thoát:** cần nhấn giữ 1 giây để tránh bé chạm nhầm.
2. **Nút 🔊 nghe lại:** luôn hiển thị to, rõ, bé chạm vào phát lại âm thanh của câu hiện tại.
3. **Thanh tiến độ câu hỏi:** hiển thị các chấm tròn hoặc bước tàu tiến dần.
4. **Không có phạt / Game Over:** sai thì rung nhẹ và phát lại âm đúng. Sau 2 lần sai tự động gợi ý đáp án đúng.
5. **Dọn dẹp tài nguyên:** huỷ mọi `requestAnimationFrame`, `setTimeout`, sự kiện window/document khi kết thúc hoặc thoát.
