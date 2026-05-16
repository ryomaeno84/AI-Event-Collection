/**
 * Goods Data: Spring LIVE 2026
 */

const springGoods = [
  {
    name: "AI Spring FES 公式Tシャツ (Black)",
    image: "https://placehold.co/400x400/222/FFF?text=Official+T-Shirt",
    url: "#"
  },
  {
    name: "イベント限定 アクリルスタンド",
    image: "https://placehold.co/400x400/222/00d2ff?text=Acrylic+Stand",
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
  renderGoods(springGoods);
});
