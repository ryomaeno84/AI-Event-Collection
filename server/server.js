require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { canUpload, recordUpload } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Multer: disk storage (streaming, no memory) ──────
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
    const isMp4 = ext === '.mp4' && (file.mimetype === 'video/mp4' || file.mimetype === 'application/octet-stream');
    if (isMp4) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'videoFile'));
    }
  }
});

// ─── Google Drive Folder ID Map ───────────────────────
const FOLDER_MAP = {
  'spring':  process.env.FOLDER_ID_SPRING,
  'summer':  process.env.FOLDER_ID_SUMMER,
  'autumn':  process.env.FOLDER_ID_AUTUMN,
  'kohaku':  process.env.FOLDER_ID_KOHAKU
};

// ─── Event display name map ───────────────────────────
const EVENT_NAME_MAP = {
  'spring':  'AI Spring FES',
  'summer':  'AI SUPERLIVE SUMMER',
  'autumn':  '秋の夜長のAI映像祭',
  'kohaku':  'AI紅白歌合戦'
};

// ─── Google Drive Auth (Service Account) ──────────────
function getGoogleAuth() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
  const keyFile = path.resolve(__dirname, credPath);
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return auth;
}

// ─── Get access token for REST API calls ──────────────
async function getAccessToken() {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  return tokenRes.token || tokenRes;
}

// ─── Find or Create performer subfolder ───────────────
async function findOrCreatePerformerFolder(drive, performerName, parentFolderId) {
  // Search for existing folder with matching name inside the parent
  const query = [
    `name = '${performerName.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${parentFolderId}' in parents`,
    `trashed = false`
  ].join(' and ');

  const searchRes = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    const existing = searchRes.data.files[0];
    console.log(`  [Drive] Reusing existing folder: "${existing.name}" (${existing.id})`);
    return existing.id;
  }

  // Create new subfolder
  const createRes = await drive.files.create({
    requestBody: {
      name: performerName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    },
    fields: 'id, name',
    supportsAllDrives: true
  });

  console.log(`  [Drive] Created new folder: "${createRes.data.name}" (${createRes.data.id})`);
  return createRes.data.id;
}

// ─── Resumable Upload to Google Drive (REST API) ──────
// Uses the REST API directly with resumable upload type,
// bypassing the googleapis library's upload to have full
// control over the upload session and quota handling.
async function uploadToGoogleDrive(filePath, fileName, rootFolderId, performerName) {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });

  // 1. Find or create performer subfolder inside root event folder
  const performerFolderId = await findOrCreatePerformerFolder(drive, performerName, rootFolderId);

  const fileStat = fs.statSync(filePath);
  const fileSize = fileStat.size;
  const accessToken = await getAccessToken();

  // 2. Initiate resumable upload session via REST API
  const metadata = {
    name: fileName,
    parents: [performerFolderId],
    keepRevisionForever: false
  };

  const initiateUrl = 'https://www.googleapis.com/upload/drive/v3/files'
    + '?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink';

  const initiateRes = await fetch(initiateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(fileSize)
    },
    body: JSON.stringify(metadata)
  });

  if (!initiateRes.ok) {
    const errBody = await initiateRes.text();
    throw new Error(`Resumable session init failed (${initiateRes.status}): ${errBody}`);
  }

  const uploadUri = initiateRes.headers.get('location');
  if (!uploadUri) {
    throw new Error('No upload URI returned from resumable session init');
  }

  console.log(`  [Drive] Resumable upload session started`);

  // 3. Upload file in chunks (10 MB per chunk)
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
  let offset = 0;

  while (offset < fileSize) {
    const chunkEnd = Math.min(offset + CHUNK_SIZE, fileSize) - 1;
    const chunkLength = chunkEnd - offset + 1;

    const chunkBuffer = Buffer.alloc(chunkLength);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, chunkBuffer, 0, chunkLength, offset);
    fs.closeSync(fd);

    const chunkRes = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunkLength),
        'Content-Range': `bytes ${offset}-${chunkEnd}/${fileSize}`
      },
      body: chunkBuffer
    });

    const status = chunkRes.status;

    if (status === 200 || status === 201) {
      // Upload complete
      const fileData = await chunkRes.json();
      console.log(`  [Drive Upload] 100% complete`);

      // 4. Optional: try to transfer ownership (best-effort, won't block on failure)
      try {
        const ownerEmail = process.env.EMAIL_USER;
        if (ownerEmail) {
          await drive.permissions.create({
            fileId: fileData.id,
            transferOwnership: true,
            supportsAllDrives: true,
            requestBody: {
              role: 'owner',
              type: 'user',
              emailAddress: ownerEmail
            }
          });
          console.log(`  [Drive] Ownership transferred to ${ownerEmail}`);
        }
      } catch (ownerErr) {
        console.warn(`  [Drive] Ownership transfer skipped: ${ownerErr.message}`);
      }

      return fileData;
    } else if (status === 308) {
      // Chunk accepted, continue
      const progress = Math.round(((chunkEnd + 1) / fileSize) * 100);
      console.log(`  [Drive Upload] ${progress}% complete`);
    } else {
      const errBody = await chunkRes.text();
      throw new Error(`Chunk upload failed (${status}): ${errBody}`);
    }

    offset = chunkEnd + 1;
  }

  throw new Error('Resumable upload ended unexpectedly without completion');
}

// ─── Nodemailer Transporter ───────────────────────────
function createMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
}

// ─── Send Notification Email ──────────────────────────
async function sendNotificationEmail(eventKey, performerName, fileData, uploadDate) {
  const eventName = EVENT_NAME_MAP[eventKey] || eventKey;
  const transporter = createMailTransporter();

  const fileUrl = fileData.webViewLink
    || `https://drive.google.com/file/d/${fileData.id}/view`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Same address as sender (kanariya.glay84@gmail.com)
    subject: `【動画受信】${eventName} - ${performerName}様より`,
    text: [
      `動画を受信しました。`,
      ``,
      `出演者名: ${performerName}`,
      `イベント: ${eventName}`,
      `アップロード日時: ${uploadDate}`,
      `ファイル名: ${fileData.name}`,
      `ファイルID: ${fileData.id}`,
      `アクセスURL: ${fileUrl}`,
      ``,
      `--`,
      `AI Event Collection アップロードシステム`
    ].join('\n')
  };

  await transporter.sendMail(mailOptions);
  console.log(`  [Mail] Notification sent for ${performerName} (${eventName})`);
}

// ─── Helper: get client IP ────────────────────────────
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || req.ip;
}

// ─── Helper: extract event key from eventName ─────────
function getEventKey(eventName) {
  // eventName is sent from the hidden field: "spring", "summer", "autumn", "kohaku"
  if (!eventName) return null;
  const key = eventName.toLowerCase().trim();
  return FOLDER_MAP[key] ? key : null;
}

// ─── UPLOAD ENDPOINT ──────────────────────────────────
app.post('/api/upload', (req, res) => {
  const clientIp = getClientIp(req);

  // 1. Rate limit check (before accepting file)
  const rateCheck = canUpload(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `アップロード制限中です。あと約${rateCheck.remainingMinutes}分お待ちください。`
    });
  }

  // 2. Accept file via multer
  const singleUpload = upload.single('videoFile');

  singleUpload(req, res, async (multerErr) => {
    // Local helper to clean up temp file
    const cleanupTempFile = () => {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    };

    try {
      console.log("Received body:", req.body);

      if (multerErr) {
        if (multerErr.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'ファイルサイズが10GBを超えています。'
          });
        }
        if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'アップロードできるファイル形式は .mp4 のみです。'
          });
        }
        throw multerErr;
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '動画ファイルが選択されていません。'
        });
      }

      // 3. Validate upload key
      const uploadKey = req.body.uploadKey;
      const expectedKey = process.env.UPLOAD_KEY || '1234';
      if (uploadKey !== expectedKey) {
        cleanupTempFile();
        return res.status(403).json({
          success: false,
          message: 'アップロードキーが正しくありません。'
        });
      }

      // 4. Validate performer name
      const performerName = req.body.performerName?.trim();
      if (!performerName) {
        cleanupTempFile();
        return res.status(400).json({
          success: false,
          message: '出演者名を入力してください。'
        });
      }

      // 5. Resolve target folder (from hidden field eventName)
      const eventKey = getEventKey(req.body.eventName);
      if (!eventKey) {
        cleanupTempFile();
        return res.status(400).json({
          success: false,
          message: '無効なイベントページです。'
        });
      }
      const folderId = FOLDER_MAP[eventKey];

      // 6. Build target file name: "PerformerName.ext"
      const ext = path.extname(req.file.originalname);
      const targetFileName = performerName + ext;

      console.log(`[Upload] ${performerName} -> ${eventKey} (${req.file.size} bytes)`);

      // 7. Upload to Google Drive using stream + resumable
      const fileData = await uploadToGoogleDrive(
        req.file.path,
        targetFileName,
        folderId,
        performerName
      );

      console.log(`  [Drive] Uploaded: ${fileData.name} (ID: ${fileData.id})`);

      // 8. Record upload for rate limiting
      recordUpload(clientIp);

      // 9. Send notification email
      const uploadDate = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      try {
        await sendNotificationEmail(eventKey, performerName, fileData, uploadDate);
      } catch (mailErr) {
        console.error('  [Mail] Failed to send notification:', mailErr.message);
        // Don't fail the upload if mail fails
      }

      // 10. Cleanup temp file
      cleanupTempFile();

      // 11. Success response
      return res.json({
        success: true,
        message: 'アップロードが完了しました！',
        fileId: fileData.id,
        fileName: fileData.name
      });

    } catch (err) {
      cleanupTempFile();
      console.error('[Upload Error]', err);
      return res.status(500).json({
        success: false,
        message: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。'
      });
    }
  });
});

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Upload server running on http://localhost:${PORT}`);
  console.log(`   POST /api/upload - Video upload endpoint`);
  console.log(`   GET  /api/health - Health check\n`);
});
