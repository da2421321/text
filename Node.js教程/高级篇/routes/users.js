const express = require('express');
const router = express.Router();

// 模拟用户数据
let users = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25 },
    { id: 2, name: '李四', email: 'lisi@example.com', age: 30 },
    { id: 3, name: '王五', email: 'wangwu@example.com', age: 28 }
];

// 获取所有用户
router.get('/', (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    let filteredUsers = users;
    
    if (search) {
        filteredUsers = users.filter(user => 
            user.name.includes(search) || user.email.includes(search)
        );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
        users: paginatedUsers,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredUsers.length,
            pages: Math.ceil(filteredUsers.length / limit)
        }
    });
});

// 获取单个用户
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === parseInt(id));
    
    if (!user) {
        return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(user);
});

// 创建用户
router.post('/', (req, res) => {
    const { name, email, age } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: '姓名和邮箱是必填项' });
    }
    
    const newUser = {
        id: Math.max(...users.map(u => u.id)) + 1,
        name,
        email,
        age: age || 0,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
});

// 更新用户
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, age } = req.body;
    
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
        return res.status(404).json({ error: '用户不存在' });
    }
    
    users[userIndex] = {
        ...users[userIndex],
        name: name || users[userIndex].name,
        email: email || users[userIndex].email,
        age: age !== undefined ? age : users[userIndex].age,
        updatedAt: new Date().toISOString()
    };
    
    res.json(users[userIndex]);
});

// 删除用户
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
        return res.status(404).json({ error: '用户不存在' });
    }
    
    users.splice(userIndex, 1);
    res.status(204).send();
});

module.exports = router;

