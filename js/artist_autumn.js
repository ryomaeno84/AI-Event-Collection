/**
 * Artist Data: Autumn FILM
 */

const autumnArtists = [
  {
    name: "天汐香弓",
    image: "image/autumn2026/icon/icon01.jpeg",
    xUrl: "https://x.com/teshio_k",
    youtubeUrl: "https://youtube.com/@user-usuisioaji"
  },
  {
    name: "To",
    image: "image/autumn2026/icon/icon02.jpg",
    xUrl: "https://x.com/divarias_SUNO",
    youtubeUrl: "https://youtube.com/@studioto-animecreation?si=OU6wT3xUvojTFGpo"
  },
  {
    name: "PONTA",
    image: "image/autumn2026/icon/icon03.png",
    xUrl: "https://x.com/pinkshihtzu",
    youtubeUrl: ""
  },
  {
    name: "美桜",
    image: "image/autumn2026/icon/icon04.jpg",
    xUrl: "https://x.com/AI_mio_AI",
    youtubeUrl: "https://www.youtube.com/@AI_mio_AI"
  },
  {
    name: "Resonance Diva",
    image: "image/autumn2026/icon/icon05.png",
    xUrl: "https://x.com/resonancediva",
    youtubeUrl: "https://www.youtube.com/@resonance_diva"
  },
  {
    name: "bell_bright",
    image: "image/autumn2026/icon/icon06.png",
    xUrl: "https://x.com/tl_bellbright?s=11",
    youtubeUrl: ""
  },
  {
    name: "ねね",
    image: "image/autumn2026/icon/icon07.jpg",
    xUrl: "@anonenonenonene",
    youtubeUrl: "https://youtube.com/channel/UCbrty3dpwhgQZROiWrMrUEg?si=xszcvqQYMTYU4Bls"
  },
  {
    name: "こうたろう🐸ケロキング",
    image: "image/autumn2026/icon/icon08.jpeg",
    xUrl: "https://x.com/torotoromoney",
    youtubeUrl: "https://www.youtube.com/@koutaroukero"
  },
  {
    name: "ぱんちょ",
    image: "image/autumn2026/icon/icon09.jpg",
    xUrl: "https://x.com/pancyo999",
    youtubeUrl: "https://youtube.com/@pancyo924"
  },
  {
    name: "ブランシェスカ",
    image: "image/autumn2026/icon/icon10.png",
    xUrl: "@montblanc5815",
    youtubeUrl: "https://youtube.com/@abnormalbraincrisisrecord"
  },
  {
    name: "マンダリンみかん",
    image: "image/autumn2026/icon/icon999.png",
    xUrl: "https://x.com/potechimusha",
    youtubeUrl: ""
  },
  {
    name: "minmin",
    image: "image/autumn2026/icon/icon12.jpg",
    xUrl: "@minmin_4410",
    youtubeUrl: "https://youtube.com/@minmin_4410"
  },
  {
    name: "Ushizaru",
    image: "image/autumn2026/icon/icon13.jpg",
    xUrl: "@Ushizaru_LAB",
    youtubeUrl: "https://www.youtube.com/@Ushizaru-il2sw"
  }
];

// Formatting Icons
const xIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>`;
const ytIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>`;

function renderArtists(artists) {
  const container = document.getElementById('artist-grid');
  if (!container) return;
  container.innerHTML = '';
  artists.forEach(artist => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
      <img src="${artist.image}" alt="${artist.name}" class="artist-thumb">
      <div class="artist-info">
        <div class="artist-name">${artist.name}</div>
        <div class="artist-social-links">
          <a href="${artist.xUrl}" target="_blank" title="X (Twitter)" class="social-link x">${xIcon}</a>
          <a href="${artist.youtubeUrl}" target="_blank" title="YouTube" class="social-link youtube">${ytIcon}</a>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderArtists(autumnArtists);
});
