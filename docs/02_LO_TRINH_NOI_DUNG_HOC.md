# 02. LỘ TRÌNH NỘI DUNG HỌC

## 1. Nguyên tắc dạy

1. **Âm trước, chữ sau:** bé nghe và nói trước, rồi mới nhận mặt chữ.
2. **Mỗi bài một hàng (5 chữ).** Với bé nhỏ, 5 chữ/ngày là đủ; mỗi hai bài có một bài **ôn**.
3. **Chữ gắn với vật quen:** mỗi chữ có một **từ minh hoạ** (`anchor`), giống bảng あいうえお trong sách mẫu giáo Nhật. Từ minh hoạ chỉ cần **nghe + nhìn hình** (có thể chứa chữ chưa học).
4. **Chỉ cho bé đọc những gì bé đã học (từ "đọc được"):** trò ghép từ, karuta, nghe và chọn từ chỉ dùng từ có **mọi chữ đã học**. Nhờ vậy bé luôn đọc được thật, có cảm giác thắng. App tự tính điều này (trường `unlock_lesson`).
5. **Ôn rải rác:** chữ yếu được hỏi lại nhiều hơn, chữ cũ quay lại theo ngày 1-3-7.
6. **Ngắn và vui:** mỗi ngày khoảng 10 phút. Không "học thuộc cho đủ".

## 2. Phạm vi mục tiêu v1.0 và MVP

| Hạng mục | Mục tiêu v1.0 | MVP (đợt này) |
| :-- | :-- | :-- |
| Hiragana cơ bản (gojūon) | 46 | **20** (あ か さ た) |
| Hiragana đục/bán đục (が ぱ ...) | 25 | 0 |
| Hiragana âm ghép (きゃ ...) + っ + ー | 33 + 2 | 0 |
| Katakana | 46 + 25 + 33 | 0 |
| Từ vựng cơ bản đời sống | khoảng 300 | **43** |
| Câu chào, mẫu câu đơn giản | khoảng 30 | 12 lời khen/chào (chỉ nghe) |

## 3. 20 chữ MVP

Gợi ý phát âm tiếng Việt chỉ là **ước lượng**; chuẩn nhất là nghe giọng Nhật.

| Chữ | Romaji | Gợi ý phát âm | Số nét | Từ minh hoạ |
| :-- | :-- | :-- | :-- | :-- |
| あ | a | a như "a" tiếng Việt | 3 | あし 🦶 (cái chân) |
| い | i | i như "i" | 2 | いか 🦑 (con mực ống) |
| う | u | u nhưng môi dẹt, không chu tròn | 2 | うし 🐄 (con bò) |
| え | e | ê | 2 | えき 🚉 (nhà ga) |
| お | o | ô | 3 | おかし 🍬 (bánh kẹo) |
| か | ka | ka như "ca" | 3 | かさ ☂️ (cái ô) |
| き | ki | ki như "ki" | 4 | き 🌳 (cái cây) |
| く | ku | ku như "cu", môi dẹt | 1 | くつ 👟 (giày) |
| け | ke | kê | 3 | けいと 🧶 (len (sợi len)) |
| こ | ko | kô như "cô" | 2 | こい 🎏 (cá chép koi) |
| さ | sa | sa | 3 | さい 🦏 (con tê giác) |
| し | shi | shi: âm giữa "xi" và "si", lưỡi hơi lùi | 1 | しか 🦌 (con hươu) |
| す | su | su, môi dẹt | 2 | すいか 🍉 (dưa hấu) |
| せ | se | sê | 3 | せかい 🌏 (thế giới) |
| そ | so | sô | 1 | そと 🚪 (bên ngoài) |
| た | ta | ta | 4 | たこ 🐙 (bạch tuộc) |
| ち | chi | chi như "chi" | 2 | ちち 👨 (bố (của mình)) |
| つ | tsu | tsu: "t" + "su", môi dẹt, không đọc "tu" | 1 | つき 🌙 (mặt trăng) |
| て | te | tê | 1 | て ✋ (bàn tay) |
| と | to | tô | 2 | とけい ⏰ (đồng hồ) |

Số nét kiểm tra lại bằng KanjiVG khi làm trò tập viết.

## 4. Bài học MVP

| Bài | Tên | Chữ | Trò chơi |
| :-- | :-- | :-- | :-- |
| L1 | Ga Tokyo: hàng A | あ い う え お | meet, listen_pick, bubble_pop, word_builder |
| L2 | Ga Kyoto: hàng KA | か き く け こ | meet, listen_pick, bubble_pop, karuta, word_builder |
| R1 | Ga Nagoya: ôn tập | ôn L1, L2 | listen_pick, bubble_pop, karuta, word_builder |
| L3 | Ga Osaka: hàng SA | さ し す せ そ | meet, listen_pick, bubble_pop, karuta, word_builder |
| L4 | Ga Sapporo: hàng TA | た ち つ て と | meet, listen_pick, bubble_pop, karuta, word_builder |
| R2 | Ga Hiroshima: ôn tập lớn | ôn L1, L2, L3, L4 | listen_pick, bubble_pop, karuta, word_builder |

Số từ **đọc được** tích luỹ: sau L1 có 5 từ, sau L2 có 13 từ, sau L3 có 29 từ, sau L4 có 43 từ. Bài L1 chỉ có 5 từ nên không có karuta (cần ≥ 6 từ).

## 5. 43 từ vựng MVP

Tất cả chỉ dùng 20 chữ trên. Cột "Mở ở bài" là bài đầu tiên bé đọc được từ đó. Cột "Cần tranh riêng" là từ trừu tượng, emoji khó hiểu: nên vẽ/thuê tranh hoặc thay từ (xem bài học từ app Việt Nhật Adventure).

| Từ | Kanji | Romaji | Nghĩa | Hình | Mở ở bài | Cần tranh riêng |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| あい | 愛 | ai | tình yêu | 💕 | L1 | có |
| あお | 青 | ao | màu xanh dương | 🔵 | L1 |  |
| いえ | 家 | ie | ngôi nhà | 🏠 | L1 |  |
| いいえ | - | iie | không (trả lời) | 🙅 | L1 | có |
| うえ | 上 | ue | phía trên | ⬆️ | L1 | có |
| あか | 赤 | aka | màu đỏ | 🔴 | L2 |  |
| えき | 駅 | eki | nhà ga | 🚉 | L2 |  |
| いか | 烏賊 | ika | con mực ống | 🦑 | L2 |  |
| いけ | 池 | ike | cái ao | 🏞️ | L2 |  |
| かお | 顔 | kao | khuôn mặt | 🙂 | L2 |  |
| き | 木 | ki | cái cây | 🌳 | L2 |  |
| こえ | 声 | koe | giọng nói | 🗣️ | L2 | có |
| こい | 鯉 | koi | cá chép koi | 🎏 | L2 | có |
| あさ | 朝 | asa | buổi sáng | 🌅 | L3 | có |
| あし | 足 | ashi | cái chân | 🦶 | L3 |  |
| いす | 椅子 | isu | cái ghế | 🪑 | L3 |  |
| かさ | 傘 | kasa | cái ô | ☂️ | L3 |  |
| くさ | 草 | kusa | cỏ | 🌱 | L3 |  |
| おいしい | 美味しい | oishii | ngon | 😋 | L3 |  |
| おかし | お菓子 | okashi | bánh kẹo | 🍬 | L3 |  |
| さい | 犀 | sai | con tê giác | 🦏 | L3 |  |
| せかい | 世界 | sekai | thế giới | 🌏 | L3 |  |
| しか | 鹿 | shika | con hươu | 🦌 | L3 |  |
| しかく | 四角 | shikaku | hình vuông | 🟦 | L3 |  |
| しお | 塩 | shio | muối | 🧂 | L3 |  |
| すいか | 西瓜 | suika | dưa hấu | 🍉 | L3 |  |
| すき | 好き | suki | thích | ❤️ | L3 | có |
| すし | 寿司 | sushi | sushi | 🍣 | L3 |  |
| うし | 牛 | ushi | con bò | 🐄 | L3 |  |
| あした | 明日 | ashita | ngày mai | 📅 | L4 | có |
| ちち | 父 | chichi | bố (của mình) | 👨 | L4 | có |
| けいと | 毛糸 | keito | len (sợi len) | 🧶 | L4 |  |
| くち | 口 | kuchi | cái miệng | 👄 | L4 |  |
| くつ | 靴 | kutsu | giày | 👟 | L4 |  |
| した | 下 | shita | phía dưới | ⬇️ | L4 | có |
| そと | 外 | soto | bên ngoài | 🚪 | L4 | có |
| たいこ | 太鼓 | taiko | cái trống taiko | 🥁 | L4 |  |
| たけ | 竹 | take | cây tre | 🎋 | L4 |  |
| たこ | 蛸 | tako | bạch tuộc | 🐙 | L4 |  |
| て | 手 | te | bàn tay | ✋ | L4 |  |
| とけい | 時計 | tokei | đồng hồ | ⏰ | L4 |  |
| つき | 月 | tsuki | mặt trăng | 🌙 | L4 |  |
| うた | 歌 | uta | bài hát | 🎵 | L4 |  |

## 6. Lộ trình mở rộng sau MVP

| Giai đoạn | Nội dung | Số chữ | Số từ gợi ý | Trò mới |
| :-- | :-- | :-- | :-- | :-- |
| P2 | Hiragana hàng な は ま や ら わ + ん (6 bài + 3 ôn) | +26 | +60 | trace, memory |
| P3 | Dakuten/handakuten: が ざ だ ば ぱ | +25 | +40 | shiritori |
| P4 | Âm ghép (きゃ しゃ ちゃ ...), っ nhỏ, âm dài ー/おう | +35 | +40 | |
| P5 | Trợ từ cơ bản は を へ, 20 mẫu câu (おはよう, ありがとう, これは ...) | 0 | 30 câu | nghe câu - chọn tranh |
| P6 | **Katakana** (bắt đầu bằng 46 chữ, từ mượn: ジュース, パン, テレビ) | +46 | +60 | |
| P7 | Từ theo chủ đề: số 1-10, màu, gia đình, đồ ăn, con vật, cơ thể, trường học, ngày/tháng | 0 | +100 | |

Mỗi giai đoạn chỉ cần: (1) thêm chữ/từ/bài vào JSON, (2) tạo âm thanh, (3) chạy kiểm tra. Xem tài liệu 03.

## 7. Những chỗ bé Việt hay nhầm (nhắc phụ huynh)

- **し (shi), ち (chi), つ (tsu), ふ (fu):** không đọc "si, ti, tu, hu".
- **う, す, く, つ:** môi dẹt, không chu tròn như "u" tiếng Việt.
- **Hàng ら (ra ri ru re ro):** âm giữa r và l, lưỡi chạm nhẹ.
- **Âm dài:** おおきい (ookii), おう (ou) đọc kéo dài gấp đôi. Chữ "っ" nhỏ là một nhịp ngắt.
- **Trọng âm cao thấp** (pitch accent): ví dụ はし (đũa) và はし (cầu) khác nhau. Chỉ nghe giọng chuẩn nhiều, đừng ép bé giải thích.
- **は làm trợ từ đọc "wa", へ đọc "e", を đọc "o"** (dạy ở giai đoạn P5).

## 8. Mẹo cho phụ huynh

- 10 phút/ngày đều hơn 1 giờ/tuần.
- Chơi cùng bé 2-3 ngày đầu, bé đọc to theo máy.
- Khen quá trình ("con nghe kỹ quá!"), không khen riêng kết quả.
- Mỗi tuần gõ vào tiến độ trong vùng phụ huynh: chữ nào còn ở hộp 0 thì chơi lại.
