document.addEventListener('DOMContentLoaded', () => {
  // Initialize Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  if (tabBtns.length > 0 && tabPanes.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        // Add active class to clicked tab and corresponding pane
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // Loading Overlay Logic (for index.html)
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    // Simulate loading time synchronized with CSS animation duration (0.625s)
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      // Optional: remove from DOM entirely after fade out
      setTimeout(() => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 800); // Wait for the CSS opacity transition to finish
    }, 625);
  }

  // --- Newsセクションの折り畳み機能 ---
  const newsItems = document.querySelectorAll('.news-list .news-item');
  const toggleContainer = document.getElementById('news-toggle-container');
  const toggleBtn = document.getElementById('news-toggle-btn');
  const MAX_ITEMS = 5;
  let isExpanded = false;

  if (newsItems.length > MAX_ITEMS && toggleContainer && toggleBtn) {
    toggleContainer.style.display = 'block';
    for (let i = MAX_ITEMS; i < newsItems.length; i++) {
      newsItems[i].style.display = 'none';
    }
    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      for (let i = MAX_ITEMS; i < newsItems.length; i++) {
        newsItems[i].style.display = isExpanded ? '' : 'none';
      }
      toggleBtn.innerText = isExpanded ? '閉じる ▲' : 'さらに表示 ▼';
    });
  }

  // --- Guidelineコンテンツの動的挿入 ---
  const guidelineContainer = document.getElementById('guideline-container');
  if (guidelineContainer) {
    guidelineContainer.innerHTML = guidelineContent;
  }
});

// --- 共通GUIDELINEコンテンツ ---
const guidelineContent = `
<div class="about-text">
  <h4 class="upload-title">作品投稿・グッズ販売ガイドライン</h4>
  <p class="mb-normal">
    本ガイドラインは、本イベントに参加する皆さまが、関係法令および各種権利を尊重した上で、安心して作品を投稿し、グッズを販売・交流できるよう定めるものです。<br>
    本ガイドラインは、法令の改正や社会情勢、技術動向等を踏まえ、必要に応じて内容を変更する場合があります。変更を行う場合は、変更の効力発生時期を定め、変更内容を運営の公式SNS、イベントページ等で事前に周知します（緊急を要する場合を除く）。周知後、参加者が本イベントへの参加・作品投稿・グッズ販売を継続した場合、変更後のガイドラインに同意したものとみなします。
  </p>

  <h5 class="topics-title">1. 用語の定義</h5>
  <ul class="guideline-list">
    <li><strong>・主催者</strong><br>AI音楽映像イベントを企画・運営する責任者を指します。</li>
    <li class="mt-normal"><strong>・参加者</strong><br>AI音楽映像イベントへ作品を投稿する方、または参加者独自のグッズを制作・販売する方を指します。</li>
  </ul>

  <h5 class="topics-title">2. 基本方針（知的財産権の尊重）</h5>
  <p class="mb-normal">本イベントでは、著作権、商標権、肖像権、パブリシティ権、その他の知的財産権および関連する権利を尊重することを基本方針とします。</p>
  <ul class="guideline-list">
    <li>投稿できる作品は <strong>オリジナル作品に限ります。</strong></li>
    <li>既存のアニメ、映画、ゲーム、漫画、小説、楽曲、キャラクター、ロゴ等を基にした二次創作作品やパロディ作品は認めていません。</li>
    <li>AI生成物であっても、既存作品や人物、キャラクター、声、人格等を第三者が識別可能な程度で再現・模倣した場合は権利侵害となるおそれがあります。そのような作品は投稿できません。</li>
    <li>本イベントには企業広告が含まれる場合があります。</li>
    <li>使用する生成AIツール、素材、音源等の商用利用可否や利用条件は、参加者自身の責任で確認してください。</li>
    <li>クレジット表記等の条件がある場合は、各利用規約に従ってください。</li>
  </ul>

  <h5 class="topics-title">3. 投稿できる作品</h5>
  <p class="mb-small">以下のいずれかに該当する作品のみ投稿可能です。</p>
  <ul class="guideline-list">
    <li><strong>3-1. オリジナル作品</strong><br>参加者自身が制作、またはAIを用いて生成したオリジナルのキャラクター、音楽、映像等。</li>
    <li><strong>3-2. 公開ライセンス素材の利用</strong><br>Creative Commons等の公開ライセンスに基づき、商用利用を含め合法的に利用可能な素材を、ライセンス条件を遵守して使用した作品。</li>
    <li><strong>3-3. 権利関係が明確な素材</strong><br>参加者自身が演奏・撮影・録音した素材<br>商用利用可能であることが明示された有償素材</li>
  </ul>

  <h5 class="topics-title">4. 投稿できない作品</h5>
  <p class="mb-small">以下を含む、または含むおそれのある作品は投稿できません。<br>投稿後に判明した場合、運営判断により非公開等の対応を行うことがあります。</p>
  <ul class="guideline-list">
    <li><strong>4-1. 二次創作・パロディ</strong><br>既存キャラクター、デザイン、ロゴ等の使用・模倣<br>既存作品を想起させる構図、表現、名称<br>既存アニメ、映画、番組、ゲーム等の映像・音声の利用<br>既存曲のAIカバー、既存映像のAI加工</li>
    <li><strong>4-2. 声・人格の模倣</strong><br>実在人物、声優、歌手、VTuber等の声や話し方、人格を特定可能な形で再現・模倣したAI生成音声。</li>
    <li><strong>4-3. 音楽著作権侵害</strong><br>既存楽曲のメロディやコード進行等を実質的に利用した作品<br>許諾のないカバー、替え歌、アレンジ</li>
    <li><strong>4-4. 商標・ブランド侵害</strong><br>有名作品やブランドを想起させる紛らわしい名称<br>登録商標やロゴの模倣</li>
    <li><strong>4-5. その他の違法・不適切行為</strong><br>実在人物のディープフェイク<br>プライバシー侵害<br>誹謗中傷、差別的表現、政治的・宗教的扇動<br>暴力、流血、直接的な性的表現</li>
  </ul>
  <p class="hint-text mb-normal">※ 暗喩的・抽象的表現であっても、運営が不適切と判断した場合は投稿不可とします。</p>

  <h5 class="topics-title">5. 他者素材・ツール利用時の注意</h5>
  <ul class="guideline-list">
    <li>使用する素材サイト、生成AIツール、編集ソフト等の利用規約は必ず確認し遵守してください。</li>
    <li>配信プラットフォームで使用禁止の楽曲・素材は利用できません。</li>
    <li>第三者の権利に関する申し立てがあった場合、運営は法令および本ガイドラインに基づき対応します。</li>
  </ul>

  <h5 class="topics-title">6. 権利侵害が疑われる場合の対応</h5>
  <p class="mb-small">運営の裁量により、以下の措置を行う場合があります。<br>正式な申し立てがあった場合、事実確認後、速やかに対応を実施行します。</p>
  <ul class="guideline-list">
    <li>作品の公開停止または非公開化</li>
    <li>修正依頼</li>
    <li>審査対象からの除外</li>
    <li>悪質な場合、今後の参加拒否</li>
    <li>悪質かつ明確な権利侵害が認められた場合、必要に応じて権利者や関係当局（警察等）への通報</li>
  </ul>

  <h5 class="topics-title">7. 著作権および利用権</h5>
  <ul class="guideline-list">
    <li>著作権は各作成者に帰属します。</li>
    <li>主催者はイベント配信・広報目的の範囲で非独占的利用権を有します。</li>
  </ul>

  <h5 class="topics-title">8. グッズ販売</h5>
  <ul class="guideline-list">
    <li>参加者独自のグッズ制作および主催者が用意した専用ハッシュタグ（例：#AISpringFES物販）の利用は自由です。</li>
    <li>主催者は「参加者の作品発表および交流のための場を提供する立場」であり、参加者独自のグッズの制作・販売管理・斡旋・宣伝等は行いません。参加者によるグッズの販売・金銭トラブル・不良品等について主催者は一切責任を負いません。</li>
    <li>参加者独自のグッズ販売において、著作権、商標権その他の知的財産権を侵害しないよう、参加者自身が責任を持って確認してください。権利侵害が疑われる場合は、第6項に準じた措置を取る場合があります。</li>
  </ul>

  <h5 class="topics-title">9. 免責事項</h5>
  <ul class="guideline-list">
    <li>投稿作品の合法性および素材利用の権利処理は参加者自身の責任とします。</li>
    <li>参加者は、作品が第三者の権利を侵害しないこと、および自身の創作であることを表明・保証します。</li>
    <li>虚偽申告や違反により紛争が生じた場合、参加者は自己の責任と費用で解決するものとします。</li>
    <li>主催者が損害を被った場合、合理的な弁護士費用を含め賠償請求できるものとします。ただし、主催者の故意または重過失による場合はこの限りではありません。</li>
    <li>法令改正や社会情勢等により内容を変更する場合があります。重要変更は適切な方法で告知します。</li>
  </ul>

  <h5 class="topics-title">10. お問い合わせ窓口</h5>
  <p class="mb-normal">
    お問い合わせや削除依頼は、運営公式SNS（<a href="https://x.com/AI_animeryo" target="_blank" class="accent-blue text-link">https://x.com/AI_animeryo</a>）のダイレクトメッセージにて受け付けます。連絡手段や対応時間は運営判断により変更される場合があります。
  </p>
</div>
`;

