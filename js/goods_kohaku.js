/**
 * Goods Data: AI紅白歌合戦2026
 */

const kohakuGoods = [
  {
    name: "【公式】AI紅白歌合戦2026オリジナルジップアップパーカー",
    variation: "刺繍＋背面プリント",
    badge: "　✨PREMIUM",
    image: "image/kohaku2026/goods/parka.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルTシャツ",
    variation: "－抽象ストローク－",
    badge: "　💡RECOMMENDED",
    image: "image/kohaku2026/goods/tshirt-stroke.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルTシャツ",
    variation: "－水引－",
    badge: "　💡RECOMMENDED",
    image: "image/kohaku2026/goods/tshirt-mizuhiki.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルフェイスタオル",
    variation: "",
    badge: "",
    image: "image/kohaku2026/goods/towel.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルトートバッグ",
    variation: "裏表ロゴ",
    badge: "",
    image: "image/kohaku2026/goods/totebag.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルペンライト",
    variation: "",
    badge: "　💡RECOMMENDED",
    image: "image/kohaku2026/goods/penlight.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルバックステージパス風カード",
    variation: "アクリルカード",
    badge: "　💡RECOMMENDED",
    image: "image/kohaku2026/goods/backstage-pass.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルレザーIDカードホルダー",
    variation: "",
    badge: "",
    image: "image/kohaku2026/goods/id-holder.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルホログラムアクリルキーホルダー",
    variation: "ホログラム＋アクリル",
    badge: "",
    image: "image/kohaku2026/goods/keychain.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルアクリルマグネット",
    variation: "",
    badge: "",
    image: "image/kohaku2026/goods/magnet.png",
    url: ""
  },
  {
    name: "【公式】AI紅白歌合戦2026オリジナルホログラム缶バッジ",
    variation: "ホログラム",
    badge: "",
    image: "image/kohaku2026/goods/badge.png",
    url: ""
  }
];


/**
 * 商品一覧をHTMLへ表示
 */
function renderGoods(goods) {
  const container = document.getElementById("goods-grid");

  if (!container) return;

  container.innerHTML = "";

  goods.forEach(item => {

    const card = document.createElement("article");
    card.className = "goods-card";


    /* -------------------------
       バッジ
    ------------------------- */

    const badgeHTML = item.badge
      ? `
        <span class="goods-badge goods-badge-${item.badge.toLowerCase()}">
          ${item.badge}
        </span>
      `
      : "";


    /* -------------------------
       商品仕様・バリエーション
    ------------------------- */

    const variationHTML = item.variation
      ? `
        <p class="goods-variation">
          ${item.variation}
        </p>
      `
      : "";


    /* -------------------------
       UP-Tへのリンク

       URLが空欄の場合は
       ボタン自体を表示しない
    ------------------------- */

    const linkHTML = item.url
      ? `
        <a
          href="${item.url}"
          class="goods-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          UP-Tで商品を見る
          <span aria-hidden="true">↗</span>
        </a>
      `
      : "";


    /* -------------------------
       商品カード本体
    ------------------------- */

    card.innerHTML = `
      <div class="goods-thumb-wrap">

        ${badgeHTML}

        <img
          src="${item.image}"
          alt="${item.name}"
          class="goods-thumb"
          loading="lazy"
          onerror="this.src='https://placehold.jp/600x600.png?text=Goods+Image'"
        >

      </div>

      <div class="goods-info">

        <div class="goods-name">
          ${item.name}
        </div>

        ${variationHTML}

        ${linkHTML}

      </div>
    `;


    container.appendChild(card);
  });
}


/**
 * HTMLの読み込み完了後に商品一覧を表示
 */
document.addEventListener("DOMContentLoaded", () => {
  renderGoods(kohakuGoods);
});