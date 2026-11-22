# 04. GIỌNG ĐỌC CHUẨN TIẾNG NHẬT VÀ ÂM THANH

## 1. Yêu cầu

- Giọng **Nhật chuẩn (Tokyo)**, rõ, tốc độ vừa, hơi dịu cho trẻ nhỏ.
- **Cùng một giọng** cho mọi chữ, từ, lời khen (đổi giọng giữa chừng làm bé bối rối).
- Mọi máy phát ra giống nhau → **dùng file mp3 tạo sẵn**, không phụ thuộc giọng của trình duyệt.
- Dễ cập nhật: thêm từ thì chạy 1 lệnh tạo âm thanh.

## 2. Các lựa chọn tạo giọng

| Cách | Ưu | Nhược | Gợi ý |
| :-- | :-- | :-- | :-- |
| **edge-tts** (giọng `ja-JP-NanamiNeural` nữ, `ja-JP-KeitaNeural` nam) | Miễn phí, không cần khoá, tự nhiên, dùng được ngay trong `scripts/gen_audio.py` | Là cách dùng không chính thức dịch vụ của Microsoft; điều khoản dùng thương mại không rõ, có thể thay đổi | **Mặc định cho bản dùng riêng/gia đình** |
| **Azure Speech** (cùng họ giọng Nanami) | Chính thức, SSML chỉnh phát âm và nhịp, có điều khoản rõ | Cần tài khoản, có hạn mức miễn phí, phải tự kiểm tra giá | Dùng khi muốn công khai/ổn định lâu dài |
| **Google Cloud TTS** (giọng `ja-JP` Neural2/Wavenet) | Chính thức, SSML | Cần tài khoản | Tương đương Azure |
| **Amazon Polly** (giọng tiếng Nhật) | Chính thức | Cần tài khoản | Tương đương |
| **VOICEVOX** (phần mềm miễn phí) | Giọng tiếng Nhật tự nhiên, chạy trên máy bạn | Mỗi nhân vật có điều khoản riêng, thường phải ghi tên giọng; chất giọng "anime" | Đọc kỹ điều khoản từng nhân vật |
| **Thu giọng người Nhật bản ngữ** | Tốt nhất về trọng âm và cảm xúc | Tốn công, cần phòng thu yên tĩnh, danh sách 118+ file | Dùng cho bản hoàn thiện, hoặc nhờ bạn/giáo viên Nhật thu |
| Giọng trình duyệt (Web Speech `ja-JP`) | Không cần file | Mỗi máy một giọng, có máy không có giọng Nhật | **Chỉ làm dự phòng khi thiếu file**, hiện cảnh báo |

Mình chưa kiểm tra lại điều khoản mới nhất của từng dịch vụ; hãy đọc trang chính thức trước khi đăng công khai hoặc bán.

## 3. Quy trình khuyến nghị

1. Chạy thử 5 mục: `python scripts/gen_audio.py --only a shi tsu ashi koe`.
2. **Nghe từng file** (checklist ở mục 5).
3. Mục nào đọc sai: đặt `tts_text` trong JSON để ép cách đọc (ví dụ viết thêm "、", đổi thành kana khác), rồi `--only <romaji> --force`.
4. Khi ổn, chạy toàn bộ: `python scripts/gen_audio.py`.
5. Nhờ **một người Nhật** (hoặc người giỏi tiếng Nhật) nghe 118 file, ghi lại file nào chưa tự nhiên. Điền `accent` (trọng âm) cho từ vựng khi kiểm tra bằng từ điển trọng âm NHK hoặc công cụ OJAD.
6. Commit mp3 vào repo (118 file mỗi cái 5-30 KB, tổng vài MB là chấp nhận được).

## 4. Điểm dễ sai của TTS tiếng Nhật

| Trường hợp | Rủi ro | Cách xử lý |
| :-- | :-- | :-- |
| Chữ đơn (あ, き, て) | Giọng đọc có thể đọc như chữ Hán hoặc kéo dài/ngắt lạ | Script thêm "、" sau chữ; nghe kỹ; dùng `tts_text` khi cần |
| Từ một chữ: き (木), て (手) | Trọng âm khác khi đứng một mình | Nghe thử, cân nhắc đọc kèm trợ từ khi ghi âm người thật |
| Từ đồng âm (こい: 鯉/恋, かさ: 傘/笠, はし) | Nghe gần như nhau, trọng âm khác | Chọn nghĩa có hình rõ nhất, ghi `note_vi`, kiểm tra trọng âm |
| Trợ từ は へ を | Đọc theo chữ hay theo âm | Dạy ở P5, dùng `tts_text` viết lại (わ, え, お) |
| Âm dài おおきい, おう | Kéo thiếu | Kiểm tra bằng tai: phải dài gấp đôi |
| ん | Nghe thành "n/m/ng" tuỳ chữ sau | Đọc cả từ để nghe tự nhiên |
| Tốc độ chậm | Bản "chậm" (-30%) có thể méo | Nghe lại bản `_slow` |

## 5. Danh sách kiểm tra mỗi file âm thanh

- [ ] Đúng chữ/từ, không có tiếng thừa đầu/cuối.
- [ ] Không bị cắt cụt ở cuối.
- [ ] Âm lượng gần bằng nhau giữa các file.
- [ ] Phát âm tự nhiên với người Nhật (nếu có thể hỏi).
- [ ] Bản `_slow` rõ nhưng không "robot".
- [ ] Từ đồng âm: trọng âm đúng nghĩa đang dạy.

## 6. Thông số file

- mp3, mono, 24-48 kHz, 48-96 kbps.
- Thời lượng: chữ 0,5-1 giây, từ 1-2 giây.
- Có thể chuẩn hoá âm lượng bằng `ffmpeg -af loudnorm` (tuỳ chọn).
- Tên file ASCII, chữ thường (xem tài liệu 03).

## 7. Âm thanh trên trình duyệt di động (rất quan trọng)

- **iPhone/iPad chặn phát âm thanh** cho đến khi có một lần **chạm của người dùng**. Vì vậy có màn "はじめよう!" ban đầu: chạm 1 lần để mở khoá `AudioContext` / phát một file im lặng.
- Nạp trước (preload) file của bài đang chơi, tránh trễ khi bé chạm.
- Dùng một đối tượng `Audio` chung hoặc `AudioContext` + `decodeAudioData` cho file ngắn để phát tức thì, nhiều tiếng chồng nhau được.
- Khi thiếu file mp3: ghi cảnh báo ra console và (tuỳ chọn trong vùng phụ huynh) dùng Web Speech `ja-JP` làm dự phòng.
- Hai tốc độ: bản `normal` cho trò chơi, bản `slow` khi bé chạm nút "nghe chậm" hoặc ở màn Gặp chữ.

## 8. Âm thanh hiệu ứng (sfx)

Cần khoảng 10 tiếng: chạm, đúng, sai nhẹ, pop, ding sao, đóng dấu, mở hộp sticker, chuông tàu, nhạc nền ngắn, bước chân. Dùng nguồn **CC0** hoặc tự tạo; ghi nguồn trong `docs/CREDITS.md`.

## 9. Danh sách file âm thanh MVP

| Nhóm | Số file | Ghi chú |
| :-- | :-- | :-- |
| Chữ (kana) | 20 | `kana/<romaji>.mp3` |
| Từ (normal + slow) | 43 x 2 = 86 | `words/<romaji>.mp3`, `<romaji>_slow.mp3` |
| Lời khen / chào | 12 | `ui/<id>.mp3` |
| **Tổng** | **118** | `gen_audio.py` tự lập kế hoạch đúng 118 file |
