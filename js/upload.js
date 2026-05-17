async function checkKey() {
  const keyInput = document.getElementById('upload-key-input').value.trim();
  const errorMsg = document.getElementById('upload-error-msg');
  const formContainer = document.getElementById('form-link-container');
  const authBtn = document.getElementById('upload-auth-btn');

  if (!keyInput) {
    errorMsg.innerText = "アップロードキーを入力してください。";
    errorMsg.style.display = 'block';
    return;
  }

  // 入力された文字列をブラウザ内でSHA-256ハッシュ化
  const msgBuffer = new TextEncoder().encode(keyInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // ページごとの正解ハッシュ値
  // default (summer): 1494af848dbfdd207a25025cd60c865ba5ccd48736d6ac60358331328af28f6b
  let CORRECT_HASH = "1494af848dbfdd207a25025cd60c865ba5ccd48736d6ac60358331328af28f6b";

  const bodyId = document.body.id;
  if (bodyId === 'spring-theme') {
    CORRECT_HASH = "5c7acb9bafe684b1987fc289942f21a6cf91b7bc22033589d4dc3cc6db8d1ab2"; // spring2026
  } else if (bodyId === 'autumn-theme') {
    CORRECT_HASH = "be72f2a4950badfd42ad9feaeb8f35aaa35b5618bafe90cbff29a84c0e71b645"; // autumn2026
  } else if (bodyId === 'kohaku-theme') {
    CORRECT_HASH = "ffb95f7d357d0ff927b42b5c40d0de97b947a4a0013432d3354c3530385f65f7"; // kohaku2026
  }

  if (hashHex === CORRECT_HASH) {
    // 正解：フォームへのリンクを表示
    formContainer.style.display = 'block';
    errorMsg.style.display = 'none';

    // 入力欄とボタンを無効化（成功の印）
    document.getElementById('upload-key-input').disabled = true;
    authBtn.innerText = "認証済み";
    authBtn.disabled = true;
    authBtn.style.background = "#555";
  } else {
    // 不正解：エラーを表示
    errorMsg.innerText = "アップロードキーが正しくありません。";
    errorMsg.style.display = 'block';
    document.getElementById('upload-key-input').style.borderColor = '#ff007f';
  }
}