/**
 * upload.js — Client-side video upload handler for AI Event Collection
 *
 * - Validates file size (max 10 GB)
 * - Sends FormData via XMLHttpRequest with progress tracking
 * - Auto-detects current event page from URL
 */
(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────
  // 本番公開時（Localtunnel使用時）はここを 'https://xxxx.localtunnel.me' に書き換えてください
  const API_BASE_URL = 'https://websites-pin-bureau-chicago.trycloudflare.com';
  const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

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

  // ── Get event name from hidden field ─────────────────
  function getEventName() {
    return eventNameInput ? eventNameInput.value : 'unknown';
  }

  // ── MP4 validation helper ─────────────────────────────
  function isMp4File(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext === 'mp4';
  }

  // ── File label update ────────────────────────────────
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      fileLabel.textContent = 'ファイルを選択';
      return;
    }

    if (!isMp4File(file)) {
      showStatus('error', 'アップロードできるファイル形式は .mp4 のみです。');
      fileInput.value = '';
      fileLabel.textContent = 'ファイルを選択';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showStatus('error', 'ファイルサイズが10GBを超えています。');
      fileInput.value = '';
      fileLabel.textContent = 'ファイルを選択';
      return;
    }

    clearStatus();
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    fileLabel.textContent = `${file.name} (${sizeMB} MB)`;
  });

  // ── Form submit ──────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const performerName = performerInput.value.trim();
    const uploadKey = keyInput.value;
    const file = fileInput.files[0];

    if (!performerName || !uploadKey || !file) {
      showStatus('error', 'すべての項目を入力し、ファイルを選択してください。');
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('performerName', performerName);
    formData.append('uploadKey', uploadKey);
    formData.append('eventName', getEventName());
    formData.append('videoFile', file); // サーバー側の multer 設定名と合わせる

    // UI Reset
    setFormEnabled(false);
    showProgress(0);
    clearStatus();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/upload`);

    // ── Progress Event ───────
    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        showProgress(pct);
      }
    });

    // ── Load / Complete ───────
    xhr.addEventListener('load', () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = { success: false, message: 'サーバー応答の解析に失敗しました。' };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        showProgress(100);
        showStatus('success', '✅ アップロード完了！ドライブに保存されました。');
        form.reset();
        fileLabel.textContent = 'ファイルを選択';
      } else {
        showStatus('error', data.message || `エラー: ${xhr.status}`);
      }
      setFormEnabled(true);
    });

    // ── Error Handlers ────────
    xhr.addEventListener('error', () => {
      showStatus('error', 'ネットワークエラーが発生しました。サーバーが起動しているか確認してください。');
      setFormEnabled(true);
    });

    xhr.timeout = 0; 
    xhr.send(formData);
  });

  // ── UI Helpers ───────────────────────────────────────

  function showProgress(pct) {
    if (!progressContainer || !progressBar || !progressText) return;
    progressContainer.style.display = 'block';
    progressBar.style.width = pct + '%';
    
    if (pct < 100) {
      progressText.textContent = `送信中... ${pct}%`;
    } else {
      progressText.textContent = 'Googleドライブに保存中... (そのままお待ちください)';
    }
  }

  function showStatus(type, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'upload-status ' + type;
    statusEl.style.display = 'block';
    statusEl.style.color = type === 'success' ? '#00ff00' : '#ff4444';
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.textContent = '';
    statusEl.style.display = 'none';
  }

  function setFormEnabled(enabled) {
    submitBtn.disabled = !enabled;
    performerInput.disabled = !enabled;
    keyInput.disabled = !enabled;
    fileInput.disabled = !enabled;
    submitBtn.textContent = enabled ? 'アップロード' : '処理中...';
    submitBtn.style.opacity = enabled ? '1' : '0.5';
  }
})();