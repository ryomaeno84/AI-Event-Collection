/**
 * Goods Data: Kohaku LIVE 2026
 */

const kohakuGoods = [
  {
    name: "AI紅白歌合戦 公式応援うちわ",
    image: "image/kohaku2026/goods/uchiwa.png",
    url: "#"
  },
  {
    name: "限定アクリルキーホルダー",
    image: "image/kohaku2026/goods/keychain.png",
    url: "#"
  },
  {
    name: "紅白ロゴ入り法被",
    image: "image/kohaku2026/goods/happi.png",
    url: "#"
  },
  {
    name: "公式メモリアルフォトブック",
    image: "image/kohaku2026/goods/photobook.png",
    url: "#"
  }
];

function renderGoods(goods) {
  const container = document.getElementById('goods-grid');
  if (!container) return;
  container.innerHTML = '';

  goods.forEach(item => {
    const card = document.createElement('a');
    card.className = 'goods-card';
    card.href = item.url;
    card.target = '_blank';
    card.innerHTML = `
      <div class="goods-thumb-wrap">
        <img src="${item.image}" alt="${item.name}" class="goods-thumb" onerror="this.src='https://placehold.jp/400x400.png?text=Goods+Image'">
      </div>
      <div class="goods-info">
        <div class="goods-name">${item.name}</div>
      </div>`;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderGoods(kohakuGoods);
});
