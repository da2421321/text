import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('views', path.join(__dirname, 'views')); // 设置视图文件目录
app.set('view engine', 'ejs'); // 设置模板引擎为 EJS

app.get('/', (req, res) => {
    res.render('index', { title: '我的网站', message: '欢迎来到 Node.js 世界！' });
});

app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});