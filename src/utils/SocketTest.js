import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json());
app.use(express.static(join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'index.vue'));
});

io.on('connection', (socket) => {
    console.log('有用户进来了');
    socket.on('join', (username) => {
        console.log(`用户 ${username} 加入了`);
    });
});



server.listen(3000, () => {
    console.log(`http://localhost:${3000}`);
});