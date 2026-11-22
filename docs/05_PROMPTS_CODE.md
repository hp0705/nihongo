# 05. BỘ PROMPT ĐỂ GIAO CHO AI VIẾT CODE

## Cách dùng

1. Dùng một AI viết code làm việc trực tiếp trên repo (Claude Code là hợp nhất; ChatGPT/Codex hoặc công cụ khác cũng được).
2. Với **mỗi prompt**: mở phiên mới, dán **PROMPT 0 (bối cảnh)** rồi dán prompt cần làm. AI chưa nhớ gì giữa các phiên nên prompt 0 luôn phải có.
3. Làm theo thứ tự 1 → 10. Sau mỗi prompt: mở thử app (chạy `python -m http.server 8000` rồi vào `http://localhost:8000`), đối chiếu **Tiêu chí nghiệm thu**, đạt mới commit.
4. Nếu AI làm sai, dùng **Mẫu prompt sửa lỗi** ở cuối tài liệu.
5. Test trên thiết bị thật của bé (iPad/Android) từ Prompt 3 trở đi, đừng chờ tới cuối.

---

## PROMPT 0: BỐI CẢNH DỰ ÁN (dán ở đầu mọi phiên)

````text
Bạn là kỹ sư front-end giàu kinh nghiệm làm app học cho trẻ nhỏ. Bạn đang xây "Nihongo Adventure": app web tĩnh giúp một bé người Việt (4-7 tuổi) học bảng chữ cái tiếng Nhật và từ vựng cơ bản qua các trò chơi ngắn.

BỐI CẢNH
- Repo GitHub, chạy trên GitHub Pages (thư mục con, nên MỌI đường dẫn phải là đường dẫn tương đối như ./data/..., không dùng /data/...).
- Không dùng framework, không build step: HTML + CSS + JavaScript thuần, ES modules (type="module"). Không thư viện ngoài trừ khi tôi cho phép.
- Toàn bộ nội dung học nằm trong data/*.json (đã có sẵn: kana_hiragana.json, vocabulary_ja.json, lessons_ja.json, game_config.json, ui_voice.json). TUYỆT ĐỐI không viết cứng chữ/từ/bài trong code; thêm nội dung chỉ bằng cách sửa JSON.
- Hãy đọc kỹ docs/01 (thiết kế game), docs/02 (nội dung), docs/03 (cấu trúc dữ liệu), docs/04 (âm thanh) trước khi viết code. Nếu prompt mâu thuẫn tài liệu, hỏi tôi.
- Âm thanh là file mp3 tạo sẵn ở assets/audio/ja/... theo đường dẫn ghi trong JSON. Chưa có file thì code phải chạy tiếp được (ghi console.warn, không crash).

CẤU TRÚC THƯ MỤC (giữ đúng)
index.html, css/style.css, js/main.js, js/core/{data,audio,progress,srs,ui,rng}.js, js/games/{meet,listen_pick,bubble_pop,karuta,word_builder}.js, js/screens/{home,station,result,stickers,parent}.js, sw.js, manifest.webmanifest

QUY TẮC CHẤT LƯỢNG
1. Giao diện ưu tiên máy tính bảng, dùng tốt trên điện thoại (dọc/ngang). Vùng chạm tối thiểu 64x64 px, khoảng cách 12 px. Dùng pointer events. Không cần chuột phải/hover.
2. Chữ kana không bao giờ bị cắt, méo, xoay. Phông kana tròn, rõ (Zen Maru Gothic hoặc M PLUS Rounded 1c, tải về assets/fonts, dùng @font-face, có fallback hệ thống).
3. Ít chữ trên màn hình. Hướng dẫn bằng giọng nói và biểu tượng. Nhãn tiếng Việt ngắn, chủ yếu cho phụ huynh.
4. Không có "thua", không trừ điểm, không đếm ngược gây áp lực. Sai thì phát lại âm đúng và cho thử lại; sai 2 lần thì tự gợi ý.
5. Hiệu năng: 60 fps trên iPad cũ; animation dùng CSS transform/opacity hoặc requestAnimationFrame.
6. Trình duyệt di động chặn âm thanh đến khi có chạm: có màn "はじめよう!" chạm 1 lần để mở khoá.
7. Truy cập được bằng bàn phím ở vùng phụ huynh; tương phản màu đủ; tôn trọng prefers-reduced-motion.
8. Mã gọn, có chú thích tiếng Việt ở các chỗ khó, tên biến tiếng Anh. Mỗi file một trách nhiệm. Hàm thuần (không đụng DOM) cho logic chọn câu hỏi để dễ test.
9. Mọi lỗi tải dữ liệu hoặc thiếu file phải hiện thông báo thân thiện cho phụ huynh, không trắng màn hình.

CÁCH LÀM VIỆC
- Trước khi viết code, tóm tắt kế hoạch ngắn (các file sẽ tạo/sửa).
- Sau khi xong, tự chạy kiểm tra có thể (node --check, test) và liệt kê CÁCH TÔI TỰ KIỂM TRA bằng tay.
- Không làm thêm tính năng ngoài prompt. Việc nên làm nhưng ngoài phạm vi thì ghi ở cuối "Đề xuất".
````

---

## PROMPT 1: Khung app, nạp dữ liệu, màn khởi động

````text
Nhiệm vụ: dựng khung app và bộ nạp dữ liệu.

1. index.html (một trang), css/style.css (biến CSS cho màu/cỡ chữ, bố cục responsive), js/main.js.
2. js/core/data.js: hàm loadAll() nạp 5 file JSON trong data/ (kèm ?v=<version> chống cache), kiểm tra tối thiểu (có mảng kana, words, lessons...), trả về một đối tượng tra cứu:
   - kanaById, wordById, lessonsOrdered, config, uiPhrases
   - taughtKanaIds(uptoLessonOrder): tập id chữ đã dạy tới bài đó (từ các bài type "new")
   - readableWords(uptoLessonOrder): các từ có unlock_lesson có order <= uptoLessonOrder
   Đây là hàm thuần, dễ test.
3. Một "router" đơn giản dựa trên hash (#/home, #/station/L1, #/play/L1/listen_pick, #/stickers, #/parent): chỉ nhận hash dạng #name hoặc #/path dùng nội bộ, không dùng tham số nhạy cảm.
4. Màn khởi động: nút lớn "はじめよう!" ; khi chạm mở khoá âm thanh (phát file im lặng hoặc resume AudioContext) rồi chuyển sang #/home. Màn home tạm thời chỉ hiển thị "Xin chào" và danh sách bài đọc từ lessons_ja.json (để thấy dữ liệu chạy).
5. Màn lỗi thân thiện nếu fetch JSON thất bại (hướng dẫn phụ huynh: kiểm tra mạng / tải lại).
6. Viết tests/data.test.mjs (chạy bằng node) kiểm tra taughtKanaIds và readableWords với dữ liệu thật.

TIÊU CHÍ NGHIỆM THU
- Chạy python -m http.server, mở trang: thấy nút "はじめよう!", chạm vào thì sang home và liệt kê 6 bài.
- node tests/data.test.mjs: pass; readableWords sau L1 = 5 từ, sau L2 = 13, sau L3 = 29, sau L4 = 43.
- Mở thư mục con (ví dụ /nihongo-adventure/) vẫn chạy (đường dẫn tương đối).
- Cố tình đổi tên 1 file JSON: hiện màn lỗi thân thiện, không trắng màn hình.
````

---

## PROMPT 2: Âm thanh, lưu tiến độ, chọn câu hỏi thông minh

````text
Nhiệm vụ: làm 3 module lõi, KHÔNG làm giao diện game.

1. js/core/audio.js
   - Lớp AudioManager: unlock(), preload(paths[]), play(path, {onEnd}) trả Promise, playSequence([paths]), stopAll().
   - Phát tức thì cho file ngắn (AudioContext + decodeAudioData, có fallback Audio). Hỗ trợ phát chồng sfx.
   - Hàm audioFor(kind, id, speed) lấy đường dẫn từ JSON (audio.normal/slow).
   - Nếu thiếu file: console.warn một lần cho mỗi file, resolve ngay (không treo trò chơi). Tuỳ chọn trong settings "dùng giọng trình duyệt ja-JP làm dự phòng" (mặc định tắt).
2. js/core/progress.js
   - Lưu localStorage khoá "nihongo_adventure_progress_v1" theo schema ở docs/03 mục 6. Có defaults, validate, migrate(oldSchema), export() trả chuỗi JSON, import(json) kiểm tra rồi ghi, reset().
   - API: getKana(id), recordAnswer(kind, id, isCorrect), addStars(n), unlockSticker(emoji), setStamp(lessonId), touchDay() (tính chuỗi ngày, bỏ ngày thì về 1, không báo buồn), settings get/set.
   - Bọc try/catch cho localStorage (chế độ riêng tư có thể lỗi): rơi về bộ nhớ tạm.
3. js/core/srs.js (hàm thuần)
   - applyAnswer(entry, isCorrect, today, config.mastery): đúng 2 lần liên tiếp thì lên hộp (tối đa 3), sai thì xuống 1 hộp, tính "due" theo boxes_days.
   - pickItems(poolIds, entries, n, opts): chọn n mục theo trọng số (hộp thấp, quá hạn, mới sai nhiều hơn), tránh lặp liên tiếp, đảm bảo luôn đủ n (lặp lại nếu pool nhỏ), cho phép opts.mustInclude (mục của bài mới) và opts.maxOldRatio (mặc định 0.4).
   - makeDistractors(targetId, poolIds, k, kind, rng): đáp án nhiễu cùng hàng ưu tiên trước; cho từ thì ưu tiên từ cùng độ dài; không bao giờ trùng id đúng; không có 2 đáp án phát âm giống nhau (so romaji).
4. js/core/rng.js: PRNG có seed (mulberry32) để test lặp lại được.
5. Viết tests (node): tests/srs.test.mjs và tests/progress.test.mjs (giả lập localStorage) phủ các hàm trên.

TIÊU CHÍ NGHIỆM THU
- Mọi test node pass.
- Trên trang test (tạm): nút phát âm "a" và từ "ashi"; nếu thiếu mp3 thì chỉ có cảnh báo console, trang vẫn chạy.
- pickItems với pool 5 chữ và n = 8 luôn trả đủ 8, không có 3 câu liên tiếp giống nhau.
- export() rồi import() trả về dữ liệu y hệt; import file hỏng thì báo lỗi, không ghi đè dữ liệu cũ.
````

---

## PROMPT 3: Bản đồ tàu, trang ga, kết quả, phần thưởng

````text
Nhiệm vụ: làm vòng lặp trò chơi và hệ thống phần thưởng, dùng một trò "giả" tạm để thử.

1. js/screens/home.js: tuyến tàu nằm ngang (kéo ngang), mỗi ga là một bài trong lessons_ja.json (emoji ga + tên). Ga chưa mở (bài trước chưa xong) xám và khoá. Hiện bậc con vật (levels trong game_config.json) kèm thanh sao tới bậc kế, số sticker, nút "Nhiệm vụ hôm nay", biểu tượng sổ sticker, nút nhỏ vùng phụ huynh. Có linh vật Bé Mây (vẽ bằng SVG/CSS đơn giản, vẫy tay).
2. js/screens/station.js: trang một ga, liệt kê các trò trong lesson.games, trò đã xong hiện 1-3 sao. Nút "Chơi tiếp" chọn trò kế tiếp.
3. js/screens/result.js: nhận kết quả {stars, correct, wrong}; hiệu ứng sao bay; cộng sao; nếu hoàn thành "nhiệm vụ hôm nay" (3 trò) thì hiện hộp quà mở ra 1 sticker ngẫu nhiên CHƯA có; nếu hoàn thành mọi trò của ga thì hiệu ứng đóng con dấu ga. Phát lời khen từ ui_voice.json (すごい, やったー...).
4. js/screens/stickers.js: sổ sticker (lưới 20 ô, ô chưa có là bóng mờ).
5. Quy tắc sao: 3 sao nếu sai <= 1, 2 sao nếu sai <= 3, còn lại 1 sao (game_config.session.stars_rule).
6. Quy tắc mở ga: ga mở khi ga trước có con dấu; ga đầu luôn mở. Bài "review" mở khi các bài được ôn đã mở.
7. Nhiệm vụ hôm nay: 3 trò chọn từ bài đang mở (ưu tiên bài mới nhất + 1 trò ôn); lưu trạng thái theo ngày; sang ngày mới thì tạo nhiệm vụ mới.
8. Tạo trò giả js/games/_dummy.js (hiện nút "Xong") trả {stars: 3, correct: 8, wrong: 0} để kiểm tra luồng.
9. Định nghĩa HỢP ĐỒNG trò chơi trong js/games/README.md: mỗi trò export default { id, async start(ctx, params) } trả Promise<{stars, correct, wrong, answers:[{kind,id,correct}]}>; ctx = { data, audio, progress, srs, rng, root(element), lesson, level(1-3), settings }.

TIÊU CHÍ NGHIỆM THU
- Chơi trò giả 3 lần: thấy sao, thanh bậc con vật tăng, nhận sticker không trùng, đóng dấu ga khi đủ trò, ga kế tiếp mở khoá.
- Tải lại trang: tiến độ còn nguyên.
- Trên iPad hoặc giả lập thiết bị trong DevTools: không có thanh cuộn ngang ngoài tuyến tàu, nút to dễ chạm.
- Đổi ngày giả lập (đổi hệ thống hoặc hàm now() có thể ghi đè): nhiệm vụ mới xuất hiện, chuỗi ngày cập nhật đúng.
````

---

## PROMPT 4: Trò "Gặp chữ" và "Nghe và chọn"

````text
Nhiệm vụ: làm 2 trò đầu tiên theo hợp đồng ở js/games/README.md. Đọc kỹ docs/01 mục 6.1 và 6.2.

1. js/games/meet.js
   - Với mỗi chữ mới của bài: thẻ lớn (chữ khổng lồ, nút 🔊 phát bản slow rồi normal, hình + từ minh hoạ lấy từ anchor_word_id với chữ đang học được tô màu trong từ, gợi ý tiếng Việt và romaji nhỏ theo settings).
   - Phải chạm 🔊 ít nhất một lần mới được sang chữ kế (nút "tiếp" sáng lên).
   - Cuối trò: mini-check 3 lựa chọn cho từng chữ vừa học. Số sai tính vào kết quả.
2. js/games/listen_pick.js
   - Cấp 1: nghe âm của một chữ, chọn chữ đúng (3 lựa chọn). Cấp 2: 4 lựa chọn. Cấp 3: nghe một TỪ đọc được, chọn từ đúng (4 lựa chọn, hiện chữ + hình).
   - Số câu = config.session.questions_per_game. Dùng srs.pickItems và makeDistractors.
   - Sai: đáp án sai rung nhẹ, phát lại âm đúng, đáp án đúng nhấp nháy; sai 2 lần thì tự tô gợi ý đáp án đúng.
3. Nút ✖ thoát (chạm giữ 1 giây) và nút 🔊 nghe lại luôn có.
4. Ghi từng câu trả lời vào progress.recordAnswer.
5. Nối vào router để chơi từ trang ga; thay _dummy bằng trò thật.

TIÊU CHÍ NGHIỆM THU
- Chơi trọn bài L1: Gặp chữ 5 thẻ, rồi Nghe và chọn 8 câu; đáp án đúng luôn nằm ở vị trí ngẫu nhiên; không có hai đáp án giống hoặc trùng âm.
- Sau 2 lần sai ở một câu thì đáp án đúng được tô gợi ý.
- Trò chơi vẫn chạy bình thường khi KHÔNG có file mp3 (chỉ cảnh báo console).
- Ở bài L3, các câu có cả chữ của L1/L2 (ôn) nhưng tối đa 40% là chữ cũ.
- Dữ liệu tiến độ (hộp của từng chữ) thay đổi đúng sau khi chơi (xem trong vùng phụ huynh hoặc localStorage).
````

---

## PROMPT 5: Trò "Bóng bay chữ"

````text
Nhiệm vụ: làm js/games/bubble_pop.js (docs/01 mục 6.3).

- Canvas hoặc DOM + requestAnimationFrame. Bóng bay trôi lên chậm, mỗi quả một chữ (kana). Máy đọc một âm; bé chạm quả đúng.
- Cấp độ theo game_config.games.bubble_pop.levels (tốc độ và số bóng cùng lúc).
- Chạm đúng: nổ, tiếng pop, sao bay, câu kế tiếp. Chạm sai: bóng rung, phát lại âm đúng (không trừ điểm gì ngoài việc tính 1 lần sai).
- Bóng không rơi mất. Nếu 8 giây không chạm: bóng đúng nhấp nháy và máy đọc lại.
- Tránh để hai bóng chồng nhau; bóng chạm mép thì bật nhẹ; kích thước bóng ≥ 96 px.
- Khi tab bị ẩn thì tạm dừng (visibilitychange).
- Câu hỏi lấy bằng srs.pickItems, số câu theo config.

TIÊU CHÍ NGHIỆM THU
- 60 fps trên iPad cũ (mở Performance trong DevTools giả lập, không rớt khung liên tục).
- Chạm nhanh liên tiếp không gây lỗi (không nổ hai lần một quả, không đếm trùng).
- Thu nhỏ rồi mở lại tab: trò tiếp tục đúng, không nhảy cóc.
- Kết quả trả về đúng hợp đồng (stars/correct/wrong/answers).
````

---

## PROMPT 6: Trò "Karuta"

````text
Nhiệm vụ: làm js/games/karuta.js (docs/01 mục 6.4).

- "Chiếu tatami" nền, 4/6/8 thẻ (theo cấp) mỗi thẻ có hình (emoji hoặc ảnh nếu có) + từ viết bằng kana. Chỉ dùng từ ĐỌC ĐƯỢC (data.readableWords).
- Máy đọc một từ. Bé và "Mây" (máy) cùng tranh. Mây phản ứng sau thời gian ngẫu nhiên trong khoảng cấu hình (karuta.bot_reaction_seconds theo cấp); Mây chỉ chạm đúng thẻ. Nếu bé chạm đúng trước thì thẻ bay vào đống của bé; nếu Mây trước, vào đống Mây. Bé chạm sai: thẻ rung, đọc lại từ, không mất gì.
- Để bé thắng đa số: nếu bé đã sai 2 câu liên tiếp, tự giãn thêm 2 giây cho Mây.
- Kết quả: sao theo số lần bé sai (như quy tắc chung), thắng/thua chỉ để vui và luôn nhận ít nhất 1 sao. Có thể chia thẻ đã lấy thành đống để so.
- Cần ít nhất 6 từ đọc được: nếu bài chưa đủ, trò tự giấu khỏi trang ga (đọc game_config hoặc kiểm tra readableWords).
- Dọn dẹp timer khi thoát trò.

TIÊU CHÍ NGHIỆM THU
- Bài L2 trở lên chơi được; L1 không hiện nút karuta.
- Hai chạm cùng lúc lên một thẻ không gây lỗi đếm.
- Thoát giữa chừng không để lại timer chạy ngầm (kiểm tra bằng console).
- Từ được đọc đúng file âm thanh; thẻ hiển thị đúng hình và chữ.
````

---

## PROMPT 7: Trò "Ghép từ"

````text
Nhiệm vụ: làm js/games/word_builder.js (docs/01 mục 6.5).

- Hiện hình + phát âm từ (nút 🔊 nghe chậm). Các ô trống bằng số chữ của từ (dùng word.kana_ids, tách theo chữ, âm ghép tính là một ô). Dưới là các "viên gạch" chữ (chữ đúng + 0-2 chữ nhiễu theo cấp, tối đa max_tiles).
- Bé kéo-thả hoặc chạm lần lượt (hỗ trợ cả hai). Chữ đúng vị trí thì khoá lại với tiếng "ding"; sai thì viên gạch nảy về chỗ cũ, và sau word_builder.hint_after_wrong lần sai thì viên gạch đúng tiếp theo rung nhẹ.
- Ghép xong: đọc cả từ (normal), hình nhảy múa, rồi chuyển từ kế.
- Chỉ dùng từ đọc được. Ưu tiên từ có hộp thấp (srs.pickItems kind = word).
- Hỗ trợ từ có 1 chữ (き, て): hiển thị 1 ô và viên gạch gồm 1 đúng + nhiễu.

TIÊU CHÍ NGHIỆM THU
- Kéo-thả mượt cả bằng ngón tay và chuột; thả ra ngoài ô thì bay về chỗ cũ.
- Từ "おいしい" (chữ lặp い) vẫn ghép đúng (hai ô い đều nhận chữ い).
- Không thể bị kẹt (luôn có cách hoàn thành). Sau 2 lần sai có gợi ý.
- Từ một chữ chạy đúng.
````

---

## PROMPT 8: Vùng phụ huynh và cài đặt

````text
Nhiệm vụ: làm js/screens/parent.js (docs/01 mục 9).

- Cổng vào: câu hỏi toán ngẫu nhiên (cộng hai số một chữ số lớn hơn 5), trả lời đúng mới vào. Không dùng PIN.
- Tiến độ: bảng từng chữ và từng từ đã dạy với hộp 0-3, số lần đúng/sai, màu theo mức (đỏ/vàng/xanh); lọc "cần ôn".
- Cài đặt: bật/tắt romaji, bật/tắt gợi ý tiếng Việt, tốc độ âm thanh (normal/slow ưu tiên), nhạc nền, giới hạn thời gian mỗi ngày (mặc định 20 phút; khi chạm giới hạn thì Bé Mây ngáp và mời nghỉ, phụ huynh có thể cho chơi thêm).
- Xuất tiến độ ra file JSON (tải về), nhập từ file, xoá dữ liệu (xác nhận hai bước).
- Hiện phiên bản nội dung (từ các file JSON) và nút "Kiểm tra cập nhật" (tải lại JSON và báo có thay đổi không).
- Hiện cảnh báo "Thiếu âm thanh" liệt kê các file mp3 không tìm thấy khi vào bài (lưu lại trong phiên).

TIÊU CHÍ NGHIỆM THU
- Xuất rồi xoá rồi nhập: mọi tiến độ về đúng.
- Đổi cài đặt có hiệu lực ngay ở các trò (romaji hiện/ẩn).
- Hết giới hạn thời gian: lời mời nghỉ hiện, bấm "chơi thêm" cần qua cổng toán.
- Điều khiển được bằng bàn phím (Tab, Enter).
````

---

## PROMPT 9: Offline (PWA), GitHub Pages, kiểm tra tự động

````text
Nhiệm vụ: hoàn thiện triển khai.

1. manifest.webmanifest (tên, biểu tượng 192/512, chế độ standalone, hướng tự do) và sw.js: precache index, css, js, font, ảnh nhỏ; data/*.json theo chiến lược "mạng trước, cache sau"; assets/audio theo "cache trước, bổ sung khi dùng". Hằng CACHE_VERSION ở đầu file. Đăng ký service worker trong main.js (chỉ khi chạy https hoặc localhost).
2. Chạy được trên đường dẫn thư mục con của GitHub Pages: kiểm tra mọi fetch/import/đường dẫn ảnh/âm thanh đều tương đối.
3. Trang "Cài lên màn hình chính" nhẹ nhàng trong vùng phụ huynh (hướng dẫn cho iOS: Chia sẻ > Thêm vào Màn hình chính).
4. Kiểm tra tự động: giữ nguyên .github/workflows/validate.yml; thêm bước chạy các test node trong thư mục tests/ (node --test).
5. Viết docs/CREDITS.md liệt kê phông, emoji, nguồn âm thanh (theo bảng ở docs/03 mục 9).
6. README ngắn ở thư mục gốc: cách chạy cục bộ, cách thêm nội dung (trỏ tới docs/03).

TIÊU CHÍ NGHIỆM THU
- Chạy một lần khi có mạng, tắt mạng, tải lại: app vẫn chơi được (kể cả âm thanh đã nghe).
- Tăng CACHE_VERSION thì máy cũ nhận bản mới sau lần mở kế tiếp.
- GitHub Actions: xanh ✅ khi dữ liệu đạt; đỏ ❌ khi cố tình làm sai romaji một từ.
- Lighthouse (DevTools): PWA hợp lệ, không lỗi đường dẫn.
````

---

## PROMPT 10: Rà soát chất lượng và diễn tập cập nhật nội dung

````text
Nhiệm vụ: rà soát toàn bộ và diễn tập thêm một bài mới KHÔNG sửa code.

PHẦN A - RÀ SOÁT
1. Đọc lại toàn bộ code, tìm: nội dung cứng trong code, đường dẫn tuyệt đối, timer/listener không dọn, chỗ crash khi thiếu file, chỗ chạm nhỏ hơn 64 px, chỗ có chữ kana bị cắt, rò rỉ bộ nhớ ở các trò.
2. Sửa các lỗi tìm thấy, mỗi lỗi một commit nhỏ, và liệt kê danh sách đã sửa.
3. Chạy toàn bộ test và python scripts/validate_content.py.

PHẦN B - DIỄN TẬP CẬP NHẬT
Giả lập thêm hàng な (na ni nu ne no): thêm 1 bài "new" và 1 bài "review" vào data/lessons_ja.json, thêm 8 từ vào data/vocabulary_ja.json chỉ dùng chữ đã học (có hình emoji, nghĩa tiếng Việt), chạy validate_content.py --fix. KHÔNG sửa bất kỳ file .js nào. Mở app và xác nhận bài mới xuất hiện, các trò dùng từ mới đúng.
Nếu phải sửa code mới chạy được: đó là lỗi thiết kế, hãy sửa code để lần sau không cần sửa nữa, rồi báo tôi.
(Chú ý: chưa có file âm thanh cho từ mới nên chỉ cần app không crash.) Sau diễn tập, hoàn tác các thay đổi dữ liệu thử nghiệm.

TIÊU CHÍ NGHIỆM THU
- Bài mới hiển thị mà không sửa code.
- Báo cáo rà soát gồm danh sách lỗi đã sửa và việc còn lại.
````

---

## PROMPT 11 (giai đoạn 2): Tập viết, Lật hình, Shiritori

````text
Nhiệm vụ: thêm 3 trò theo hợp đồng trò chơi. Đọc docs/01 mục 7.

1. trace: lấy nét chữ từ KanjiVG (tải các file SVG hiragana vào assets/strokes/<mã unicode hex>.svg, ghi nguồn ở docs/CREDITS.md). Hiển thị chữ mờ, bé tô theo nét bằng ngón tay (pointer events trên canvas), kiểm tra bằng khoảng cách tới đường nét mẫu, tuần tự từng nét, có nét gợi ý hoạt hình. Đủ nét thì khen.
2. memory: lật cặp chữ-hình hoặc chữ-âm, 6/8/12 thẻ.
3. shiritori: nối từ với Mây; từ kế bắt đầu bằng chữ cuối từ trước; cấm từ kết thúc bằng ん; chỉ dùng từ đọc được; Mây có thể "chịu thua" nên bé luôn thắng. Cần ≥ 60 từ, nếu chưa đủ thì ẩn trò.
Thêm id trò vào danh sách hợp lệ ở validate_content.py nếu chưa có. Không sửa dữ liệu bài.

TIÊU CHÍ NGHIỆM THU
- Mỗi trò xuất hiện ở trang ga khi có trong lesson.games và đủ điều kiện dữ liệu.
- Tập viết kiểm tra đúng thứ tự nét cho あ, い, き, し.
````

---

## MẪU PROMPT SỬA LỖI (dùng khi có bug)

````text
[Dán PROMPT 0 trước]

Lỗi: <mô tả ngắn, ví dụ "ở trò Bóng bay chữ, chạm hai lần quả bóng thì tính 2 điểm">
Thiết bị / trình duyệt: <ví dụ iPad Safari 17>
Cách làm lỗi xảy ra: 1) ... 2) ... 3) ...
Kết quả mong đợi: ...
Kết quả thực tế: ... (đính kèm ảnh chụp màn hình hoặc nội dung console nếu có)

Hãy: (1) tìm nguyên nhân gốc rễ và giải thích trong 3-5 câu, (2) sửa tối thiểu, (3) thêm test nếu logic thuần, (4) nói cách tôi kiểm tra lại. Không sửa ngoài phạm vi lỗi.
````

## MẪU PROMPT THÊM TRÒ / TÍNH NĂNG MỚI

````text
[Dán PROMPT 0 trước]

Tính năng: <tên>
Mô tả: <1-3 câu>
Dữ liệu cần: <file JSON nào, trường nào> (nếu cần trường mới, đề xuất schema trước rồi cập nhật docs/03 và scripts/validate_content.py)
Tiêu chí nghiệm thu: <danh sách có thể kiểm tra được>
Không làm: <những thứ ngoài phạm vi>
````

---

## DANH SÁCH KIỂM THỬ THỦ CÔNG TRƯỚC KHI ĐƯA CHO BÉ

- [ ] iPad Safari và Android Chrome: có tiếng sau lần chạm đầu tiên.
- [ ] Chơi trọn 1 nhiệm vụ (3 trò) không lỗi, dưới 10 phút.
- [ ] Tắt mạng: vẫn chơi.
- [ ] Xoay màn hình ngang/dọc không vỡ giao diện.
- [ ] Chạm sai liên tục không làm kẹt trò.
- [ ] Phụ huynh xuất/nhập tiến độ thành công.
- [ ] Mọi chữ kana hiển thị đúng (không ra ô vuông), emoji hiển thị rõ.
- [ ] Nghe thử 118 file âm thanh (docs/04 mục 5).
- [ ] Bé chơi thử 15 phút có người ngồi cạnh, ghi lại chỗ bé bối rối.
