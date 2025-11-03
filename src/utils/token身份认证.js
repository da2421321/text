import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config(); // 加载 .env 文件

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key'; // 从环境变量获取密钥

// 登录路由：生成 JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 假设这里进行用户验证
  if (username === 'test' && password === '123456') {
    const token = jwt.sign({ username: username, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: '登录成功', token: token });
  } else {
    res.status(401).send('用户名或密码错误');
  }
});

// 验证 JWT 的中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // 没有 token

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // token 无效或过期
    req.user = user; // 将解码后的用户信息添加到请求对象中
    next();
  });
}

// 受保护的路由
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `欢迎，${req.user.username}！你已访问受保护资源。`, user: req.user });
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
