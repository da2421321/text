const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. 中间件配置
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体
app.use(express.static('public')); // 静态文件服务

// 2. 自定义中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    req.startTime = Date.now();
    next();
});

// 3. 路由处理
app.get('/', (req, res) => {
    res.json({
        message: '欢迎来到Express服务器',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 4. 参数路由
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;
    
    res.json({
        userId: id,
        page: page || 1,
        limit: limit || 10,
        message: `用户 ${id} 的信息`
    });
});

// 5. POST请求处理
app.post('/users', (req, res) => {
    const { name, email, age } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            error: '姓名和邮箱是必填项'
        });
    }
    
    const user = {
        id: Date.now(),
        name,
        email,
        age: age || 0,
        createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
        message: '用户创建成功',
        user
    });
});

// 6. 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

// 7. 404处理
app.use((req, res) => {
    res.status(404).json({
        error: '页面未找到',
        path: req.url
    });
});

// 8. 启动服务器
app.listen(PORT, () => {
    console.log(`Express服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;

