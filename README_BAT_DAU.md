# NIHONGO ADVENTURE - BỘ TÀI LIỆU TẠO APP HỌC TIẾNG NHẬT CHO BÉ

> Link githubs: https://github.com/hp0705/nihongo.git
> Tên tạm: **Nihongo Adventure - Chuyến tàu Shinkansen của Bé Mây**
> Mục tiêu: bé đọc được **bảng chữ cái tiếng Nhật** và **từ vựng cơ bản** qua các trò chơi ngắn, vui, nghe giọng Nhật chuẩn.
> Cách làm: app web tĩnh (HTML/CSS/JS), đăng trên **GitHub Pages**, **toàn bộ nội dung nằm trong file JSON** nên thêm bài mới không cần sửa code.

## 1. Gói này gồm những gì

| File / thư mục | Dùng để làm gì |
| :-- | :-- |
| `docs/01_Y_TUONG_VA_THIET_KE_GAME.md` | Ý tưởng, vòng chơi, 5 trò chơi MVP, phần thưởng, màn hình |
| `docs/02_LO_TRINH_NOI_DUNG_HOC.md` | **Nội dung phải học**: chữ, từ, bài, lộ trình mở rộng |
| `docs/03_CAU_TRUC_DU_LIEU_VA_CAP_NHAT.md` | Cấu trúc file, schema JSON, cách thêm/sửa nội dung, đăng GitHub Pages |
| `docs/04_GIONG_DOC_VA_AM_THANH.md` | Giọng đọc chuẩn Nhật: công cụ, quy trình tạo, danh sách kiểm tra |
| `docs/05_PROMPTS_CODE.md` | **Các prompt** để giao cho AI viết code, từng bước, có tiêu chí nghiệm thu |
| `data/*.json` | Dữ liệu mẫu **đã chạy kiểm tra đạt chuẩn**: 46 chữ hiragana, 43 từ, 6 bài |
| `scripts/validate_content.py` | Kiểm tra dữ liệu (đã chạy thử, đạt) |
| `scripts/gen_audio.py` | Tạo âm thanh tiếng Nhật (**chưa chạy thử**, cần mạng) |
| `.github/workflows/validate.yml` | GitHub tự kiểm tra dữ liệu mỗi lần bạn commit |

## 2. Làm theo thứ tự này

1. Tạo repo GitHub mới (ví dụ `nihongo-adventure`), chép nguyên gói này vào.
2. Chạy `python scripts/validate_content.py` để chắc dữ liệu đạt (đã đạt sẵn).
3. Tạo âm thanh: `pip install edge-tts` rồi `python scripts/gen_audio.py` (thử 5 file trước, xem `docs/04`).
4. Mở `docs/05_PROMPTS_CODE.md`, đưa **Prompt 0 + Prompt 1** cho AI viết code (Claude Code hoặc ChatGPT), làm lần lượt Prompt 2, 3... Mỗi prompt xong thì mở thử, đạt tiêu chí rồi mới sang prompt sau.
5. Bật GitHub Pages (Settings > Pages > Deploy from branch > `main` > `/root`).

## 3. Nội dung ở mức MVP (khoảng 12% mục tiêu v1.0)

| Hạng mục | MVP | Mục tiêu v1.0 |
| :-- | :-- | :-- |
| Hiragana | 20 chữ (hàng あ か さ た) | 46 cơ bản + 25 đục/bán đục + 33 âm ghép |
| Katakana | 0 | 46 + 25 + 33 |
| Từ vựng | 43 từ (chỉ dùng 20 chữ trên) | khoảng 300 từ đời sống |
| Bài học | 4 bài mới + 2 bài ôn | khoảng 60 bài |
| Trò chơi | 5 trò | 8 trò |

Tính gần đúng: (20 chữ + 43 từ) / (khoảng 208 chữ + 300 từ) ≈ 12%. Đủ để bé chơi thật vài tuần và để bạn kiểm tra app trước khi đổ thêm nội dung.

## 4. Một số điều mình đã chọn thay bạn (có thể đổi)

- **Độ tuổi bé:** mình giả định 4-7 tuổi (đọc được vài chữ, chưa đọc thạo). Nếu bé lớn hơn, báo mình để chỉnh nhịp bài và độ khó.
- **Mô hình game:** lấy cách thưởng "cấp bậc con vật + dán sticker" của app học chữ phổ biến ở Nhật, kết hợp trò truyền thống **かるた (karuta)**, **しりとり** và **スタンプラリー (sưu tầm con dấu ga tàu)**. Không dùng nhân vật hay hình của bất kỳ app nào.
- **Giọng đọc:** tạo sẵn file mp3 bằng giọng Nhật (Nanami), **không** dùng giọng đọc của trình duyệt làm giọng chính vì mỗi máy một khác.
- **Hình minh hoạ:** MVP dùng emoji; nên nhúng bộ emoji cố định (Noto/Twemoji) để mọi máy hiển thị giống nhau. Từ nào hình trừu tượng đã được đánh dấu `needs_custom_art`.
