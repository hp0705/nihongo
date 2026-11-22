#!/usr/bin/env python3
"""
scripts/validate_content.py  -  Kiểm tra (và tự tính) dữ liệu học của app Nihongo Adventure.

Cách dùng (chạy ở thư mục gốc repo):
    python scripts/validate_content.py              # chỉ kiểm tra
    python scripts/validate_content.py --fix        # kiểm tra + ghi các trường tự tính (kana_ids, unlock_lesson, lesson của chữ)
    python scripts/validate_content.py --check-audio  # kiểm tra thêm: file âm thanh có tồn tại không

Thoát với mã 1 nếu có LỖI (cảnh báo không làm fail), để GitHub Actions chặn commit sai.
"""
import json, os, sys, re

D = 'data'
def load(name):
    with open(os.path.join(D, name), encoding='utf-8') as f:
        return json.load(f)
def save(name, obj):
    with open(os.path.join(D, name), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2); f.write('\n')

# ---- Bộ đổi hiragana -> romaji Hepburn (ASCII, âm dài viết lặp: おおきい = ookii) ----
BASE = {'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
 'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
 'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
 'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
 'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n',
 'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
 'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
 'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po'}
YOON = {'ゃ':'a','ゅ':'u','ょ':'o'}
def to_romaji(s):
    out=[]; i=0; sokuon=False
    while i < len(s):
        c = s[i]
        if c == 'っ': sokuon=True; i+=1; continue
        if c == 'ー': out.append(out[-1][-1] if out else ''); i+=1; continue
        if c not in BASE: return None
        r = BASE[c]
        if i+1 < len(s) and s[i+1] in YOON:
            y = YOON[s[i+1]]
            if r in ('shi','chi','ji'): r = r[:-1] + y
            else: r = r[:-1] + 'y' + y
            i += 1
        if sokuon:
            r = ('t' if r.startswith('ch') else r[0]) + r; sokuon=False
        out.append(r); i+=1
    return ''.join(out)

errors, warnings = [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)

def main():
    fix = '--fix' in sys.argv
    check_audio = '--check-audio' in sys.argv
    kana_d, vocab_d, les_d, cfg, ui = (load(n) for n in
        ('kana_hiragana.json','vocabulary_ja.json','lessons_ja.json','game_config.json','ui_voice.json'))
    kana, words, lessons = kana_d['kana'], vocab_d['words'], les_d['lessons']

    # 1. Chữ cái
    kid = {}
    for k in kana:
        if k['id'] in kid: err(f"[kana] trùng id {k['id']}")
        kid[k['id']] = k
        exp = to_romaji(k['char'])
        if exp is None: err(f"[kana] {k['id']}: ký tự '{k['char']}' chưa có trong bảng đổi romaji (validate_content.py)")
        elif exp != k['romaji']: err(f"[kana] {k['char']}: romaji ghi '{k['romaji']}' nhưng quy tắc cho '{exp}'")
        if not isinstance(k.get('stroke_count'), int): err(f"[kana] {k['id']} thiếu stroke_count")
    by_char = {k['char']: k for k in kana}
    maxlen = max(len(c) for c in by_char)

    def decompose(text):
        """Tách từ thành danh sách id chữ (ưu tiên ghép dài nhất, ví dụ きゃ)."""
        ids=[]; i=0
        while i < len(text):
            for n in range(maxlen, 0, -1):
                seg = text[i:i+n]
                if seg in by_char: ids.append(by_char[seg]['id']); i+=n; break
            else: return None, text[i]
        return ids, None

    # 2. Bài học
    lid = {}; learned_at = {}   # kana id -> thứ tự bài mà chữ được học
    for l in sorted(lessons, key=lambda x: x['order']):
        if l['id'] in lid: err(f"[bài] trùng id {l['id']}")
        lid[l['id']] = l
    orders = [l['order'] for l in lessons]
    if len(orders) != len(set(orders)): err("[bài] có 'order' bị trùng")
    for l in sorted(lessons, key=lambda x: x['order']):
        if l['type'] == 'new':
            for k in l['kana']:
                if k not in kid: err(f"[bài {l['id']}] chữ '{k}' không có trong kana_hiragana.json")
                elif k in learned_at: err(f"[bài {l['id']}] chữ {kid[k]['char']} đã học ở bài khác")
                else: learned_at[k] = l['order']
            if len(l['kana']) > 6: warn(f"[bài {l['id']}] {len(l['kana'])} chữ/bài hơi nhiều cho bé (nên ≤ 5)")
        elif l['type'] == 'review':
            for r in l['review_of']:
                if r not in lid: err(f"[bài {l['id']}] review_of '{r}' không tồn tại")
        for g in l.get('games', []):
            if g not in ('meet','listen_pick','bubble_pop','karuta','word_builder','memory','trace','shiritori'):
                err(f"[bài {l['id']}] trò chơi lạ '{g}'")

    # 3. Từ vựng
    wid, roma = {}, {}
    for w in words:
        if w['id'] in wid: err(f"[từ] trùng id {w['id']}")
        wid[w['id']] = w
        if w['romaji'] in roma: err(f"[từ] trùng romaji '{w['romaji']}' ({w['word']} / {roma[w['romaji']]}): tên file âm thanh sẽ đè nhau")
        roma[w['romaji']] = w['word']
        exp = to_romaji(w['word'])
        if exp is None: err(f"[từ] {w['word']}: chứa ký tự chưa hỗ trợ (chỉ hiragana)")
        elif exp != w['romaji']: err(f"[từ] {w['word']}: romaji ghi '{w['romaji']}' nhưng quy tắc cho '{exp}'")
        for f in ('vi','emoji','category'):
            if not w.get(f): err(f"[từ] {w['word']} thiếu '{f}'")
        ids, bad = decompose(w['word'])
        if ids is None:
            err(f"[từ] {w['word']}: chữ '{bad}' chưa có trong kana_hiragana.json"); continue
        w['kana_ids'] = ids
        known = [learned_at.get(i) for i in ids]
        if all(k is not None for k in known):
            need = max(known)
            w['unlock_lesson'] = next(l['id'] for l in lessons if l['order'] == need)
        else:
            w['unlock_lesson'] = None

    # 4. Bài mới: từ trọng tâm có đọc được không, chữ nào thiếu từ minh hoạ
    for l in lessons:
        if l['type'] != 'new': continue
        # intro_words = từ minh hoạ (nghe + nhìn hình), KHÔNG cần đọc được; chỉ cần tồn tại
        for fw in l.get('intro_words', []):
            if fw not in wid: err(f"[bài {l['id']}] intro_word '{fw}' không tồn tại")
        for k in l['kana']:
            if not kid[k].get('anchor_word_id'): warn(f"[bài {l['id']}] chữ {kid[k]['char']} chưa có từ minh hoạ (anchor_word_id)")
    for k in kana:
        a = k.get('anchor_word_id')
        if a and a not in wid: err(f"[kana] {k['char']}: anchor_word_id '{a}' không tồn tại")
    # 5. Số từ có thể chơi ở từng bài (để biết game có đủ chất liệu)
    for l in sorted(lessons, key=lambda x: x['order']):
        n = sum(1 for w in words if w.get('unlock_lesson') and lid[w['unlock_lesson']]['order'] <= l['order'])
        if 'word_builder' in l.get('games', []) and n < 4: warn(f"[bài {l['id']}] chỉ có {n} từ đọc được cho word_builder/karuta (nên ≥ 6)")
        l['_playable_words'] = n
    for w in words:
        if w.get('unlock_lesson') is None: warn(f"[từ] {w['word']} chưa mở khoá ở bài nào (còn thiếu chữ trong lộ trình)")
    # 6. Cấu hình game
    st = [x['stars_needed'] for x in cfg['levels']]
    if st != sorted(st) or st[0] != 0: err("[game_config] levels.stars_needed phải tăng dần và bắt đầu từ 0")
    # 7. Âm thanh
    if check_audio:
        paths = [k['audio']['normal'] for k in kana if k['id'] in learned_at]
        for w in words:
            if w.get('unlock_lesson'): paths += [w['audio']['normal'], w['audio']['slow']]
        paths += [p['audio']['normal'] for p in ui['phrases']]
        miss = [p for p in paths if not os.path.exists(p)]
        for p in miss: err(f"[âm thanh] thiếu file {p}")
        print(f"      âm thanh: {len(paths)-len(miss)}/{len(paths)} file có sẵn")
    # 8. Ghi các trường tự tính
    if fix:
        for k in kana: k['lesson'] = next((l['id'] for l in lessons if l['type']=='new' and k['id'] in l['kana']), None)
        for l in lessons: l.pop('_playable_words', None)
        save('kana_hiragana.json', kana_d); save('vocabulary_ja.json', vocab_d)
        print("      đã ghi kana.lesson, words.kana_ids, words.unlock_lesson")
    # 9. Báo cáo
    nk = len(learned_at); nw = sum(1 for w in words if w.get('unlock_lesson'))
    print(f"Chữ đang dạy: {nk}/{len(kana)} | Từ chơi được: {nw}/{len(words)} | Bài: {len(lessons)}")
    for l in sorted(lessons, key=lambda x: x['order']):
        if '_playable_words' in l: print(f"   {l['id']:>3} ({l['title_vi']}): {l['_playable_words']} từ đọc được tích luỹ")
    for w in warnings: print("  ⚠️ ", w)
    for e in errors: print("  ❌", e)
    print("✅ DỮ LIỆU ĐẠT CHUẨN" if not errors else f"❌ {len(errors)} lỗi")
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
