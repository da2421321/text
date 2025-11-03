import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config(); // 加载 .env 文件

const app = express();
app.use(express.json());

const secret = process.env.JWT_SECRET || 'your-256-bit-secret';;

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === '123456') {
        const token = jwt.sign({ username: user_id, role: 'admin' }, secret, { expiresIn: '1h' });
        res.json({ message: '登录成功', token: token });
    } else {
        res.status(401).send('用户名或密码错误');
    }
});

const tokenyanzheng = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // 没有 token
    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403); // token 无效或过期
        req.user = user; // 将解码后的用户信息添加到请求对象中
        next();
    });
}

app.get('/protected', tokenyanzheng, (req, res) => {
    res.json({ message: '访问成功', user: req.user });
});

app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});



