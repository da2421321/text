import express from 'express';

const app = express();

// 日志中间件
app.use((req, res, next) => {
  console.log('请求时间:', Date.now());
  next(); // 调用 next() 将控制权传递给下一个中间件或路由处理程序
});

// 解析 JSON 请求体的中间件
app.use(express.json());

app.post('/data', (req, res) => {
  console.log('接收到的数据:', req.body);
  res.send('数据已接收！');
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});