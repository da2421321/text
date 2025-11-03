// app.js
import express from 'express'; // 使用 import 导入 express
import pool from './Mysql配置.js'; // 注意：导入本地模块时必须带文件扩展名 .js

const app = express();
const port = 3000;

app.use(express.json());

// --- CRUD 操作路由 ---

// 1. C (Create): 添加新用户
app.post('/users', async (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: '姓名和邮箱是必填项。' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO user (name, email, age) VALUES (?, ?, ?)',
      [name, email, age]
    );
    res.status(201).json({
      message: '用户创建成功',
      userId: result.insertId,
      user: { id: result.insertId, name, email, age }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '该邮箱已被注册。' });
    }
    console.error('创建用户失败:', error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});

// 2. R (Read All): 获取所有用户
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM user');
    res.json(rows);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});

// 2. R (Read One): 根据 ID 获取特定用户
app.get('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: '无效的用户ID。' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM user WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户未找到。' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(`获取用户ID ${id} 失败:`, error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});

// 3. U (Update): 更新用户
app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, age } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: '无效的用户ID。' });
  }
  if (!name && !email && age === undefined) {
    return res.status(400).json({ message: '请提供要更新的字段。' });
  }

  try {
    let query = 'UPDATE user SET ';
    const params = [];
    const updates = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      params.push(age);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户未找到或没有内容更新。' });
    }
    res.json({ message: '用户更新成功。' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '该邮箱已被其他用户注册。' });
    }
    console.error(`更新用户ID ${id} 失败:`, error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});

// 4. D (Delete): 删除用户
app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: '无效的用户ID。' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM user WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户未找到。' });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error(`删除用户ID ${id} 失败:`, error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});

// --- 错误处理和服务器启动 ---

// 404 路由处理
app.use((req, res, next) => {
  res.status(404).json({ message: 'Sorry, 找不到您请求的资源！' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log('测试接口:');
  console.log(`  GET    http://localhost:${port}/users`);
  console.log(`  POST   http://localhost:${port}/users`);
  console.log(`  GET    http://localhost:${port}/users/:id`);
  console.log(`  PUT    http://localhost:${port}/users/:id`);
  console.log(`  DELETE http://localhost:${port}/users/:id`);
});