# 在线商城系统

## 项目简介

这是一个使用Go语言开发的在线商城系统，采用现代化的Web开发技术栈，包括Gin框架、GORM ORM库、JWT认证等。

## 功能特性

- 用户注册与登录
- 商品管理（增删改查）
- 购物车功能
- 订单管理
- 支付集成
- 库存管理
- 商品分类与标签
- 用户评价系统
- 管理员后台

## 技术栈

- **语言**: Go
- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL
- **认证**: JWT
- **缓存**: Redis
- **消息队列**: RabbitMQ
- **API文档**: Swagger
- **部署**: Docker, Docker Compose

## 目录结构

```
在线商城/
├── README.md
├── main.go
├── go.mod
├── go.sum
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── docs/
│   └── swagger.json
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── app/
│   ├── config/
│   ├── handler/
│   ├── middleware/
│   ├── model/
│   ├── repository/
│   ├── service/
│   └── utils/
├── pkg/
├── web/
│   ├── public/
│   └── templates/
├── scripts/
└── tests/
```

## 数据库设计

### 用户表 (users)
- id: 主键
- username: 用户名
- email: 邮箱
- password: 密码（加密存储）
- first_name: 名字
- last_name: 姓氏
- phone: 电话
- address: 地址
- created_at: 创建时间
- updated_at: 更新时间

### 商品表 (products)
- id: 主键
- name: 商品名称
- description: 描述
- price: 价格
- stock: 库存
- category_id: 分类ID
- image_url: 图片链接
- status: 状态（上架/下架）
- created_at: 创建时间
- updated_at: 更新时间

### 分类表 (categories)
- id: 主键
- name: 分类名称
- description: 描述
- created_at: 创建时间
- updated_at: 更新时间

### 购物车表 (carts)
- id: 主键
- user_id: 用户ID
- product_id: 商品ID
- quantity: 数量
- created_at: 创建时间
- updated_at: 更新时间

### 订单表 (orders)
- id: 主键
- user_id: 用户ID
- total_amount: 总金额
- status: 订单状态
- shipping_address: 收货地址
- payment_method: 支付方式
- created_at: 创建时间
- updated_at: 更新时间

### 订单项表 (order_items)
- id: 主键
- order_id: 订单ID
- product_id: 商品ID
- quantity: 数量
- price: 价格
- created_at: 创建时间

## API接口

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 用户相关
- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息

### 商品相关
- `GET /api/v1/products` - 获取商品列表
- `GET /api/v1/products/:id` - 获取商品详情
- `POST /api/v1/products` - 创建商品（管理员）
- `PUT /api/v1/products/:id` - 更新商品（管理员）
- `DELETE /api/v1/products/:id` - 删除商品（管理员）

### 购物车相关
- `GET /api/v1/cart` - 获取购物车
- `POST /api/v1/cart` - 添加商品到购物车
- `PUT /api/v1/cart/:id` - 更新购物车商品数量
- `DELETE /api/v1/cart/:id` - 从购物车删除商品

### 订单相关
- `GET /api/v1/orders` - 获取订单列表
- `GET /api/v1/orders/:id` - 获取订单详情
- `POST /api/v1/orders` - 创建订单
- `PUT /api/v1/orders/:id/cancel` - 取消订单

## 部署说明

### 本地开发

1. 克隆项目
2. 安装依赖：`go mod tidy`
3. 配置环境变量
4. 启动数据库
5. 运行项目：`go run main.go`

### Docker部署

```bash
docker-compose up -d
```

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License