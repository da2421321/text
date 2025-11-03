# 任务管理系统

一个使用 TypeScript + Express + MongoDB 构建的完整任务管理系统。

## 功能特性

- ✅ 用户认证（注册、登录、JWT）
- ✅ 任务 CRUD 操作
- ✅ 任务状态管理
- ✅ 任务优先级
- ✅ 任务分类/标签
- ✅ 用户权限管理
- ✅ RESTful API 设计
- ✅ 类型安全

## 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **Express** - Web 框架
- **MongoDB** - NoSQL 数据库
- **Mongoose** - MongoDB ODM
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **Joi** - 数据验证

## 项目结构

```
任务管理系统/
├── src/
│   ├── config/          # 配置文件
│   │   └── database.ts
│   ├── models/          # 数据模型
│   │   ├── User.ts
│   │   ├── Task.ts
│   │   └── Tag.ts
│   ├── controllers/     # 控制器
│   │   ├── authController.ts
│   │   ├── taskController.ts
│   │   └── tagController.ts
│   ├── routes/          # 路由
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   └── tags.ts
│   ├── middleware/      # 中间件
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── services/        # 业务逻辑
│   │   ├── authService.ts
│   │   ├── taskService.ts
│   │   └── tagService.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   ├── jwt.ts
│   │   └── password.ts
│   └── app.ts           # 应用入口
├── tests/               # 测试文件
├── tsconfig.json
├── package.json
└── README.md
```

## 安装依赖

```bash
npm install

# 开发依赖
npm install --save-dev typescript @types/node @types/express ts-node nodemon
```

## 环境变量

创建 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 运行项目

```bash
# 开发模式
npm run dev

# 编译
npm run build

# 生产模式
npm start
```

## API 文档

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123"
}
```

### 任务接口

#### 获取所有任务
```http
GET /api/tasks
Authorization: Bearer {token}
```

#### 创建任务
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "完成项目文档",
  "description": "编写项目的 README 和 API 文档",
  "priority": "high",
  "dueDate": "2024-12-31",
  "tags": ["文档", "重要"]
}
```

#### 更新任务
```http
PUT /api/tasks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "urgent"
}
```

#### 删除任务
```http
DELETE /api/tasks/:id
Authorization: Bearer {token}
```

## 数据模型

### User（用户）
- id: ObjectId
- username: string
- email: string
- password: string (加密)
- role: "admin" | "user"
- createdAt: Date
- updatedAt: Date

### Task（任务）
- id: ObjectId
- title: string
- description: string
- status: "todo" | "in_progress" | "done"
- priority: "low" | "medium" | "high" | "urgent"
- userId: ObjectId (ref: User)
- tags: string[]
- dueDate: Date
- createdAt: Date
- updatedAt: Date

### Tag（标签）
- id: ObjectId
- name: string
- color: string
- userId: ObjectId (ref: User)

## 学习要点

1. **类型安全的 API 开发**
   - 定义清晰的类型接口
   - 使用泛型提高代码复用性
   - 类型守卫和断言

2. **Express 与 TypeScript 集成**
   - 中间件类型定义
   - 请求和响应类型
   - 错误处理

3. **Mongoose 与 TypeScript**
   - Schema 定义
   - 模型类型
   - 查询类型安全

4. **认证与授权**
   - JWT 实现
   - 密码加密
   - 权限验证

5. **RESTful API 设计**
   - 资源路由
   - HTTP 方法
   - 状态码

## 后续扩展

- [ ] 任务协作功能
- [ ] 任务评论
- [ ] 文件附件上传
- [ ] 任务统计图表
- [ ] 邮件通知
- [ ] WebSocket 实时更新

