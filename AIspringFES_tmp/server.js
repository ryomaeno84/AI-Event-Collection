const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.js');

app.use(bodyParser.json());
// Serve static files (including the main site and the admin panel)
app.use(express.static(__dirname));

// Function to extract and parse data from content.js
function readData() {
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        // Extract the JSON part from window.APP_DATA = { ... };
        const jsonMatch = fileContent.match(/window\.APP_DATA\s*=\s*(\{[\s\S]*?\})\s*;/);

        if (jsonMatch && jsonMatch[1]) {
            let data;
            const evalContent = `(${jsonMatch[1]})`;
            data = eval(evalContent);
            return data;
        }
        return { news: [], artists: [], guideline: '' };
    } catch (error) {
        console.error('Error reading data file:', error);
        return { news: [], artists: [], guideline: '' };
    }
}

// Function to write back data into content.js
function writeData(data) {
    try {
        // We preserve the general structure of the file
        const fileHeader = `/**\n * AISpringFES 2026 コンテンツデータ\n * ローカル(file://)でも動作するようにグローバル変数APP_DATAに格納します。\n */\n\nwindow.APP_DATA = `;

        // Convert the updated object back to string representation
        const jsContent = fileHeader + JSON.stringify(data, null, 4) + ';\n';

        fs.writeFileSync(DATA_FILE, jsContent, 'utf-8');
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// API: Deploy to GitHub
app.post('/api/deploy', (req, res) => {
    // 確実にUTF-8で実行するようにchcpを使用
    const cmd = 'chcp 65001 > nul && git add . && git commit -m "Update from Admin UI" && git push origin main';
    exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Deploy error:', error);
            // 変更がない場合は実質エラーではないとして扱う（環境や言語設定による出力の差異を吸収）
            if (stdout.includes('nothing to commit') || stderr.includes('nothing to commit')) {
                return res.json({ success: true, message: '変更がありません' });
            }
            return res.status(500).json({ success: false, message: 'GitHubへの反映に失敗しました' });
        }
        res.json({ success: true, message: 'GitHubへの反映が完了しました' });
    });
});

// API: Get current news
app.get('/api/news', (req, res) => {
    const data = readData();
    res.json(data.news || []);
});

// API: Save news (add, update status/visibility)
app.post('/api/news', (req, res) => {
    const newItems = req.body; // Expecting an array of news items

    // Validate input basic structure
    if (!Array.isArray(newItems)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const fullData = readData();
    fullData.news = newItems; // Overwrite the news array entirely

    const success = writeData(fullData);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, message: 'Failed to write data' });
    }
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🤖 AIspringFES Admin Server is running!`);
    console.log(`▶ Admin Panel: http://localhost:${PORT}/admin/index.html`);
    console.log(`▶ Main Site  : http://localhost:${PORT}/index.html`);
    console.log(`========================================`);
});
