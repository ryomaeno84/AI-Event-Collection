(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────
  const API_BASE_URL = 'https://api.ai-event-collection.jp';
  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB ずつ分割
  const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
  const COOLDOWN_MS = 10 * 60 * 1000;
  const STORAGE_KEY = 'lastUploadTime';

  // ── DOM References ───────────────────────────────────
  const form = document.getElementById('upload-form');
  if (!form) return;

  const performerInput = document.getElementById('upload-performer');
  const keyInput = document.getElementById('upload-key');
  const fileInput = document.getElementById('upload-file');
  const fileLabel = document.getElementById('upload-file-label');
  const eventNameInput = document.getElementById('upload-event-name');
  const submitBtn = document.getElementById('upload-submit');
  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressText = document.getElementById('upload-progress-text');
  const statusEl = document.getElementById('upload-status');

  function getEventName() { return eventNameInput ? eventNameInput.value : 'unknown'; }
  function isMp4File(file) { return file.name.split('.').pop().toLowerCase() === 'mp4'; }

  function getRemainingCooldown() {
    const lastUpload = localStorage.getItem(STORAGE_KEY);
    if (!lastUpload) return 0;
    const elapsed = Date.now() - parseInt(lastUpload, 10);
    return elapsed < COOLDOWN_MS ? COOLDOWN_MS - elapsed : 0;
  }

  function updateCooldownUI() {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      const min = Math.ceil(remaining / 60000);
      submitBtn.disabled = true;
      submitBtn.textContent = `待機中... (あと約${min}分)`;
      submitBtn.style.opacity = '0.5';
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'アップロード';
      submitBtn.style.opacity = '1';
    }
  }

  updateCooldownUI();
  setInterval(updateCooldownUI, 60000);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) { fileLabel.textContent = 'ファイルを選択'; return; }
    if (!isMp4File(file)) { showStatus('error', 'MP4のみ可能です'); fileInput.value = ''; return; }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    fileLabel.textContent = `${file.name} (${sizeMB} MB)`;
  });

  // ── Form submit (Chunked Upload Version) ──────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (getRemainingCooldown() > 0) return;

    const performerName = performerInput.value.trim();
    const uploadKey = keyInput.value;
    const file = fileInput.files[0];

    if (!performerName || !uploadKey || !file) {
      showStatus('error', '入力を確認してください。');
      return;
    }

    setFormEnabled(false);
    clearStatus();
    progressContainer.style.display = 'block';

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileGuid = Math.random().toString(36).substring(2, 15);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        // ★重要: サーバー側の server.js (upload.single('videoChunk')) と合わせる
        formData.append('videoChunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('fileGuid', fileGuid);
        formData.append('performerName', performerName);
        formData.append('uploadKey', uploadKey);
        formData.append('eventName', getEventName());

        // 進行状況の表示
        const overallPct = Math.round((i / totalChunks) * 100);
        showProgress(overallPct, `送信中... ${i + 1}/${totalChunks} 分割目`);

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const resData = await response.json();
          throw new Error(resData.message || `サーバーエラー: ${response.status}`);
        }
      }

      // すべて完了
      showProgress(100, '✅ すべて完了しました！');
      showStatus('success', '✅ アップロード完了！ドライブに保存されました。');
      form.reset();
      fileLabel.textContent = 'ファイルを選択';
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      updateCooldownUI();

    } catch (err) {
      showStatus('error', '失敗: ' + err.message);
      setFormEnabled(true);
    }
  });

  // ── UI Helpers ───────────────────────────────────────
  function showProgress(pct, text) {
    if (!progressBar || !progressText) return;
    progressBar.style.width = pct + '%';
    progressText.textContent = text || (pct === 100 ? '処理完了' : `進行中 ${pct}%`);
  }

  function showStatus(type, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.color = type === 'success' ? '#00ff00' : '#ff4444';
  }

  function clearStatus() { if (statusEl) statusEl.style.display = 'none'; }

  function setFormEnabled(enabled) {
    submitBtn.disabled = !enabled;
    performerInput.disabled = !enabled;
    keyInput.disabled = !enabled;
    fileInput.disabled = !enabled;
    if (enabled) updateCooldownUI();
  }
})();