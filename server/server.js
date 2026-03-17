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
const bannedIps = new Set();

function getClientIp(req) {
  return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
}

io.on('connection', (socket) => {
  const clientIp = getClientIp(socket.request);
  if (bannedIps.has(clientIp)) { socket.disconnect(); return; }
  const displayId = clientIp.split('.').reduce((acc, cur) => acc + parseInt(cur).toString(36), "").slice(-4);
  socket.emit('load-history', chatHistory);
  socket.on('send-comment', (data) => {
    if (bannedIps.has(clientIp)) return;
    const chatData = {
      id: Math.random().toString(36).substr(2, 9),
      text: data.text,
      user: displayId,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      ip: clientIp
    };
    chatHistory.push(chatData);
    if (chatHistory.length > 100) chatHistory.shift();
    io.emit('new-comment', chatData);
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

// ─── Google Drive / Multer 設定 ─────────────────────────
const uploadDir = path.join(__dirname, 'tmp_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 分割（チャンク）を一時保存する設定
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

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
  return new google.auth.GoogleAuth({ keyFile: path.resolve(__dirname, credPath), scopes: ['https://www.googleapis.com/auth/drive'] });
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

  // Resumable Upload
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

// ─── エンドポイント（分割アップロード対応） ───────────────────────────
app.use(cors());
app.use(express.json());

app.post('/api/upload', upload.single('videoChunk'), async (req, res) => {
  try {
    const { chunkIndex, totalChunks, fileGuid, performerName, eventName, uploadKey } = req.body;
    const clientIp = getClientIp(req);

    // キーチェック
    if (uploadKey !== process.env.UPLOAD_KEY) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(401).json({ success: false, message: 'Invalid Key' });
    }

    // IP制限チェック (最初のチャンクの時だけチェック)
    if (parseInt(chunkIndex) === 0) {
      const rateCheck = checkAndRecordIp(clientIp);
      if (!rateCheck.allowed) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(429).json({ success: false, message: `制限中: あと ${rateCheck.remainingMinutes} 分` });
      }
    }

    const finalPath = path.join(uploadDir, `final_${fileGuid}.mp4`);
    const chunkPath = req.file.path;

    // チャンクを最終ファイルに追記
    const data = fs.readFileSync(chunkPath);
    fs.appendFileSync(finalPath, data);
    fs.unlinkSync(chunkPath); // 使い終わったチャンクを削除

    // 全チャンク完了判定
    if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
      const eventKey = eventName?.toLowerCase().trim();
      const folderId = FOLDER_MAP[eventKey];

      // 非同期でアップロード開始
      try {
        const fileData = await uploadToGoogleDrive(finalPath, `${performerName}.mp4`, folderId, performerName);
        ipUploadRecords.set(clientIp, Date.now()); // 成功したらIP記録更新
        await sendNotificationEmail(eventKey, performerName, fileData, new Date().toLocaleString());
        fs.unlinkSync(finalPath);
        return res.json({ success: true, message: 'すべて完了しました' });
      } catch (err) {
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        throw err;
      }
    }

    res.json({ success: true, message: `チャンク ${chunkIndex} 受信済` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', chatCount: chatHistory.length }));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Unified Chunked Server running on port ${PORT}`);
});