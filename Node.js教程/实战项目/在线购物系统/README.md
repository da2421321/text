# Node.js 实战项目 - 在线购物系统

## 项目简介

这是一个完整的Node.js电商平台，包含用户管理、商品管理、购物车、订单管理等核心功能。

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: MongoDB / MySQL
- **认证**: JWT
- **文件上传**: Multer
- **实时通信**: Socket.io
- **支付**: 模拟支付接口

## 功能特性

### 用户功能
- ✅ 用户注册/登录
- ✅ 个人信息管理
- ✅ 地址管理
- ✅ 购物车管理
- ✅ 订单管理
- ✅ 收藏夹

### 商品功能
- ✅ 商品浏览
- ✅ 商品分类
- ✅ 商品搜索
- ✅ 商品详情
- ✅ 商品评价

### 管理员功能
- ✅ 商品管理
- ✅ 订单管理
- ✅ 用户管理
- ✅ 数据统计

## 项目结构

```
在线购物系统/
├── app.js              # 应用入口
├── config/             # 配置文件
│   ├── database.js     # 数据库配置
│   └── auth.js         # 认证配置
├── controllers/        # 控制器
│   ├── userController.js
│   ├── productController.js
│   └── orderController.js
├── models/             # 数据模型
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/             # 路由
│   ├── users.js
│   ├── products.js
│   └── orders.js
├── middleware/         # 中间件
│   ├── auth.js
│   └── upload.js
├── public/             # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
├── views/              # 模板文件
├── utils/              # 工具函数
└── tests/              # 测试文件
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 3. 初始化数据库
```bash
npm run db:init
```

### 4. 启动服务
```bash
npm start
```

### 5. 访问应用
```
http://localhost:3000
```

## API 文档

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息

### 商品相关
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品（管理员）

### 订单相关
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/status` - 更新订单状态

## 学习要点

1. **Express.js 应用架构**
2. **RESTful API 设计**
3. **数据库设计与操作**
4. **用户认证与授权**
5. **文件上传处理**
6. **错误处理与日志记录**
7. **性能优化**
8. **单元测试**

## 教程章节

1. [项目初始化](./docs/01-项目初始化.md)
2. [数据库设计](./docs/02-数据库设计.md)
3. [用户系统开发](./docs/03-用户系统开发.md)
4. [商品管理系统](./docs/04-商品管理系统.md)
5. [购物车功能](./docs/05-购物车功能.md)
6. [订单系统](./docs/06-订单系统.md)
7. [支付集成](./docs/07-支付集成.md)
8. [性能优化](./docs/08-性能优化.md)
9. [部署上线](./docs/09-部署上线.md)

## 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 RESTful API 设计规范
- 完善的错误处理和日志记录
- 充分的单元测试覆盖

## 贡献指南

1. Fork 本项目
2. 创建功能分支
3. 提交你的修改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License