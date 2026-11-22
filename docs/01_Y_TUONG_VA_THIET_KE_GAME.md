# 01. Ý TƯỞNG VÀ THIẾT KẾ GAME

## 1. Học hỏi từ đâu

| Nguồn tham khảo | Điều học được (không sao chép hình/nhân vật) |
| :-- | :-- |
| **すくすくプラス** (app học chữ cho bé 2-6 tuổi ở Nhật) | 5 bậc khó, đặt tên theo con vật từ "gà con" đến "sư tử"; xong mỗi bài được chọn **sticker** sưu tầm; có khung giờ chơi cho phụ huynh |
| **ワオっち!ランド** (app mini-game cho bé 2-7 tuổi, nổi tiếng ở Nhật) | Nhiều trò nhỏ gọn, mỗi trò chơi vài phút, trẻ tự chọn trò |
| **かるた** (trò chơi thẻ truyền thống) | Nghe người đọc, nhanh tay chạm đúng thẻ: hợp với luyện nghe - nhận mặt chữ |
| **しりとり** (nối từ) | Trò chơi từ vựng ai ở Nhật cũng biết; bé thích đấu với "máy" |
| **スタンプラリー** (sưu tầm con dấu ga tàu) | Cách ghi nhận tiến độ rất Nhật, rất dễ hiểu với trẻ |

## 2. Câu chuyện và bản đồ

Bé Mây (linh vật của Thư viện Bé Mây) lên **tàu Shinkansen** đi khắp Nhật. Mỗi **ga** là một bài học. Học xong một ga, bé nhận **con dấu ga** (Tokyo, Kyoto, Osaka, Sapporo, ...). Chữ mới là "hành khách" lên tàu; từ vựng là "quà lưu niệm" của ga đó.

- Màn hình chính là **tuyến tàu nằm ngang** (kéo ngang để xem các ga). Ga đã mở sáng màu, ga chưa mở xám.
- Tiến độ nhìn thấy được: số con dấu, số sticker, **bậc con vật** của bé.
- Không có "chết", không có trừ điểm, không bị phạt thời gian. Sai thì nghe lại và thử lại.

## 3. Vòng chơi một ngày (khoảng 10 phút)

1. **Chào** (nghe lời chào tiếng Nhật, Bé Mây vẫy tay).
2. **Nhiệm vụ hôm nay**: 3 trò gợi ý, ví dụ Gặp chữ > Bóng bay chữ > Karuta.
3. Mỗi trò khoảng 8 câu. Kết thúc trò: 1-3 sao.
4. Xong nhiệm vụ: **chọn 1 sticker** (hình hộp quà mở ra) + cộng sao vào bậc con vật.
5. Hoàn thành mọi trò của một ga: **đóng dấu ga** (hiệu ứng đóng dấu, có tiếng).
6. Gợi ý nghỉ: sau 10 phút Bé Mây ngáp, hỏi "nghỉ chút nhé?" (phụ huynh chỉnh được).

## 4. Hệ thống phần thưởng

| Thành phần | Quy tắc |
| :-- | :-- |
| **Sao** | Mỗi trò 1-3 sao. 3 sao: sai tối đa 1 câu. 2 sao: sai tối đa 3. Hoàn thành: 1 sao |
| **Bậc con vật** | ひよこ (gà con) > こねこ (mèo con) > こぐま (gấu con) > ぞう (voi) > りゅう (rồng). Mốc sao nằm trong `data/game_config.json` |
| **Sticker** | 20 hình chủ đề Nhật (onigiri, sushi, cá koi, núi Phú Sĩ, ...). Mỗi nhiệm vụ nhận 1 sticker ngẫu nhiên chưa có. Có **sổ sticker** để dán |
| **Con dấu ga** | 1 con dấu mỗi ga khi hoàn thành 3 sao tối thiểu 1 trò hoặc hoàn thành đủ trò |
| **Chuỗi ngày** | "Số ngày liên tiếp lên tàu". Bỏ một ngày thì quay về 1, **không** hiện thông báo buồn |
| **Linh vật tiến hoá** | Bé Mây đổi trang phục theo bậc con vật |

## 5. Hệ thống ghi nhớ (nhẹ, bé không thấy)

Mỗi chữ/từ có "hộp" 0-3 (chọn câu hỏi ưu tiên theo hộp thấp và ôn đến hạn):
- Hộp 0 mới học. Đúng 2 lần liên tiếp thì lên hộp. Sai thì xuống 1 hộp.
- Hạn ôn theo hộp: ngay, 1 ngày, 3 ngày, 7 ngày (cấu hình trong `game_config.json`).
- Trò nào cũng lấy câu hỏi theo trọng số: **chữ yếu và chữ đến hạn ôn xuất hiện nhiều hơn**, nhưng không quá 40% câu là chữ cũ khi đang ở bài mới.

## 6. Năm trò chơi MVP

Mỗi trò có chung giao diện: nút ✖ thoát (cần chạm giữ 1 giây), thanh tiến độ câu, nút 🔊 nghe lại, hiệu ứng khen bằng tiếng Nhật (すごい!, やったー!, ...).

### 6.1 Gặp chữ (`meet`) - học chữ mới
- **Mục tiêu:** nghe, nhìn, thấy chữ gắn với một vật quen thuộc.
- **Luồng:** mỗi chữ một thẻ lớn: chữ khổng lồ, nút 🔊 (đọc chậm), hình + từ minh hoạ (`anchor_word_id`) với chữ đang học được **tô màu**, gợi ý phát âm tiếng Việt (có thể ẩn), romaji nhỏ (có thể ẩn). Bé chạm 🔊 ít nhất 1 lần mới sang chữ tiếp theo.
- **Kết:** mini-check: "Chữ nào là 'あ'?" chọn 1 trong 3.
- **Chất liệu:** 5 chữ của bài và `intro_words` của bài.

### 6.2 Nghe và chọn (`listen_pick`)
- **Mục tiêu:** nối âm với mặt chữ.
- **Luồng:** phát âm, hiện 3-4 chữ, bé chạm đúng. Cấp 2: nghe một **từ** có 2-3 chữ, chọn từ đúng trong 3-4 từ (ví dụ nghe "かさ", chọn giữa かさ / かお / あさ).
- **Chọn đáp án nhiễu:** ưu tiên chữ cùng hàng hoặc có hình giống nhau (あ/お, ぬ/め, わ/ね...), tránh 2 đáp án phát âm giống nhau.
- **Sai:** chữ sai rung nhẹ, phát lại âm đúng, chữ đúng nhấp nháy; sau 2 lần sai thì tự tô gợi ý chữ đúng.

### 6.3 Bóng bay chữ (`bubble_pop`) - trò xả stress
- **Mục tiêu:** nhận mặt chữ nhanh.
- **Luồng:** bóng bay trôi lên, mỗi quả một chữ. Máy đọc một âm, bé chạm quả bóng đúng. Chạm đúng: nổ + tiếng "pop" + sao bay. Chạm sai: quả bóng rung, không nổ.
- **Cấp độ:** chậm 4 bóng / vừa 6 bóng / nhanh 8 bóng (cấu hình trong `game_config.json`). Bóng không bao giờ "rơi mất"; hết giờ thì bóng đúng nhấp nháy và đọc lại.
- **Lưu ý code:** chạm bằng `pointerdown`, vùng chạm ≥ 72 px, dùng `requestAnimationFrame`.

### 6.4 Karuta (`karuta`) - đấu với Mây
- **Mục tiêu:** nhận ra từ qua tranh khi nghe.
- **Luồng:** 4-8 thẻ tranh (emoji/hình) + chữ nằm trên "chiếu tatami". Máy đọc một từ, bé và "Mây" (máy) tranh nhau chạm. Bé chạm đúng trước: thẻ bay vào đống của bé. Mây nhanh hơn: thẻ bay sang đống của Mây (thời gian phản ứng của Mây 3-6 giây, cấu hình được, **luôn để bé thắng nhiều hơn** vì trò dành cho học).
- **Kết:** đếm thẻ, ai nhiều hơn thắng; bé luôn nhận ít nhất 1 sao.
- **Chất liệu:** chỉ dùng từ **đọc được** (`unlock_lesson` đã tới), hiện chữ trên thẻ.

### 6.5 Ghép từ (`word_builder`)
- **Mục tiêu:** đọc/ghép từ từ từng chữ.
- **Luồng:** nghe từ + hình, dưới có các ô chữ rời (2-4 chữ đúng + 1-2 chữ nhiễu ở cấp cao). Bé kéo thả (hoặc chạm lần lượt) vào ô trống. Khi ghép đủ đúng: từ được đọc cả từ, hình nhảy múa.
- **Gợi ý:** sai 2 lần thì chữ đúng tiếp theo rung nhẹ.
- **Chất liệu:** từ có `unlock_lesson` đã tới.

## 7. Ba trò chơi giai đoạn 2 (chưa làm ở MVP, đã chừa chỗ trong code)

| Trò | Ý tưởng |
| :-- | :-- |
| `trace` Tập viết | Bé tô theo nét chữ bằng ngón tay (nét mẫu lấy từ **KanjiVG**, giấy phép CC BY-SA 3.0, nhớ ghi nguồn). Chấm theo thứ tự nét |
| `memory` Lật hình | Ghép chữ với hình hoặc với âm |
| `shiritori` しりとり | Nối từ với "Mây": từ sau bắt đầu bằng chữ cuối từ trước, cấm từ kết thúc bằng ん. Cần ≥ 60 từ |

## 8. Nguyên tắc giao diện

- Bé ≤ 7 tuổi: **ít chữ, nhiều biểu tượng, hướng dẫn bằng giọng nói**. Nhãn tiếng Việt chỉ để cho phụ huynh.
- Nút chạm ≥ 64 px, khoảng cách giữa nút ≥ 12 px. Thiết kế ưu tiên **máy tính bảng**, vẫn dùng tốt trên điện thoại (dọc/ngang).
- Chữ kana dùng phông có nét rõ, in tròn (ví dụ **Zen Maru Gothic** hoặc **M PLUS Rounded 1c** trên Google Fonts; nhớ tải về nhúng vào repo để chạy offline).
- Màu sáng, tương phản cao, một màu nhấn cho mỗi ga.
- Chữ kana **tuyệt đối không bị cắt, kéo giãn hay xoay**.
- Âm thanh: nhạc nền rất nhẹ (tắt được), tiếng pop/ding ngắn, giọng khen tiếng Nhật.
- Vùng phụ huynh: khoá bằng **câu hỏi toán** ("7 + 5 = ?") chứ không phải số PIN.

## 9. Bản đồ màn hình

1. **Màn khởi động:** nút to "はじめよう!" (cần chạm 1 lần để mở âm thanh trên iPad/iPhone).
2. **Bản đồ tàu (home):** tuyến ga, nút "Nhiệm vụ hôm nay", biểu tượng sổ sticker, bậc con vật, vùng phụ huynh (góc, nhỏ).
3. **Trang ga (lesson hub):** các trò của bài; trò đã xong hiện sao.
4. **Màn chơi** (5 trò) và **màn kết quả** (sao + sticker/con dấu).
5. **Sổ sticker.**
6. **Vùng phụ huynh:** tiến độ từng chữ/từ (hộp 0-3), giới hạn thời gian, bật/tắt romaji và gợi ý tiếng Việt, tốc độ âm thanh, xuất/nhập tiến độ (file JSON), xoá dữ liệu, phiên bản nội dung.

## 10. Danh sách kiểm tra "game có vui chưa?" (dùng khi bé chơi thử)

- Bé có tự mở app lần sau không?
- Bé có chơi thêm khi hết nhiệm vụ không?
- Bé có đòi sticker/con dấu không?
- Có câu nào bé khóc hoặc bực không? (sai hoài một chữ thì giảm độ khó, thêm gợi ý)
- Một lượt chơi có dưới 10 phút không?
