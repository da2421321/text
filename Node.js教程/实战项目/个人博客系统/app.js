const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 数据库连接
mongoose.connect('mongodb://localhost:27017/blog_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 数据模型
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    image: String,
    published: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// 认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '访问令牌缺失' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        req.user = user;
        next();
    });
};

// 路由

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: '用户名或邮箱已存在' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '用户注册成功',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: '注册失败', details: error.message });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 查找用户
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: '登录失败', details: error.message });
    }
});

// 获取所有文章
app.get('/api/posts', async (req, res) => {
    try {
        const { page = 1, limit = 10, tag, search } = req.query;
        const query = { published: true };

        if (tag) {
            query.tags = tag;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取文章失败', details: error.message });
    }
});

// 获取单篇文章
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username'
                }
            });

        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: '获取文章失败', details: error.message });
    }
});

// 创建文章
app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, content, tags, published } = req.body;
        const image = req.file ? req.file.filename : null;

        const post = new Post({
            title,
            content,
            author: req.user.userId,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            image,
            published: published === 'true'
        });

        await post.save();
        await post.populate('author', 'username');

        res.status(201).json({
            message: '文章创建成功',
            post
        });
    } catch (error) {
        res.status(500).json({ error: '创建文章失败', details: error.message });
    }
});

// 更新文章
app.put('/api/posts/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, content, tags, published } = req.body;
        const image = req.file ? req.file.filename : null;

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }

        if (post.author.toString() !== req.user.userId) {
            return res.status(403).json({ error: '无权限修改此文章' });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.tags = tags ? tags.split(',').map(tag => tag.trim()) : post.tags;
        post.image = image || post.image;
        post.published = published !== undefined ? published === 'true' : post.published;
        post.updatedAt = new Date();

        await post.save();
        await post.populate('author', 'username');

        res.json({
            message: '文章更新成功',
            post
        });
    } catch (error) {
        res.status(500).json({ error: '更新文章失败', details: error.message });
    }
});

// 删除文章
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: '文章不存在' });
        }

        if (post.author.toString() !== req.user.userId) {
            return res.status(403).json({ error: '无权限删除此文章' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: '文章删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除文章失败', details: error.message });
    }
});

// 添加评论
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;

        const comment = new Comment({
            content,
            author: req.user.userId,
            post: req.params.id
        });

        await comment.save();
        await comment.populate('author', 'username');

        res.status(201).json({
            message: '评论添加成功',
            comment
        });
    } catch (error) {
        res.status(500).json({ error: '添加评论失败', details: error.message });
    }
});

// 获取文章评论
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: '获取评论失败', details: error.message });
    }
});

// 文件上传
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        res.json({
            message: '文件上传成功',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ error: '文件上传失败', details: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`博客系统运行在 http://localhost:${PORT}`);
});

module.exports = app;

