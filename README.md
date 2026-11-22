# Nihongo Adventure - Chuyến tàu Shinkansen của Bé Mây 🚅

Web app tương tác giúp bé (4-7 tuổi) học bảng chữ cái tiếng Nhật (Hiragana) và từ vựng đời sống thông qua chuyến hành trình trên tàu Shinkansen và các trò chơi ngắn, vui vẻ, có giọng đọc chuẩn Tokyo.

## 🌟 Điểm nổi bật
- **100% Nội dung tách rời code:** Toàn bộ chữ cái, từ vựng, bài học nằm trong `data/*.json`. Thêm bài học mới không cần sửa bất kỳ dòng mã JavaScript nào.
- **5 Trò chơi tương tác đa dạng:**
  1. **Gặp chữ (`meet`):** Thẻ chữ lớn, phát âm chậm/nhanh, từ minh hoạ tô màu chữ, mini-check.
  2. **Nghe và chọn (`listen_pick`):** Nối âm thanh với mặt chữ và từ vựng theo cấp độ.
  3. **Bóng bay chữ (`bubble_pop`):** Trò chơi phản xạ, bóng trôi nổi trúng âm thanh máy đọc.
  4. **Karuta (`karuta`):** Đấu thẻ bài văn hoá Nhật Bản với Bé Mây.
  5. **Ghép từ (`word_builder`):** Xếp các viên gạch chữ cái thành từ vựng hoàn chỉnh.
- **Hệ thống phần thưởng hấp dẫn cho bé:**
  - Bậc con vật tiến hoá theo số sao: ひよこ 🐥 > こねこ 🐱 > こぐま 🐻 > ぞう 🐘 > りゅう 🐉
  - Sưu tầm 20 Sticker chủ đề Nhật Bản 🍙🍣🗻
  - Đóng dấu ga tàu Shinkansen (Tokyo, Kyoto, Nagoya, Osaka, Sapporo, Hiroshima...) 💮
  - Chuỗi ngày lên tàu 🔥
- **Thuật toán Spaced Repetition (SRS) nhẹ nhàng:** Ưu tiên ôn tập chữ bé còn yếu, không gây áp lực điểm số hay đếm ngược phạt bé.
- **Khu vực Ba Mẹ có cổng bảo vệ phép tính toán:** Xem bảng ghi nhớ từng chữ, tuỳ chỉnh Romaji/gợi ý tiếng Việt, giới hạn thời gian chơi mỗi ngày (mặc định 20 phút), sao lưu & phục hồi tiến độ qua file JSON.
- **PWA & Offline:** Cài đặt trực tiếp lên màn hình chính iPad/Android/máy tính và chạy mượt mà ngay cả khi không có mạng.

---

## 🚀 Cách chạy trên máy (Local)

Chỉ cần một trình phục vụ web tĩnh đơn giản (không cần cài framework hay build tool):

```bash
# Mở terminal tại thư mục dự án và chạy:
python -m http.server 8000
```

Sau đó mở trình duyệt và truy cập:
👉 **`http://localhost:8000`**

---

## 🛠️ Cách thêm chữ, từ vựng hoặc bài học mới

Xem hướng dẫn chi tiết tại **[docs/03_CAU_TRUC_DU_LIEU_VA_CAP_NHAT.md](file:///c:/Users/Admin/OneDrive/Desktop/nihongo-adventure/docs/03_CAU_TRUC_DU_LIEU_VA_CAP_NHAT.md)**:

1. Chỉnh sửa file trong `data/`:
   - Thêm từ vựng: `data/vocabulary_ja.json`
   - Thêm bài học: `data/lessons_ja.json`
2. Chạy lệnh tự động kiểm tra và chuẩn hoá dữ liệu:
   ```bash
   python scripts/validate_content.py --fix
   ```
3. Tạo file âm thanh tự động cho từ mới:
   ```bash
   python scripts/gen_audio.py
   ```

---

## 🧪 Kiểm thử tự động (Tests)
```bash
python scripts/validate_content.py --check-audio
python scripts/run_tests.py
```
