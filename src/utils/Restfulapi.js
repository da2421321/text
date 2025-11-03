import express from 'express';
const app = express();
app.use(express.json()); // 解析 JSON 请求体

let users = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
];

// 获取所有用户
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 获取特定用户
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).send('未找到该用户');
  res.json(user);
});

// 添加新用户
app.post('/api/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: req.body.name,
    age: req.body.age,
  };
  users.push(newUser);
  res.status("201").json(newUser);
});

// 更新用户
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).send('未找到该用户');

  user.name = req.body.name || user.name;
  user.age = req.body.age || user.age;
  res.send(user);
});

// 删除用户
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).send('未找到该用户');

  users.splice(index, 1);
  res.status(204).send(); // 204 No Content
});

app.listen(3000, () => {
  console.log('API 服务器运行在 http://localhost:3000');
});