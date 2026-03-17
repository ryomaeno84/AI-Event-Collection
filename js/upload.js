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

  // 先ほど作成した正解のハッシュ値
  const CORRECT_HASH = "1494af848dbfdd207a25025cd60c865ba5ccd48736d6ac60358331328af28f6b";

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