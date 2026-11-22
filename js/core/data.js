/**
 * js/core/data.js
 * Nạp và xử lý toàn bộ dữ liệu học từ các file JSON trong thư mục data/.
 * Tuyệt đối không hardcode nội dung học trong code.
 */

export async function loadAll(basePath = './data', fetchFn = (typeof fetch !== 'undefined' ? fetch : null)) {
  if (!fetchFn) {
    throw new Error('Cần môi trường có hỗ trợ fetch hoặc truyền custom fetchFn');
  }

  const files = [
    'kana_hiragana.json',
    'vocabulary_ja.json',
    'lessons_ja.json',
    'game_config.json',
    'ui_voice.json'
  ];

  const now = Date.now();
  const results = await Promise.all(
    files.map(async (filename) => {
      const url = `${basePath}/${filename}?v=${now}`;
      const res = await fetchFn(url);
      if (!res.ok) {
        throw new Error(`Không thể nạp file ${filename}: HTTP ${res.status}`);
      }
      return res.json();
    })
  );

  const [rawKana, rawVocab, rawLessons, rawConfig, rawUi] = results;

  // Kiểm tra tối thiểu cấu trúc dữ liệu
  if (!rawKana?.kana || !Array.isArray(rawKana.kana)) {
    throw new Error('Dữ liệu kana_hiragana.json không đúng định dạng (thiếu mảng kana)');
  }
  if (!rawVocab?.words || !Array.isArray(rawVocab.words)) {
    throw new Error('Dữ liệu vocabulary_ja.json không đúng định dạng (thiếu mảng words)');
  }
  if (!rawLessons?.lessons || !Array.isArray(rawLessons.lessons)) {
    throw new Error('Dữ liệu lessons_ja.json không đúng định dạng (thiếu mảng lessons)');
  }
  if (!rawConfig?.session || !rawConfig?.levels || !rawConfig?.games) {
    throw new Error('Dữ liệu game_config.json thiếu các trường cấu hình cốt lõi');
  }
  if (!rawUi?.phrases || !Array.isArray(rawUi.phrases)) {
    throw new Error('Dữ liệu ui_voice.json không đúng định dạng (thiếu mảng phrases)');
  }

  const kanaList = rawKana.kana;
  const wordList = rawVocab.words;
  const lessonList = rawLessons.lessons;
  const config = rawConfig;
  const uiPhrases = rawUi.phrases;

  // Tạo các bảng tra cứu
  const kanaById = Object.fromEntries(kanaList.map(k => [k.id, k]));
  const wordById = Object.fromEntries(wordList.map(w => [w.id, w]));
  const lessonById = Object.fromEntries(lessonList.map(l => [l.id, l]));
  const uiPhraseById = Object.fromEntries(uiPhrases.map(p => [p.id, p]));

  // Sắp xếp bài học theo order tăng dần
  const lessonsOrdered = [...lessonList].sort((a, b) => a.order - b.order);

  /**
   * Tập ID các chữ kana đã dạy tính tới bài có order <= uptoLessonOrder (từ các bài type="new")
   * @param {number} uptoLessonOrder
   * @returns {string[]} Mảng id chữ kana
   */
  function taughtKanaIds(uptoLessonOrder) {
    const ids = new Set();
    for (const l of lessonsOrdered) {
      if (l.order <= uptoLessonOrder && l.type === 'new' && Array.isArray(l.kana)) {
        for (const kId of l.kana) {
          ids.add(kId);
        }
      }
    }
    return Array.from(ids);
  }

  /**
   * Danh sách từ vựng đọc được tính tới bài có order <= uptoLessonOrder
   * (Các từ có unlock_lesson với lesson.order <= uptoLessonOrder)
   * @param {number} uptoLessonOrder
   * @returns {object[]} Mảng từ vựng
   */
  function readableWords(uptoLessonOrder) {
    return wordList.filter(w => {
      if (!w.unlock_lesson) return false;
      const lesson = lessonById[w.unlock_lesson];
      return lesson && lesson.order <= uptoLessonOrder;
    });
  }

  return {
    raw: { kana: rawKana, vocab: rawVocab, lessons: rawLessons, config: rawConfig, ui: rawUi },
    kanaList,
    wordList,
    lessonList,
    lessonsOrdered,
    kanaById,
    wordById,
    lessonById,
    config,
    uiPhrases,
    uiPhraseById,
    taughtKanaIds,
    readableWords
  };
}
