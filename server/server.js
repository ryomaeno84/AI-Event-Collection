require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Socket.io & チャット履歴 & 管理者設定 ──────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://ryomaeno84.github.io", "https://ai-event-collection.jp"],
    methods: ["GET", "POST"]
  }
});

let chatHistory = [];
const bannedIps = new Set(); // ブロック(BAN)リスト

// IPアドレス取得関数（Cloudflareやプロキシ経由に対応）
function getClientIp(req) {
  return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
}

io.on('connection', (socket) => {
  const clientIp = getClientIp(socket.request);

  // ③ アクセスブロックのチェック
  if (bannedIps.has(clientIp)) {
    socket.disconnect();
    return;
  }

  // ① IPアドレスから固定の表示用IDを生成 (なりすまし防止・4文字)
  const displayId = clientIp.split('.').reduce((acc, cur) => acc + parseInt(cur).toString(36), "").slice(-4);

  // 接続した人に履歴を送信
  socket.emit('load-history', chatHistory);

  socket.on('send-comment', (data) => {
    if (bannedIps.has(clientIp)) return; // 送信時も一応チェック

    const chatData = {
      id: Math.random().toString(36).substr(2, 9), // メッセージ個別の識別ID
      text: data.text,
      user: displayId, // IP由来の固定ID
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      ip: clientIp // 管理用に保持（一般ユーザーには見せない）
    };

    chatHistory.push(chatData);
    if (chatHistory.length > 100) chatHistory.shift(); // 100件まで保持

    io.emit('new-comment', chatData);
  });

  // ② 管理者用：ID指定（4文字のdisplayId）でチャット削除
  socket.on('admin-delete-by-user', (targetDisplayId) => {
    chatHistory = chatHistory.filter(m => m.user !== targetDisplayId);
    io.emit('load-history', chatHistory); // 全員に空の履歴を再送して同期
  });

  // ③ 管理者用：ID指定でアクセスブロック(BAN)
  socket.on('admin-ban-user', (targetDisplayId) => {
    const targetMsg = chatHistory.find(m => m.user === targetDisplayId);
    if (targetMsg) {
      const targetIp = targetMsg.ip;
      bannedIps.add(targetIp);

      // 対象IPの全接続を切断
      const sockets = io.sockets.sockets;
      for (const [id, s] of sockets) {
        if (getClientIp(s.request) === targetIp) s.disconnect();
      }

      // 履歴からも消去
      chatHistory = chatHistory.filter(m => m.user !== targetDisplayId);
      io.emit('load-history', chatHistory);
    }
  });
});

// ─── IPベースのアップロード制限機能 ──────────────────
const ipUploadRecords = new Map();
const COOLDOWN_MS = 10 * 60 * 1000;

function checkAndRecordIp(clientIp) {
  const now = Date.now();
  if (ipUploadRecords.has(clientIp)) {
    const lastUploadTime = ipUploadRecords.get(clientIp);
    const elapsed = now - lastUploadTime;
    if (elapsed < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return { allowed: false, remainingMinutes };
    }
  }
  return { allowed: true };
}

function updateIpRecord(clientIp) {
  ipUploadRecords.set(clientIp, Date.now());
}

// ─── CORS & ミドルウェア ──────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Google Drive 設定 ─────────────────────────
const uploadDir = path.join(__dirname, 'tmp_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.mp4') cb(null, true);
    else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'videoFile'));
  }
});

const FOLDER_MAP = {
  'spring': process.env.FOLDER_ID_SPRING,
  'summer': process.env.FOLDER_ID_SUMMER,
  'autumn': process.env.FOLDER_ID_AUTUMN,
  'kohaku': process.env.FOLDER_ID_KOHAKU
};

const EVENT_NAME_MAP = {
  'spring': 'AI Spring FES',
  'summer': 'AI SUPERLIVE SUMMER',
  'autumn': '秋の夜長のAI映像祭',
  'kohaku': 'AI紅白歌合戦'
};

// ─── Google Drive / Mail 関数 ───────────────────
function getGoogleAuth() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
  const keyFile = path.resolve(__dirname, credPath);
  return new google.auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/drive'] });
}

async function getAccessToken() {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  return tokenRes.token || tokenRes;
}

async function findOrCreatePerformerFolder(drive, performerName, parentFolderId) {
  const query = [`name = '${performerName.replace(/'/g, "\\'")}'`, `mimeType = 'application/vnd.google-apps.folder'`, `'${parentFolderId}' in parents`, `trashed = false`].join(' and ');
  const res = await drive.files.list({ q: query, supportsAllDrives: true, includeItemsFromAllDrives: true });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;
  const folder = await drive.files.create({ requestBody: { name: performerName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] }, supportsAllDrives: true });
  return folder.data.id;
}

async function uploadToGoogleDrive(filePath, fileName, rootFolderId, performerName) {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });
  const performerFolderId = await findOrCreatePerformerFolder(drive, performerName, rootFolderId);
  const fileSize = fs.statSync(filePath).size;
  const accessToken = await getAccessToken();

  const initiateRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(fileSize) },
    body: JSON.stringify({ name: fileName, parents: [performerFolderId] })
  });
  const uploadUri = initiateRes.headers.get('location');
  const chunkRes = await fetch(uploadUri, { method: 'PUT', body: fs.readFileSync(filePath) });
  return await chunkRes.json();
}

async function sendNotificationEmail(eventKey, performerName, fileData, uploadDate) {
  const eventName = EVENT_NAME_MAP[eventKey] || eventKey;
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD } });
  await transporter.sendMail({
    from: process.env.EMAIL_USER, to: process.env.EMAIL_USER,
    subject: `【動画受信】${eventName} - ${performerName}様`,
    text: `出演者: ${performerName}\nイベント: ${eventName}\n日時: ${uploadDate}\nURL: ${fileData.webViewLink || fileData.id}`
  });
}

function getEventKey(eventName) { const key = eventName?.toLowerCase().trim(); return FOLDER_MAP[key] ? key : null; }

// ─── エンドポイント ──────────────────────────────────
app.post('/api/upload', (req, res) => {
  const clientIp = getClientIp(req);
  const rateCheck = checkAndRecordIp(clientIp);
  if (!rateCheck.allowed) return res.status(429).json({ success: false, message: `制限中: あと ${rateCheck.remainingMinutes} 分` });

  upload.single('videoFile')(req, res, async (err) => {
    if (err || !req.file) return res.status(400).json({ success: false, message: 'エラーが発生しました' });
    try {
      const fileData = await uploadToGoogleDrive(req.file.path, req.body.performerName + path.extname(req.file.originalname), FOLDER_MAP[getEventKey(req.body.eventName)], req.body.performerName);
      updateIpRecord(clientIp);
      await sendNotificationEmail(getEventKey(req.body.eventName), req.body.performerName, fileData, new Date().toLocaleString());
      fs.unlinkSync(req.file.path);
      res.json({ success: true, message: '完了' });
    } catch (e) { res.status(500).send(e.message); }
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', chatCount: chatHistory.length }));

// ─── 起動 ──────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Multi-function Server running on port ${PORT}`);
});