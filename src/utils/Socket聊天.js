import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);

// 获取当前文件路径 (适用于 ES 模块)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 设置静态文件目录 - 这至关重要！
// 它告诉 Express 从 'views' 目录提供 index.html 和 client.js 等文件
app.use(express.static(join(__dirname, 'views')));

// 访问根 URL 时提供 index.html 文件    
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'index.html'));
});


// 存储在线用户
const users = {};

// Socket.io 连接处理
io.on('connection', (socket) => {
    console.log('新用户连接');

    // 用户加入聊天室
    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('message', {
            user: '系统',
            text: `${username} 加入了聊天室`
        });
        io.emit('updateUsers', users);
    });

    // 接收并广播消息
    socket.on('sendMessage', (message) => {
        io.emit('message', {
            user: users[socket.id],
            text: message
        });
    });

    // 用户断开连接
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            io.emit('message', {
                user: '系统',
                text: `${username} 离开了聊天室`
            });
            io.emit('updateUsers', users);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});