/**
 * Goods Data: Summer LIVE 2026
 */

const summerGoods = [
  {
    name: "1.png",
    image: "image/summer2026/goods/1.png",
    url: "#"
  },
  {
    name: "2.png",
    image: "image/summer2026/goods/2.png",
    url: "#"
  },
  {
    name: "3.png",
    image: "image/summer2026/goods/3.png",
    url: "#"
  },
  {
    name: "4.png",
    image: "image/summer2026/goods/4.png",
    url: "#"
  },
  {
    name: "5.png",
    image: "image/summer2026/goods/5.png",
    url: "#"
  },
  {
    name: "6.png",
    image: "image/summer2026/goods/6.png",
    url: "#"
  },
  {
    name: "7.png",
    image: "image/summer2026/goods/7.png",
    url: "#"
  },
  {
    name: "8.png",
    image: "image/summer2026/goods/8.png",
    url: "#"
  },
  {
    name: "9.png",
    image: "image/summer2026/goods/9.png",
    url: "#"
  },
  {
    name: "10.png",
    image: "image/summer2026/goods/10.png",
    url: "#"
  },
  {
    name: "11.png",
    image: "image/summer2026/goods/11.png",
    url: "#"
  },
  {
    name: "12.png",
    image: "image/summer2026/goods/12.png",
    url: "#"
  },
  {
    name: "13.png",
    image: "image/summer2026/goods/13.png",
    url: "#"
  },
  {
    name: "14.png",
    image: "image/summer2026/goods/14.png",
    url: "#"
  },
  {
    name: "15.png",
    image: "image/summer2026/goods/15.png",
    url: "#"
  },
  {
    name: "16.png",
    image: "image/summer2026/goods/16.png",
    url: "#"
  },
  {
    name: "17.png",
    image: "image/summer2026/goods/17.png",
    url: "#"
  },
  {
    name: "18.png",
    image: "image/summer2026/goods/18.png",
    url: "#"
  },
  {
    name: "19.png",
    image: "image/summer2026/goods/19.png",
    url: "#"
  },
  {
    name: "20.png",
    image: "image/summer2026/goods/20.png",
    url: "#"
  },
  {
    name: "21.png",
    image: "image/summer2026/goods/21.png",
    url: "#"
  },
  {
    name: "22.png",
    image: "image/summer2026/goods/22.png",
    url: "#"
  },
  {
    name: "23.png",
    image: "image/summer2026/goods/23.png",
    url: "#"
  },
  {
    name: "24.png",
    image: "image/summer2026/goods/24.png",
    url: "#"
  },
  {
    name: "25.png",
    image: "image/summer2026/goods/25.png",
    url: "#"
  },
  {
    name: "26.png",
    image: "image/summer2026/goods/26.png",
    url: "#"
  },
  {
    name: "27.png",
    image: "image/summer2026/goods/27.png",
    url: "#"
  },
  {
    name: "28.png",
    image: "image/summer2026/goods/28.png",
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
  renderGoods(summerGoods);
});
