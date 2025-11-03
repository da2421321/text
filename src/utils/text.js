import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
dotenv.config();
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp', {
    serverSelectionTimeoutMS: 10000, // 超时时间设为5秒
    socketTimeoutMS: 45000, // socket超时时间
    family: 4, // 使用IPv4
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));



const User = mongoose.model('User', {
    username: String,
    password: String
});

const Task = mongoose.model('Task', {
    title: String,
    description: String,
    completed: Boolean,
    userId: String
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: '用户名错误' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: '密码错误' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: '请先登录' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'token无效' });
    }
}

app.get('/api/tasks', authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId.userId });
        res.json(tasks);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});
app.post('/api/tasks', authenticate, async (req, res) => {
    try {
        const task = new Task({ ...req.body, userId: req.userId });
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
