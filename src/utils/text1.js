import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';

dotenv.config();
const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key'; // 从环境变量获取密钥
let users = []
let tasks = []

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hash
    };
    users.push(newUser);
    res.status(201).json({ message: '用户注册成功', userId: newUser.id }); // 添加此行
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(400).json({ message: '用户名错误' });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: '密码错误' });
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token,isMatch });
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: '无效的token' });
        }
        req.userId = decoded;
        next();
    });
};


app.get('/api/tasks', verifyToken, (req, res) => {
    const tasksOfUser = tasks.filter(task => task.userId === req.userId);
    res.json(tasksOfUser);
});


app.post('/api/tasks', verifyToken, (req, res) => {

    const { title, description } = req.body;
    const newTask = {
        id: tasks.length + 1,
        title,
        description,
        userId: req.userId
    };
    tasks.push(newTask);
    res.json(newTask);
});
app.listen(3000, () => {
    console.log('API 服务器运行在 http://localhost:3000');
});

