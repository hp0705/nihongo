#!/usr/bin/env python3
"""
scripts/gen_audio.py  -  Tạo file âm thanh tiếng Nhật (mp3) cho chữ, từ và lời khen.

CHƯA CHẠY THỬ trong môi trường tạo tài liệu (không có mạng). Hãy chạy thử với 3-5 mục trước:
    pip install edge-tts
    python scripts/gen_audio.py --only a ka shi tsu ashi

Cách dùng:
    python scripts/gen_audio.py                 # tạo mọi âm còn thiếu của các chữ/từ ĐANG DẠY (có trong lessons_ja.json)
    python scripts/gen_audio.py --all           # tạo cả 46 chữ và mọi từ (kể cả chưa dạy)
    python scripts/gen_audio.py --force         # tạo lại tất cả
    python scripts/gen_audio.py --voice ja-JP-KeitaNeural   # đổi giọng (nam)
    python scripts/gen_audio.py --only ashi ka  # chỉ các mục có romaji/id này

Giọng mặc định: ja-JP-NanamiNeural (nữ, tiếng Nhật chuẩn Tokyo). Có thể thay bằng dịch vụ chính thức
(Azure Speech, Google Cloud TTS ja-JP, Amazon Polly): chỉ cần sửa hàm synth().
File assets/audio/ja/_manifest.json lưu giọng + nội dung đã dùng, để chỉ tạo lại khi bạn đổi chữ/giọng.
"""
import asyncio, json, os, sys, hashlib, argparse

def load(n):
    with open(os.path.join('data', n), encoding='utf-8') as f: return json.load(f)

async def synth(text, voice, rate, path):
    import edge_tts
    os.makedirs(os.path.dirname(path), exist_ok=True)
    await edge_tts.Communicate(text, voice, rate=rate).save(path)

def plan(args):
    kana, words = load('kana_hiragana.json')['kana'], load('vocabulary_ja.json')['words']
    lessons = load('lessons_ja.json')['lessons']
    ui = load('ui_voice.json')['phrases']
    taught = {k for l in lessons if l['type'] == 'new' for k in l['kana']}
    items = []
    for k in kana:
        if args.all or k['id'] in taught:
            # chữ đơn đọc dễ bị sai; thêm dấu "、" để giọng đọc dứt rõ. Có thể đặt 'tts_text' trong JSON để ép cách đọc.
            items.append((k['romaji'], k.get('tts_text') or (k['char'] + '、'), k['audio']['normal'], '+0%'))
    for w in words:
        if args.all or w.get('unlock_lesson') or any(w['id'] in l.get('intro_words', []) for l in lessons):
            t = w.get('tts_text') or w['word']
            items.append((w['romaji'], t, w['audio']['normal'], '+0%'))
            items.append((w['romaji'] + '_slow', t, w['audio']['slow'], '-30%'))
    for p in ui:
        items.append((p['id'], p.get('tts_text') or p['text'], p['audio']['normal'], '+0%'))
    if args.only:
        items = [i for i in items if i[0] in args.only or i[0].replace('_slow', '') in args.only]
    return items

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='ja-JP-NanamiNeural')
    ap.add_argument('--all', action='store_true'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--only', nargs='*')
    args = ap.parse_args()
    mpath = 'assets/audio/ja/_manifest.json'
    man = json.load(open(mpath, encoding='utf-8')) if os.path.exists(mpath) else {}
    items, made, skipped, failed = plan(args), 0, 0, []
    for key, text, path, rate in items:
        sig = hashlib.sha1(f'{args.voice}|{rate}|{text}'.encode('utf-8')).hexdigest()[:12]
        if not args.force and os.path.exists(path) and os.path.getsize(path) > 500 and man.get(path) == sig:
            skipped += 1; continue
        try:
            await synth(text, args.voice, rate, path)
            if os.path.getsize(path) < 500: raise RuntimeError('file quá nhỏ')
            man[path] = sig; made += 1; print('  tạo', path, '<-', text)
        except Exception as e:
            failed.append((path, str(e))); print('  LỖI', path, e)
    os.makedirs(os.path.dirname(mpath), exist_ok=True)
    json.dump(man, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'Xong: tạo {made}, bỏ qua {skipped}, lỗi {len(failed)}. Giọng: {args.voice}')
    print('NHỚ: nghe thử từng file mới (xem docs/04_GIONG_DOC_VA_AM_THANH.md, mục checklist).')
    sys.exit(1 if failed else 0)

if __name__ == '__main__':
    asyncio.run(main())
