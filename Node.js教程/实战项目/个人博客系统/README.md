# 个人博客系统

一个基于Node.js、Express、MongoDB的完整个人博客系统。

## 功能特性

- ✅ 用户注册/登录
- ✅ JWT身份认证
- ✅ 文章发布/编辑/删除
- ✅ 图片上传
- ✅ 评论系统
- ✅ 标签分类
- ✅ 搜索功能
- ✅ 响应式设计

## 技术栈

- **后端**: Node.js, Express.js
- **数据库**: MongoDB, Mongoose
- **认证**: JWT, bcrypt
- **文件上传**: Multer
- **前端**: HTML5, CSS3, JavaScript

## 快速开始

### 环境要求

- Node.js 16.0+
- MongoDB 4.0+

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd personal-blog-system
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件
```

4. 启动MongoDB
```bash
# 确保MongoDB服务正在运行
mongod
```

5. 启动应用
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

6. 访问应用
```
http://localhost:3000
```

## API文档

### 认证接口

#### 用户注册
```
POST /api/register
Content-Type: application/json

{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码"
}
```

#### 用户登录
```
POST /api/login
Content-Type: application/json

{
  "email": "邮箱",
  "password": "密码"
}
```

### 文章接口

#### 获取文章列表
```
GET /api/posts?page=1&limit=10&tag=标签&search=搜索词
```

#### 获取单篇文章
```
GET /api/posts/:id
```

#### 创建文章
```
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "文章标题",
  "content": "文章内容",
  "tags": "标签1,标签2",
  "published": true,
  "image": <文件>
}
```

#### 更新文章
```
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 删除文章
```
DELETE /api/posts/:id
Authorization: Bearer <token>
```

### 评论接口

#### 添加评论
```
POST /api/posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "评论内容"
}
```

#### 获取文章评论
```
GET /api/posts/:id/comments
```

## 项目结构

```
personal-blog-system/
├── app.js                 # 主应用文件
├── package.json           # 项目配置
├── README.md             # 项目说明
├── public/               # 静态文件
│   └── index.html        # 前端页面
├── uploads/              # 上传文件目录
└── .env                  # 环境变量配置
```

## 数据库模型

### User (用户)
- username: 用户名
- email: 邮箱
- password: 密码(加密)
- avatar: 头像
- createdAt: 创建时间

### Post (文章)
- title: 标题
- content: 内容
- author: 作者ID
- tags: 标签数组
- image: 图片
- published: 是否发布
- createdAt: 创建时间
- updatedAt: 更新时间

### Comment (评论)
- content: 内容
- author: 作者ID
- post: 文章ID
- createdAt: 创建时间

## 部署说明

### 使用PM2部署

1. 安装PM2
```bash
npm install -g pm2
```

2. 启动应用
```bash
pm2 start app.js --name "blog-system"
```

3. 查看状态
```bash
pm2 status
pm2 logs blog-system
```

### 使用Docker部署

1. 创建Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. 构建镜像
```bash
docker build -t blog-system .
```

3. 运行容器
```bash
docker run -p 3000:3000 blog-system
```

## 开发指南

### 添加新功能

1. 在`app.js`中添加路由
2. 创建对应的数据模型
3. 更新前端页面
4. 测试功能

### 代码规范

- 使用ES6+语法
- 添加适当的注释
- 遵循RESTful API设计
- 错误处理要完善

## 常见问题

### Q: 如何修改端口？
A: 设置环境变量`PORT`或修改`app.js`中的端口号。

### Q: 如何配置数据库？
A: 修改`mongoose.connect()`中的连接字符串。

### Q: 如何添加新的API接口？
A: 在`app.js`中添加新的路由处理函数。

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

