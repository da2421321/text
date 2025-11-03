//构建服务器
import express from 'express';
const app = express();
const port = 3000;

// 定义路由
app.get('/', (req, res) => {
  res.send('你好，Express!');
});

app.get('/users/:id', (req, res) => {
  res.send(`你访问的用户ID是：${req.params.id}`);
});

// 启动服务器
app.listen(port, () => {
  console.log(`Express 应用运行在 http://localhost:${port}/`);
});