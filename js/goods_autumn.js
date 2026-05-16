/**
 * Goods Data: Autumn LIVE 2026
 */

const autumnGoods = [
  {
    name: "秋の夜長のAI映像祭 公式パンフレット",
    image: "image/autumn2026/goods/pamphlet.png",
    url: "#"
  },
  {
    name: "限定アクリルスタンド",
    image: "image/autumn2026/goods/acrylic.png",
    url: "#"
  },
  {
    name: "ロゴ入りブランケット",
    image: "image/autumn2026/goods/blanket.png",
    url: "#"
  },
  {
    name: "オリジナルマグカップ",
    image: "image/autumn2026/goods/mug.png",
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
  renderGoods(autumnGoods);
});
