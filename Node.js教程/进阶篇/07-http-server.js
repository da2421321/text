const http = require('http');
const url = require('url');
const querystring = require('querystring');

// 1. 基础HTTP服务器
const server = http.createServer((req, res) => {
    // 设置响应头
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 解析URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    console.log(`请求方法: ${req.method}`);
    console.log(`请求路径: ${pathname}`);
    console.log(`查询参数:`, query);
    
    // 路由处理
    if (pathname === '/') {
        res.writeHead(200);
        res.end(`
            <h1>欢迎来到Node.js HTTP服务器</h1>
            <p>当前时间: ${new Date().toLocaleString()}</p>
            <ul>
                <li><a href="/api/users">获取用户列表</a></li>
                <li><a href="/api/time">获取服务器时间</a></li>
                <li><a href="/form">表单页面</a></li>
            </ul>
        `);
    } else if (pathname === '/api/users') {
        // API接口
        const users = [
            { id: 1, name: '张三', age: 25 },
            { id: 2, name: '李四', age: 30 },
            { id: 3, name: '王五', age: 28 }
        ];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
    } else if (pathname === '/api/time') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            timestamp: Date.now(),
            datetime: new Date().toISOString()
        }));
    } else if (pathname === '/form') {
        // 表单处理
        if (req.method === 'GET') {
            res.writeHead(200);
            res.end(`
                <form method="POST" action="/form">
                    <h2>用户信息表单</h2>
                    <p>
                        <label>姓名: </label>
                        <input type="text" name="name" required>
                    </p>
                    <p>
                        <label>邮箱: </label>
                        <input type="email" name="email" required>
                    </p>
                    <p>
                        <label>年龄: </label>
                        <input type="number" name="age" min="1" max="120">
                    </p>
                    <p>
                        <button type="submit">提交</button>
                    </p>
                </form>
            `);
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const formData = querystring.parse(body);
                console.log('表单数据:', formData);
                res.writeHead(200);
                res.end(`
                    <h2>提交成功!</h2>
                    <p>姓名: ${formData.name}</p>
                    <p>邮箱: ${formData.email}</p>
                    <p>年龄: ${formData.age}</p>
                    <a href="/form">返回表单</a>
                `);
            });
        }
    } else {
        res.writeHead(404);
        res.end('<h1>404 - 页面未找到</h1>');
    }
});

// 2. 错误处理
server.on('error', (err) => {
    console.error('服务器错误:', err);
});

// 3. 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('按 Ctrl+C 停止服务器');
});

// 4. 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
