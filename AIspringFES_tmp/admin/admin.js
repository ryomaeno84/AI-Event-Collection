let newsData = [];
let currentIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    fetchNews();

    document.getElementById('btn-new').addEventListener('click', createNew);
    document.getElementById('btn-save-draft').addEventListener('click', () => saveNews('hidden'));
    document.getElementById('btn-publish').addEventListener('click', () => saveNews('public'));

    // プレビュー機能
    document.getElementById('btn-preview').addEventListener('click', showPreview);
    document.getElementById('btn-close-preview').addEventListener('click', () => {
        document.getElementById('preview-modal').classList.add('hidden');
    });

    // GitHub反映機能
    document.getElementById('btn-deploy').addEventListener('click', deployToGitHub);
});

async function deployToGitHub() {
    const isConfirm = confirm('変更内容がユーザーに見える形で公開されますがよろしいですか');
    if (!isConfirm) return;

    const statusEl = document.getElementById('deploy-status');
    statusEl.textContent = '🔄 実行中...';
    statusEl.style.color = 'var(--primary-color)';
    statusEl.classList.remove('hidden');

    try {
        const response = await fetch('/api/deploy', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            statusEl.textContent = '✔ 完了しました';
            statusEl.style.color = 'var(--success-color)';
        } else {
            statusEl.textContent = '❌ エラー: ' + result.message;
            statusEl.style.color = 'var(--danger-color)';
        }
    } catch (e) {
        console.error(e);
        statusEl.textContent = '❌ 通信エラー';
        statusEl.style.color = 'var(--danger-color)';
    }

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 5000);
}

async function fetchNews() {
    try {
        const response = await fetch('/api/news');
        newsData = await response.json();

        // Ensure every item has a status (default to public for existing ones)
        newsData.forEach(item => {
            if (!item.status) item.status = 'public';
        });

        renderList();
        if (newsData.length > 0) {
            selectItem(0);
        } else {
            createNew();
        }
    } catch (e) {
        console.error('Failed to load news', e);
    }
}

function renderList() {
    const list = document.getElementById('news-list');
    list.innerHTML = '';

    newsData.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `news-list-item ${index === currentIndex ? 'selected' : ''}`;

        // フォーマットされたID (01, 02...)
        const displayId = String(item.id).padStart(2, '0');
        const statusClass = item.status === 'public' ? 'status-public' : 'status-hidden';
        const statusText = item.status === 'public' ? '公開中' : '非表示（下書き）';

        li.innerHTML = `
            <div class="item-main-info">
                <div class="item-id">ID: ${displayId} | ${item.date}</div>
                <div class="item-title">${item.title}</div>
                <div class="item-status ${statusClass}">${statusText}</div>
            </div>
            <div class="order-controls">
                <button class="btn-order btn-up" title="上へ" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn-order btn-down" title="下へ" ${index === newsData.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
        `;

        // 項目自体のクリックで編集
        li.querySelector('.item-main-info').addEventListener('click', () => selectItem(index));

        // 並び替えボタンのイベント
        const btnUp = li.querySelector('.btn-up');
        const btnDown = li.querySelector('.btn-down');

        if (btnUp) {
            btnUp.addEventListener('click', (e) => {
                e.stopPropagation();
                moveItem(index, index - 1);
            });
        }
        if (btnDown) {
            btnDown.addEventListener('click', (e) => {
                e.stopPropagation();
                moveItem(index, index + 1);
            });
        }

        list.appendChild(li);
    });
}

async function pushNewsDataToServer(successMsg) {
    try {
        const response = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newsData)
        });

        const result = await response.json();
        if (result.success) {
            renderList();
            showStatusMessage(successMsg || '✔ 保存しました');
        } else {
            alert('保存に失敗しました。');
        }
    } catch (e) {
        console.error(e);
        alert('通信エラーが発生しました。');
    }
}

async function moveItem(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= newsData.length) return;

    const item = newsData.splice(fromIndex, 1)[0];
    newsData.splice(toIndex, 0, item);

    if (currentIndex === fromIndex) {
        currentIndex = toIndex;
    } else if (currentIndex === toIndex) {
        currentIndex = fromIndex;
    }

    await pushNewsDataToServer('✔ 順序を保存しました');
}

function selectItem(index) {
    currentIndex = index;
    renderList();

    const item = newsData[index];
    document.getElementById('editor-title').textContent = `記事の編集 (ID: ${String(item.id).padStart(2, '0')})`;
    document.getElementById('news-id').value = index; // Array index
    document.getElementById('news-number-id').value = item.id;
    document.getElementById('news-date').value = item.date;
    document.getElementById('news-title').value = item.title;
    document.getElementById('news-content').value = item.content;

    hideStatusMessage();
}

function createNew() {
    currentIndex = -1;
    renderList();

    // 採番 (最大ID + 1)
    const maxId = newsData.reduce((max, item) => Math.max(max, item.id), 0);
    const newId = maxId + 1;

    // 今日の日付 (YYYY.MM.DD)
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    document.getElementById('editor-title').textContent = `新規追加 (ID: ${String(newId).padStart(2, '0')})`;
    document.getElementById('news-id').value = 'new';
    document.getElementById('news-number-id').value = newId;
    document.getElementById('news-date').value = dateStr;
    document.getElementById('news-title').value = '';
    document.getElementById('news-content').value = '';

    hideStatusMessage();
}

// URLをaタグに変換するヘルパー
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

function showPreview() {
    const title = document.getElementById('news-title').value;
    const date = document.getElementById('news-date').value;
    const rawContent = document.getElementById('news-content').value;

    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-date').textContent = date;

    // 改行を <br> に、URLをリンクに
    let htmlContent = linkify(rawContent).replace(/\n/g, '<br>');
    document.getElementById('preview-content').innerHTML = htmlContent;

    document.getElementById('preview-modal').classList.remove('hidden');
}

async function saveNews(targetStatus) {
    const numId = parseInt(document.getElementById('news-number-id').value);

    // 新規作成かどうかのフラグ
    const isNew = document.getElementById('news-id').value === 'new';

    const newItem = {
        id: numId,
        date: document.getElementById('news-date').value,
        title: document.getElementById('news-title').value,
        content: document.getElementById('news-content').value,
        status: targetStatus
    };

    // IDで既存の記事を探す（インデックスのズレに左右されないようにするため）
    const existingIndex = newsData.findIndex(item => item.id === numId);

    if (existingIndex !== -1) {
        // 既存記事の更新
        newsData[existingIndex] = newItem;
        currentIndex = existingIndex;
    } else {
        // 新規記事として追加
        newsData.unshift(newItem);
        currentIndex = 0;
    }

    // 保存後は常に現在のインデックスで編集モードに移行（重複防止）
    document.getElementById('news-id').value = currentIndex;

    // タイトルの更新 (IDが変わることはないが、表示を編集モードに合わせる)
    document.getElementById('editor-title').textContent = `記事の編集 (ID: ${String(numId).padStart(2, '0')})`;

    await pushNewsDataToServer('✔ 保存しました');
}

function showStatusMessage(msg) {
    const el = document.getElementById('save-status');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(hideStatusMessage, 3000);
}

function hideStatusMessage() {
    document.getElementById('save-status').classList.add('hidden');
}
