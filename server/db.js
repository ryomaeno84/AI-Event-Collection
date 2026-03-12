const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'upload_history.json');
const COOLDOWN_MINUTES = 30;

/**
 * Load history from JSON file.
 * Returns array of { ip, uploaded_at } objects.
 */
function loadHistory() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // If file is corrupted, start fresh
  }
  return [];
}

/**
 * Save history array to JSON file.
 */
function saveHistory(history) {
  fs.writeFileSync(DB_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Purge entries older than COOLDOWN_MINUTES to keep the file small.
 */
function purgeOldEntries(history) {
  const cutoff = Date.now() - COOLDOWN_MINUTES * 60 * 1000;
  return history.filter(entry => entry.uploaded_at > cutoff);
}

/**
 * Check if the given IP can upload (no upload within COOLDOWN_MINUTES).
 * Returns { allowed: boolean, remainingMinutes?: number }
 */
function canUpload(ip) {
  let history = loadHistory();
  history = purgeOldEntries(history);
  saveHistory(history); // Clean up old entries on each check

  const last = history
    .filter(entry => entry.ip === ip)
    .sort((a, b) => b.uploaded_at - a.uploaded_at)[0];

  if (!last) return { allowed: true };

  const elapsedMs = Date.now() - last.uploaded_at;
  const elapsedMinutes = elapsedMs / (1000 * 60);

  if (elapsedMinutes < COOLDOWN_MINUTES) {
    return {
      allowed: false,
      remainingMinutes: Math.ceil(COOLDOWN_MINUTES - elapsedMinutes)
    };
  }

  return { allowed: true };
}

/**
 * Record an upload for the given IP address.
 */
function recordUpload(ip) {
  let history = loadHistory();
  history = purgeOldEntries(history);
  history.push({ ip, uploaded_at: Date.now() });
  saveHistory(history);
}

module.exports = { canUpload, recordUpload };
