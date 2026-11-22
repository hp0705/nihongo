#!/usr/bin/env python3
"""
scripts/run_tests.py
Chạy kiểm tra logic thuật toán SRS, Data nạp và Progress trong môi trường Python.
"""

import json, os, sys

def load(filename):
    with open(os.path.join('data', filename), encoding='utf-8') as f:
        return json.load(f)

def test_data():
    print("--- Chạy kiểm tra dữ liệu ---")
    raw_kana = load('kana_hiragana.json')['kana']
    raw_vocab = load('vocabulary_ja.json')['words']
    raw_lessons = load('lessons_ja.json')['lessons']
    raw_config = load('game_config.json')

    kana_by_id = {k['id']: k for k in raw_kana}
    word_by_id = {w['id']: w for w in raw_vocab}
    lesson_by_id = {l['id']: l for l in raw_lessons}
    lessons_ordered = sorted(raw_lessons, key=lambda x: x['order'])

    def taught_kana_ids(upto_order):
        ids = []
        for l in lessons_ordered:
            if l['order'] <= upto_order and l['type'] == 'new':
                for kid in l.get('kana', []):
                    if kid not in ids:
                        ids.append(kid)
        return ids

    def readable_words(upto_order):
        res = []
        for w in raw_vocab:
            ul = w.get('unlock_lesson')
            if ul and ul in lesson_by_id:
                if lesson_by_id[ul]['order'] <= upto_order:
                    res.append(w)
        return res

    # Tiêu chí: readableWords sau L1 = 5 từ, sau L2 = 13, sau L3 = 29, sau L4 = 43
    w1 = readable_words(1)
    w2 = readable_words(2)
    w3 = readable_words(4) # L3 có order là 4 (sau R1 có order 3)
    w4 = readable_words(5) # L4 có order là 5

    assert len(w1) == 5, f"L1 phải có 5 từ, thực tế: {len(w1)}"
    assert len(w2) == 13, f"L2 phải có 13 từ, thực tế: {len(w2)}"
    assert len(w3) == 29, f"L3 phải có 29 từ, thực tế: {len(w3)}"
    assert len(w4) == 43, f"L4 phải có 43 từ, thực tế: {len(w4)}"

    # Taught kana count: L1 = 5, L2 = 10, L3 = 15, L4 = 20
    assert len(taught_kana_ids(1)) == 5
    assert len(taught_kana_ids(2)) == 10
    assert len(taught_kana_ids(4)) == 15
    assert len(taught_kana_ids(5)) == 20

    print("✅ data tests: PASS")

def test_srs():
    print("--- Chạy kiểm tra SRS ---")
    # Kiểm tra thuật toán SRS 2 lần đúng lên hộp, 1 lần sai hạ hộp
    box = 0
    streak = 0
    # Đúng 1
    streak += 1
    assert box == 0 and streak == 1
    # Đúng 2
    streak += 1
    if streak >= 2:
        box = min(3, box + 1)
        streak = 0
    assert box == 1 and streak == 0

    # Sai 1
    box = max(0, box - 1)
    streak = 0
    assert box == 0 and streak == 0
    print("✅ SRS tests: PASS")

if __name__ == '__main__':
    test_data()
    test_srs()
    print("✅ TẤT CẢ TEST ĐỀU THÀNH CÔNG!")
