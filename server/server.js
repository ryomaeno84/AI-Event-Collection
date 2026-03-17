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
  return new google.auth.GoogleAuth({ keyFile: path.resolve(__dirname, credPath), scopes: ['https