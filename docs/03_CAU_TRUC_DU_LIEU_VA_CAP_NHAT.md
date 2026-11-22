# 03. CẤU TRÚC DỮ LIỆU VÀ CÁCH CẬP NHẬT

Nguyên tắc: **code không chứa nội dung học.** Mọi chữ, từ, bài, cấu hình game nằm trong `data/*.json`. Thêm nội dung = sửa JSON + thêm file âm thanh + chạy kiểm tra.

## 1. Cây thư mục repo

```
nihongo-adventure/
├─ index.html                 # trang duy nhất (SPA)
├─ manifest.webmanifest       # cài app lên màn hình chính (PWA)
├─ sw.js                      # service worker: chạy offline
├─ css/            style.css
├─ js/
│  ├─ main.js                 # khởi động, điều hướng màn hình
│  ├─ core/  data.js audio.js progress.js srs.js ui.js rng.js
│  ├─ games/ meet.js listen_pick.js bubble_pop.js karuta.js word_builder.js
│  └─ screens/ home.js station.js result.js stickers.js parent.js
├─ data/                      # NỘI DUNG (file bạn sửa nhiều nhất)
│  ├─ kana_hiragana.json
│  ├─ vocabulary_ja.json
│  ├─ lessons_ja.json
│  ├─ game_config.json
│  └─ ui_voice.json
├─ assets/
│  ├─ audio/ja/{kana,words,ui,sfx}/*.mp3
│  ├─ fonts/  emoji/  images/
├─ scripts/ validate_content.py  gen_audio.py
├─ docs/
└─ .github/workflows/validate.yml
```

## 2. Các file dữ liệu

### 2.1 `kana_hiragana.json`
| Trường | Ý nghĩa |
| :-- | :-- |
| `id` | `h_` + romaji (ví dụ `h_shi`). Không đổi sau khi đã dùng (tiến độ của bé lưu theo id) |
| `char` | Chữ (có thể 2 ký tự cho âm ghép, ví dụ `きゃ`) |
| `romaji` | Hepburn ASCII. Validator tự kiểm tra đúng/sai |
| `row`, `stroke_count`, `vi_hint` | Hàng, số nét, gợi ý đọc cho phụ huynh |
| `anchor_word_id` | Từ minh hoạ (xem tài liệu 02) |
| `audio.normal` | Đường dẫn mp3 |
| `lesson` | **Tự tính** bởi `validate_content.py --fix` |
| `phase` | Chỉ để tham khảo |

Chữ chỉ được dạy khi xuất hiện trong `kana` của một bài loại `new` ở `lessons_ja.json`.

### 2.2 `vocabulary_ja.json`
| Trường | Ý nghĩa |
| :-- | :-- |
| `id` | `w_` + romaji |
| `word` | Viết bằng hiragana (MVP chỉ hiragana) |
| `kanji` | Để trống nếu không có; chỉ hiện ở vùng phụ huynh |
| `romaji` | ASCII, **duy nhất** (là tên file âm thanh). Âm dài viết lặp: `ookii`, `oishii` |
| `vi`, `emoji`, `category` | Nghĩa, hình, nhóm chủ đề |
| `needs_custom_art` | `true` nếu hình emoji khó hiểu, cần tranh riêng |
| `accent` | Trọng âm (số, ví dụ `0`, `1`); để `null` đến khi kiểm tra bằng từ điển NHK/OJAD |
| `tts_text` | Nếu cần ép cách đọc khác với `word` |
| `audio.normal`, `audio.slow` | Hai tốc độ |
| `kana_ids`, `unlock_lesson` | **Tự tính** bởi `--fix` |

### 2.3 `lessons_ja.json`
```json
{ "id": "L5", "order": 7, "type": "new", "title_vi": "Ga Fukuoka: hàng NA",
  "station": {"name": "Fukuoka", "emoji": "🍜"},
  "kana": ["h_na","h_ni","h_nu","h_ne","h_no"],
  "intro_words": ["w_nami","w_nezumi"],
  "games": ["meet","listen_pick","bubble_pop","karuta","word_builder"] }
```
- `type`: `new` (có `kana`, `intro_words`) hoặc `review` (có `review_of`).
- `order` quyết định thứ tự học. Muốn đổi thứ tự bài: đổi `order`.
- `games` dùng id có sẵn: `meet`, `listen_pick`, `bubble_pop`, `karuta`, `word_builder`, và giai đoạn 2: `memory`, `trace`, `shiritori`.

### 2.4 `game_config.json`
Bậc con vật và số sao, quy tắc sao, hộp ghi nhớ, danh sách sticker, tham số từng trò, mặc định vùng phụ huynh.

### 2.5 `ui_voice.json`
Lời khen/chào tiếng Nhật chỉ để nghe.

## 3. Quy ước đặt tên

- id: chữ thường, ASCII, không dấu cách: `h_shi`, `w_ashi`, `L3`.
- File âm thanh: `assets/audio/ja/kana/{romaji}.mp3`, `.../words/{romaji}.mp3`, `{romaji}_slow.mp3`, `.../ui/{id}.mp3`.
- Romaji ASCII, **không dùng dấu macron** (ā, ū): viết `aa`, `uu`, `ou`.

## 4. Quy trình thêm nội dung

### 4.1 Thêm một từ
1. Chắc chắn mọi chữ của từ đã có trong `kana_hiragana.json`.
2. Thêm khối vào `vocabulary_ja.json` (copy một từ mẫu rồi sửa).
3. `python scripts/validate_content.py --fix` (kiểm tra romaji + tự tính `unlock_lesson`).
4. `python scripts/gen_audio.py` (chỉ tạo file còn thiếu).
5. Nghe thử file mới, commit.

### 4.2 Thêm một bài mới (ví dụ hàng な)
1. Kiểm tra 5 chữ của hàng có trong `kana_hiragana.json` (46 chữ đã có sẵn).
2. Thêm 8-12 từ mới dùng chữ đã học tới bài này (mỗi chữ mới nên có 1 từ minh hoạ, đặt `anchor_word_id`).
3. Thêm mục bài vào `lessons_ja.json`; thêm bài ôn sau mỗi 2 bài.
4. `--fix`, `gen_audio.py`, nghe thử, commit.

### 4.3 Thêm bộ chữ mới (đục/bán đục, âm ghép, katakana)
- Thêm các mục chữ mới vào `kana_hiragana.json` (hoặc file mới `kana_katakana.json`, khi đó sửa `data.js` để nạp thêm). Âm ghép: `char` gồm 2 ký tự (`きゃ`), validator tự ghép chữ dài nhất khi tách từ.
- `っ` và `ー` cũng là một mục chữ.
- Validator đã biết đổi romaji cho hiragana đục/bán đục và âm ghép. **Katakana cần thêm bảng đổi** trong `validate_content.py` (hàm `to_romaji`).

### 4.4 Sửa hoặc xoá
- **Sửa từ:** sửa `vi`, `emoji`, ... thoải mái. Nếu đổi `word` hay `romaji`: sẽ đổi tên file âm thanh, chạy lại `gen_audio.py`.
- **Xoá từ:** xoá khỏi JSON. Tiến độ cũ của từ đó trong máy bé bị bỏ qua, không làm hỏng app.
- **Không đổi `id`** đã dùng; nếu bắt buộc, thêm id mới và xoá id cũ.

## 5. Phiên bản và cập nhật cho máy của bé

- Mỗi file JSON có `version`. Khi thêm nội dung, tăng số phiên bản (0.1.0 > 0.2.0).
- App nạp JSON kèm `?v=<version>` và service worker dùng chiến lược "mạng trước, cache sau" cho `data/`, "cache trước" cho `assets/`. Nhờ vậy mở app khi có mạng sẽ tự cập nhật nội dung, khi không có mạng vẫn chơi được.
- Vùng phụ huynh hiện **phiên bản nội dung** và nút "Kiểm tra cập nhật".
- Chỉnh `CACHE_VERSION` trong `sw.js` mỗi khi đổi file trong `assets/` hoặc `js/`.

## 6. Lưu tiến độ (trong máy)

`localStorage` khoá `nihongo_adventure_progress_v1`:
```json
{ "schema": 1, "content_version": "0.1.0",
  "profile": {"name": "", "avatar": "🐥"},
  "stats": {"stars": 0, "sessions": 0, "streak": 0, "last_play": "2026-11-22"},
  "kana":  {"h_a": {"box": 0, "streak": 0, "correct": 0, "wrong": 0, "due": "2026-11-22"}},
  "words": {"w_ashi": {"box": 0, "streak": 0, "correct": 0, "wrong": 0, "due": "2026-11-22"}},
  "lessons": {"L1": {"best_stars": {"meet": 3}, "stamp": true}},
  "stickers": ["🍙"], "settings": {"romaji": true, "vi_hint": true, "audio_speed": "normal", "daily_limit_min": 20, "music": true} }
```
- Vùng phụ huynh có **Xuất / Nhập tiến độ** (file JSON) vì `localStorage` bị xoá khi xoá dữ liệu trình duyệt hoặc đổi máy.
- Khi `schema` đổi, viết hàm `migrate()` (xem Prompt 5).

## 7. Kiểm tra tự động (CI)

`.github/workflows/validate.yml` chạy `python scripts/validate_content.py` mỗi lần `push`. Nếu lỗi, GitHub báo dấu ❌ ngay trên commit.

Validator kiểm tra: id trùng, romaji sai hoặc trùng, từ dùng chữ chưa có trong bảng, từ chưa mở khoá ở bài nào, bài tham chiếu sai, từ minh hoạ thiếu, thứ tự bậc sao, và (với `--check-audio`) file âm thanh thiếu.

## 8. Đăng lên GitHub Pages

1. Đẩy code lên nhánh `main`.
2. Settings > Pages > Source: **Deploy from a branch** > `main` / `/ (root)`.
3. Sau 1-2 phút app chạy ở `https://<tên-bạn>.github.io/nihongo-adventure/`.
4. Mọi đường dẫn trong code dùng **đường dẫn tương đối** (`./data/...`), không dùng `/data/...`, vì Pages chạy trong thư mục con.
5. Trên iPad: Safari > Chia sẻ > "Thêm vào Màn hình chính" để chạy toàn màn hình.

## 9. Giấy phép nguồn bên ngoài (nhớ ghi trong `docs/CREDITS.md`)

| Thứ dùng | Lưu ý |
| :-- | :-- |
| KanjiVG (nét chữ) | CC BY-SA 3.0, phải ghi nguồn và giữ cùng giấy phép cho phần phái sinh |
| Noto Color Emoji / Twemoji (emoji cố định) | Noto: Apache 2.0; Twemoji: CC-BY 4.0 (ghi nguồn) |
| Zen Maru Gothic, M PLUS Rounded 1c | SIL OFL 1.1 |
| Âm thanh sfx | Chỉ dùng nguồn CC0 hoặc tự tạo |
| Giọng đọc TTS | Xem tài liệu 04 |
