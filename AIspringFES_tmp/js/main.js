document.addEventListener('DOMContentLoaded', () => {
    // APP_DATAが読み込まれているか確認
    if (!window.APP_DATA) {
        console.error('APP_DATA not found. Make sure data/content.js is loaded before main.js.');
        return;
    }

    initTabs();
    loadNews();
    loadArtists();
    loadGuidelines();
});

function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            btns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(target);
            if (targetEl) {
                targetEl.classList.add('active');

                // スクロール位置をコンテンツの先頭へ
                const navHeight = document.querySelector('.tabs-nav').offsetHeight;
                const contentTop = targetEl.offsetTop - navHeight - 20;
                window.scrollTo({ top: contentTop, behavior: 'smooth' });
            }
        });
    });
}

// URLをaタグに変換するヘルパー
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

function loadNews(showAll = false) {
    const container = document.getElementById('news-container');
    if (!container) return;

    // ステータスが "public" (または未定義=既存データ) のものだけを抽出
    const publicNews = window.APP_DATA.news.filter(news => news.status === 'public' || !news.status);

    // クリア
    container.innerHTML = '';

    // 表示する記事を決定
    const displayNews = showAll ? publicNews : publicNews.slice(0, 5);

    displayNews.forEach(news => {
        // 改行とリンク化の処理
        const formattedContent = linkify(news.content).replace(/\n/g, '<br>');

        const li = document.createElement('li');
        li.className = 'news-item';
        li.innerHTML = `
            <div class="news-date">${news.date}</div>
            <div class="news-title">${news.title}</div>
            <div class="news-detail">
                ${formattedContent}
            </div>
        `;
        li.addEventListener('click', () => {
            const detail = li.querySelector('.news-detail');
            detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
        });
        container.appendChild(li);
    });

    // 表示切り替えボタンの表示
    if (publicNews.length > 5) {
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'news-toggle-btn';

        if (!showAll) {
            toggleBtn.textContent = '▼ すべて表示';
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadNews(true);
            });
        } else {
            toggleBtn.textContent = '▲ 5件表示に戻す';
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadNews(false);
                // ニュースセクションの先頭へスクロール
                const newsSection = document.getElementById('news');
                const navHeight = document.querySelector('.tabs-nav').offsetHeight;
                window.scrollTo({ top: newsSection.offsetTop - navHeight - 20, behavior: 'smooth' });
            });
        }
        container.appendChild(toggleBtn);
    }
}

function loadArtists() {
    const container = document.getElementById('artist-container');
    if (!container) return;

    window.APP_DATA.artists.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'artist-card';
        card.innerHTML = `
            <img src="assets/images/thumbs/${artist.thumb}" alt="${artist.name}" class="artist-thumb">
            <div class="artist-name">${artist.name}</div>
            <a href="${artist.xLink}" target="_blank" class="x-link">X Profile</a>
        `;
        container.appendChild(card);
    });
}

function loadGuidelines() {
    const container = document.getElementById('guideline-text');
    if (!container) return;
    container.textContent = window.APP_DATA.guideline;
}
