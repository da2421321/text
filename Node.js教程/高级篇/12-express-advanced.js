const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// 1. 安全中间件
app.use(helmet());

// 2. CORS配置
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
}));

// 3. Cookie解析
app.use(cookieParser());

// 4. Session配置
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTPS环境下设为true
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 5. 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 6. 请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
});

// 7. 认证中间件
const authenticate = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: '未授权访问' });
    }
};

// 8. 路由模块化
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// 9. 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

module.exports = app;

