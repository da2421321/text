import express from 'express';


const app = express();

// 模拟一个会抛出错误的路由
app.get('/error', (req, res, next) => {
    const err = new Error('这是一个模拟错误！');
    err.status = 400; // 自定义错误状态码
    next(err); // 将错误传递给下一个错误处理中间件
});

// 404 错误处理
app.use((req, res, next) => {
    res.status(404).send('抱歉，找不到您要的页面！');
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack); // 打印错误堆栈到控制台
    res.status(err.status || 500).json({
        message: err.message || '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err : {}, // 生产环境不暴露详细错误信息
        status: err.status || 500
    });
});

app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});