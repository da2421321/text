/**
 * 在线购物系统 - 主应用文件
 * 这是一个完整的Node.js电商应用示例
 * 
 * 学习要点：
 * 1. Express应用架构设计
 * 2. 中间件使用和配置
 * 3. 路由组织和管理
 * 4. 错误处理机制
 * 5. 安全性配置
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 导入路由
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 启动在线购物系统...\n');

// ===============================================
// 数据库连接
// ===============================================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB 数据库连接成功');
})
.catch((error) => {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
});

// ===============================================
// 安全性中间件
// ===============================================

// Helmet - 设置安全相关的HTTP头
app.use(helmet());

// CORS - 跨域资源共享
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制 - 防止暴力攻击
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP每15分钟最多100个请求
    message: {
        error: '请求过于频繁，请稍后再试',
        retryAfter: '15分钟'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ===============================================
// 通用中间件
// ===============================================

// 请求日志
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// 压缩响应
app.use(compression());

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================================
// 路由配置
// ===============================================

// 健康检查
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API路由
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '🛒 欢迎使用Node.js在线购物系统',
        version: '1.0.0',
        author: 'Node.js教程',
        endpoints: {
            health: '/health',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            cart: '/api/cart'
        },
        documentation: '/api/docs'
    });
});

// API文档
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Node.js购物系统 API文档',
        baseUrl: req.protocol + '://' + req.get('host'),
        endpoints: {
            users: {
                'POST /api/users/register': '用户注册',
                'POST /api/users/login': '用户登录',
                'GET /api/users/profile': '获取用户信息',
                'PUT /api/users/profile': '更新用户信息'
            },
            products: {
                'GET /api/products': '获取商品列表',
                'GET /api/products/:id': '获取商品详情',
                'POST /api/products': '创建商品（需管理员权限）',
                'PUT /api/products/:id': '更新商品（需管理员权限）',
                'DELETE /api/products/:id': '删除商品（需管理员权限）'
            },
            orders: {
                'POST /api/orders': '创建订单',
                'GET /api/orders': '获取用户订单列表',
                'GET /api/orders/:id': '获取订单详情',
                'PUT /api/orders/:id/status': '更新订单状态'
            },
            cart: {
                'GET /api/cart': '获取购物车',
                'POST /api/cart/add': '添加商品到购物车',
                'PUT /api/cart/update': '更新购物车商品数量',
                'DELETE /api/cart/remove/:productId': '从购物车移除商品'
            }
        },
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            note: '大部分API需要用户登录后获取的JWT token'
        }
    });
});

// ===============================================
// 错误处理中间件
// ===============================================

// 404 处理
app.use(notFound);

// 全局错误处理
app.use(errorHandler);

// ===============================================
// 服务器启动
// ===============================================

const server = app.listen(PORT, () => {
    console.log(`\n🎉 服务器成功启动！`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 访问地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api/docs`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health\n`);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('📊 收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
        console.log('✅ HTTP服务器已关闭');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB连接已关闭');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n📊 收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
        console.log('✅ HTTP服务器已关闭');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB连接已关闭');
            process.exit(0);
        });
    });
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
    console.error('💥 未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});

module.exports = app;