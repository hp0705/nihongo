/**
 * js/screens/parent.js
 * Vùng Phụ Huynh: Theo dõi tiến độ SRS từng chữ/từ, cài đặt hiển thị, sao lưu & phục hồi dữ liệu.
 */

export default {
  render({ root, data, audio, progress, navigate }) {
    root.innerHTML = '';

    const settings = progress.getSettings();
    const taughtKanaIds = data.taughtKanaIds(999);
    const allReadableWords = data.readableWords(999);
    const missingAudioList = audio.getMissingFiles();

    let currentFilter = 'all'; // 'all' hoặc 'needs_review'

    function renderContent() {
      const today = new Date().toISOString().slice(0, 10);

      // Lọc danh sách chữ
      const filteredKana = taughtKanaIds.filter(id => {
        if (currentFilter === 'all') return true;
        const entry = progress.getKana(id);
        return entry.box < 2 || (entry.due && entry.due <= today) || entry.wrong > entry.correct;
      });

      // Lọc danh sách từ
      const filteredWords = allReadableWords.filter(w => {
        if (currentFilter === 'all') return true;
        const entry = progress.getWord(w.id);
        return entry.box < 2 || (entry.due && entry.due <= today) || entry.wrong > entry.correct;
      });

      root.innerHTML = `
        <div class="screen-parent">
          <header class="parent-header">
            <button class="btn-back-circle" id="btn-parent-back" aria-label="Quay lại">◀</button>
            <div class="parent-title-box">
              <h2>⚙️ Khu Vực Ba Mẹ</h2>
              <p class="parent-subtitle">Theo dõi học tập và thiết lập ứng dụng</p>
            </div>
            <div class="header-blank"></div>
          </header>

          <main class="parent-content-scroll">
            <!-- TAB 1: Cài đặt hiển thị & học tập -->
            <section class="parent-card">
              <h3 class="card-section-title">⚙️ Cài Đặt Chung</h3>
              
              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-name">Hiện chữ phiên âm Romaji</div>
                  <div class="setting-desc">Hỗ trợ ba mẹ chưa biết tiếng Nhật đọc cùng bé</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-romaji" ${settings.romaji ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-name">Hiện gợi ý phát âm tiếng Việt</div>
                  <div class="setting-desc">Ví dụ: a, i, u, ê, ô...</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-vi-hint" ${settings.vi_hint ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-name">Giọng đọc dự phòng trình duyệt (Web Speech)</div>
                  <div class="setting-desc">Dùng tạm khi thiếu file âm thanh mp3 (mặc định tắt)</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="toggle-speech-fallback" ${settings.speech_fallback ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-name">Giới hạn thời gian mỗi ngày</div>
                  <div class="setting-desc">Bé Mây sẽ ngáp và nhắc bé nghỉ ngơi khi đến giờ</div>
                </div>
                <select id="select-daily-limit" class="parent-select">
                  <option value="10" ${settings.daily_limit_min === 10 ? 'selected' : ''}>10 phút</option>
                  <option value="15" ${settings.daily_limit_min === 15 ? 'selected' : ''}>15 phút</option>
                  <option value="20" ${settings.daily_limit_min === 20 ? 'selected' : ''}>20 phút (khuyên dùng)</option>
                  <option value="30" ${settings.daily_limit_min === 30 ? 'selected' : ''}>30 phút</option>
                  <option value="0" ${settings.daily_limit_min === 0 ? 'selected' : ''}>Không giới hạn</option>
                </select>
              </div>
            </section>

            <!-- TAB 2: Bảng theo dõi tiến độ ghi nhớ (SRS) -->
            <section class="parent-card">
              <div class="srs-table-header">
                <h3 class="card-section-title">📊 Tiến Độ Ghi Nhớ Của Bé</h3>
                <div class="srs-filter-buttons">
                  <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" id="filter-all">Tất cả (${taughtKanaIds.length + allReadableWords.length})</button>
                  <button class="filter-btn ${currentFilter === 'needs_review' ? 'active' : ''}" id="filter-review">Cần ôn tập</button>
                </div>
              </div>

              <div class="srs-section-subtitle">Chữ cái Hiragana (${filteredKana.length})</div>
              <div class="srs-items-grid">
                ${filteredKana.map(id => {
                  const k = data.kanaById[id];
                  const e = progress.getKana(id);
                  const boxColor = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][e.box || 0];
                  return `
                    <div class="srs-badge" style="border-left: 6px solid ${boxColor}">
                      <div class="srs-char">${k.char}</div>
                      <div class="srs-meta">
                        <span class="srs-box-tag" style="background: ${boxColor}">Hộp ${e.box || 0}/3</span>
                        <span class="srs-counts">✓${e.correct || 0} ✗${e.wrong || 0}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="srs-section-subtitle" style="margin-top: 20px;">Từ vựng (${filteredWords.length})</div>
              <div class="srs-items-grid">
                ${filteredWords.map(w => {
                  const e = progress.getWord(w.id);
                  const boxColor = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][e.box || 0];
                  return `
                    <div class="srs-badge" style="border-left: 6px solid ${boxColor}">
                      <div class="srs-word-info">
                        <span class="srs-emoji">${w.emoji || '✨'}</span>
                        <span class="srs-word">${w.word}</span>
                        <span class="srs-vi">(${w.vi})</span>
                      </div>
                      <div class="srs-meta">
                        <span class="srs-box-tag" style="background: ${boxColor}">Hộp ${e.box || 0}/3</span>
                        <span class="srs-counts">✓${e.correct || 0} ✗${e.wrong || 0}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>

            <!-- TAB 3: Quản lý dữ liệu & Sao lưu -->
            <section class="parent-card">
              <h3 class="card-section-title">💾 Sao Lưu & Quản Lý Dữ Liệu</h3>
              <p style="font-size: 0.95rem; color: #475569; margin-bottom: 16px;">
                Tiến độ được lưu trên trình duyệt của máy này. Ba mẹ có thể xuất file lưu dự phòng khi đổi máy.
              </p>

              <div class="data-management-buttons">
                <button class="btn-secondary btn-manage" id="btn-export-data">
                  📤 Xuất tiến độ ra file JSON
                </button>
                <label class="btn-secondary btn-manage" style="cursor: pointer; text-align: center;">
                  📥 Nhập tiến độ từ file
                  <input type="file" id="input-import-file" accept=".json" style="display: none;">
                </label>
                <button class="btn-danger btn-manage" id="btn-reset-data">
                  ⚠️ Xoá toàn bộ tiến độ (Bắt đầu lại)
                </button>
              </div>

              <div id="data-status-msg" style="margin-top: 12px; font-weight: bold; min-height: 20px;"></div>
            </section>

            <!-- TAB 4: Thông tin phiên bản & Kiểm tra âm thanh -->
            <section class="parent-card">
              <h3 class="card-section-title">ℹ️ Thông Tin Ứng Dụng</h3>
              <p>Phiên bản nội dung: <strong>${data.raw.lessons.version || '0.1.0'}</strong></p>
              <button class="btn-secondary" id="btn-check-update" style="margin-top: 8px;">
                🔄 Kiểm tra cập nhật nội dung
              </button>
              <div id="update-msg" style="margin-top: 8px; font-size: 0.95rem;"></div>

              ${missingAudioList.length > 0 ? `
                <div class="missing-audio-box" style="margin-top: 16px; padding: 12px; background: #fff1f2; border-radius: 8px; border: 1px solid #fecdd3;">
                  <strong style="color: #e11d48;">⚠️ Cảnh báo thiếu file âm thanh trong phiên (${missingAudioList.length}):</strong>
                  <ul style="font-size: 0.85rem; color: #475569; margin-top: 6px; padding-left: 20px;">
                    ${missingAudioList.map(p => `<li>${p}</li>`).join('')}
                  </ul>
                </div>
              ` : `
                <p style="margin-top: 12px; color: #16a34a; font-size: 0.95rem;">
                  ✅ Toàn bộ 118 file âm thanh tiếng Nhật chuẩn (Nanami) đã sẵn sàng.
                </p>
              `}
            </section>
          </main>
        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      // Quay lại màn hình chính
      root.querySelector('#btn-parent-back').onclick = () => {
        audio.playSfx('click');
        navigate('#/home');
      };

      // Đổi cài đặt
      const toggleRomaji = root.querySelector('#toggle-romaji');
      if (toggleRomaji) {
        toggleRomaji.onchange = () => {
          progress.setSetting('romaji', toggleRomaji.checked);
        };
      }

      const toggleViHint = root.querySelector('#toggle-vi-hint');
      if (toggleViHint) {
        toggleViHint.onchange = () => {
          progress.setSetting('vi_hint', toggleViHint.checked);
        };
      }

      const toggleSpeechFallback = root.querySelector('#toggle-speech-fallback');
      if (toggleSpeechFallback) {
        toggleSpeechFallback.onchange = () => {
          progress.setSetting('speech_fallback', toggleSpeechFallback.checked);
          audio.speechFallbackEnabled = toggleSpeechFallback.checked;
        };
      }

      const selectDailyLimit = root.querySelector('#select-daily-limit');
      if (selectDailyLimit) {
        selectDailyLimit.onchange = () => {
          progress.setSetting('daily_limit_min', parseInt(selectDailyLimit.value, 10));
        };
      }

      // Bộ lọc SRS
      const filterAllBtn = root.querySelector('#filter-all');
      const filterRevBtn = root.querySelector('#filter-review');
      if (filterAllBtn && filterRevBtn) {
        filterAllBtn.onclick = () => {
          currentFilter = 'all';
          renderContent();
        };
        filterRevBtn.onclick = () => {
          currentFilter = 'needs_review';
          renderContent();
        };
      }

      // Xuất tiến độ
      const exportBtn = root.querySelector('#btn-export-data');
      if (exportBtn) {
        exportBtn.onclick = () => {
          const jsonStr = progress.export();
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nihongo_adventure_backup_${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showDataMsg('Đã xuất file tiến độ thành công! ✅', '#16a34a');
        };
      }

      // Nhập tiến độ
      const importInput = root.querySelector('#input-import-file');
      if (importInput) {
        importInput.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const res = progress.import(text);
            if (res.success) {
              showDataMsg('Nhập tiến độ thành công! Vui lòng tải lại trang. ✅', '#16a34a');
              setTimeout(() => renderContent(), 1200);
            } else {
              showDataMsg(`Lỗi nhập file: ${res.error} ❌`, '#e11d48');
            }
          } catch (err) {
            showDataMsg(`Lỗi đọc file: ${err.message} ❌`, '#e11d48');
          }
        };
      }

      // Xoá tiến độ
      const resetBtn = root.querySelector('#btn-reset-data');
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (confirm('Ba mẹ có chắc chắn muốn xoá toàn bộ tiến độ của bé? Hành động này không thể hoàn tác!')) {
            if (confirm('Xác nhận lần 2: Xoá tất cả sao, con dấu ga và sticker?')) {
              progress.reset();
              showDataMsg('Đã đặt lại tiến độ về ban đầu! ✅', '#16a34a');
              setTimeout(() => renderContent(), 1000);
            }
          }
        };
      }

      // Kiểm tra cập nhật
      const checkUpdateBtn = root.querySelector('#btn-check-update');
      const updateMsg = root.querySelector('#update-msg');
      if (checkUpdateBtn && updateMsg) {
        checkUpdateBtn.onclick = async () => {
          updateMsg.textContent = 'Đang kiểm tra máy chủ...';
          try {
            const res = await fetch(`./data/lessons_ja.json?t=${Date.now()}`);
            if (res.ok) {
              const fresh = await res.json();
              if (fresh.version !== data.raw.lessons.version) {
                updateMsg.innerHTML = `<span style="color: #2563eb;">Có phiên bản mới: ${fresh.version}! Hãy tải lại trang để cập nhật.</span>`;
              } else {
                updateMsg.innerHTML = `<span style="color: #16a34a;">Bạn đang dùng dữ liệu mới nhất (v${fresh.version}).</span>`;
              }
            }
          } catch (err) {
            updateMsg.innerHTML = `<span style="color: #e11d48;">Không thể kết nối máy chủ: ${err.message}</span>`;
          }
        };
      }
    }

    function showDataMsg(msg, color) {
      const el = root.querySelector('#data-status-msg');
      if (el) {
        el.textContent = msg;
        el.style.color = color;
      }
    }

    renderContent();
  }
};
