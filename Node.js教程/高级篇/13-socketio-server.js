const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());

// 存储在线用户
const onlineUsers = new Map();
const chatRooms = new Map();

// 1. 基础Socket连接
io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.id}`);
    
    // 2. 用户加入
    socket.on('join', (userData) => {
        const { username, room = 'general' } = userData;
        
        // 存储用户信息
        onlineUsers.set(socket.id, {
            id: socket.id,
            username,
            room,
            joinTime: new Date()
        });
        
        // 加入房间
        socket.join(room);
        
        // 通知房间内其他用户
        socket.to(room).emit('userJoined', {
            username,
            message: `${username} 加入了房间`
        });
        
        // 发送房间用户列表
        const roomUsers = Array.from(onlineUsers.values())
            .filter(user => user.room === room);
        io.to(room).emit('roomUsers', roomUsers);
        
        console.log(`${username} 加入了房间 ${room}`);
    });
    
    // 3. 发送消息
    socket.on('sendMessage', (messageData) => {
        const user = onlineUsers.get(socket.id);
        if (!user) return;
        
        const message = {
            id: Date.now(),
            username: user.username,
            text: messageData.text,
            timestamp: new Date(),
            room: user.room
        };
        
        // 广播到房间
        io.to(user.room).emit('newMessage', message);
        
        // 存储消息到房间历史
        if (!chatRooms.has(user.room)) {
            chatRooms.set(user.room, []);
        }
        chatRooms.get(user.room).push(message);
        
        console.log(`消息 [${user.room}]: ${user.username}: ${messageData.text}`);
    });
    
    // 4. 私聊消息
    socket.on('privateMessage', (data) => {
        const { targetUserId, message } = data;
        const sender = onlineUsers.get(socket.id);
        
        if (!sender) return;
        
        const privateMessage = {
            id: Date.now(),
            from: sender.username,
            to: targetUserId,
            text: message,
            timestamp: new Date()
        };
        
        // 发送给目标用户
        io.to(targetUserId).emit('privateMessage', privateMessage);
        
        console.log(`私聊: ${sender.username} -> ${targetUserId}: ${message}`);
    });
    
    // 5. 打字状态
    socket.on('typing', (data) => {
        const user = onlineUsers.get(socket.id);
        if (!user) return;
        
        socket.to(user.room).emit('userTyping', {
            username: user.username,
            isTyping: data.isTyping
        });
    });
    
    // 6. 房间切换
    socket.on('switchRoom', (newRoom) => {
        const user = onlineUsers.get(socket.id);
        if (!user) return;
        
        const oldRoom = user.room;
        
        // 离开旧房间
        socket.leave(oldRoom);
        socket.to(oldRoom).emit('userLeft', {
            username: user.username,
            message: `${user.username} 离开了房间`
        });
        
        // 加入新房间
        user.room = newRoom;
        socket.join(newRoom);
        
        socket.to(newRoom).emit('userJoined', {
            username: user.username,
            message: `${user.username} 加入了房间`
        });
        
        // 发送新房间用户列表
        const roomUsers = Array.from(onlineUsers.values())
            .filter(u => u.room === newRoom);
        io.to(newRoom).emit('roomUsers', roomUsers);
        
        // 发送房间历史消息
        const roomHistory = chatRooms.get(newRoom) || [];
        socket.emit('roomHistory', roomHistory);
        
        console.log(`${user.username} 从 ${oldRoom} 切换到 ${newRoom}`);
    });
    
    // 7. 断开连接
    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            socket.to(user.room).emit('userLeft', {
                username: user.username,
                message: `${user.username} 离开了房间`
            });
            
            onlineUsers.delete(socket.id);
            
            // 更新房间用户列表
            const roomUsers = Array.from(onlineUsers.values())
                .filter(u => u.room === user.room);
            io.to(user.room).emit('roomUsers', roomUsers);
            
            console.log(`用户断开连接: ${user.username}`);
        }
    });
});

// 8. HTTP路由
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/rooms', (req, res) => {
    const rooms = Array.from(chatRooms.keys());
    res.json({ rooms });
});

app.get('/api/online-users', (req, res) => {
    const users = Array.from(onlineUsers.values());
    res.json({ users });
});

// 9. 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Socket.io服务器运行在 http://localhost:${PORT}`);
});

module.exports = { app, server, io };

