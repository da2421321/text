# 电商后台管理系统

使用 TypeScript + Koa + MySQL 构建的电商后台管理系统。

## 功能特性

- ✅ 用户管理（管理员、商家、客户）
- ✅ 商品管理（CRUD、分类、库存）
- ✅ 订单管理（订单状态、支付状态）
- ✅ 分类管理
- ✅ 统计分析（销售统计、用户统计）
- ✅ 权限控制（基于角色的访问控制）
- ✅ 文件上传（商品图片）
- ✅ 分页、搜索、筛选

## 技术栈

- **TypeScript** - 类型安全
- **Koa** - 现代 Web 框架
- **MySQL** - 关系型数据库
- **TypeORM** - ORM 框架
- **JWT** - 身份认证
- **Multer** - 文件上传
- **class-validator** - 数据验证

## 项目结构

```
电商后台管理系统/
├── src/
│   ├── entity/           # 实体类（数据库表）
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Category.ts
│   │   ├── Order.ts
│   │   └── OrderItem.ts
│   ├── controller/       # 控制器
│   │   ├── UserController.ts
│   │   ├── ProductController.ts
│   │   ├── CategoryController.ts
│   │   └── OrderController.ts
│   ├── service/          # 业务逻辑层
│   │   ├── UserService.ts
│   │   ├── ProductService.ts
│   │   ├── CategoryService.ts
│   │   └── OrderService.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── routes/           # 路由
│   │   └── index.ts
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── utils/            # 工具函数
│   │   ├── jwt.ts
│   │   └── upload.ts
│   ├── config/           # 配置
│   │   └── database.ts
│   └── app.ts            # 应用入口
├── uploads/              # 上传文件目录
├── tsconfig.json
├── package.json
└── README.md
```

## 数据库设计

### User（用户表）
- id: INT (主键)
- username: VARCHAR(50)
- email: VARCHAR(100)
- password: VARCHAR(255)
- role: ENUM('admin', 'merchant', 'customer')
- createdAt: DATETIME
- updatedAt: DATETIME

### Category（分类表）
- id: INT (主键)
- name: VARCHAR(100)
- description: TEXT
- parentId: INT (外键，自关联)
- createdAt: DATETIME

### Product（商品表）
- id: INT (主键)
- name: VARCHAR(200)
- description: TEXT
- price: DECIMAL(10,2)
- stock: INT
- categoryId: INT (外键)
- sellerId: INT (外键 -> User)
- images: JSON
- status: ENUM('active', 'inactive', 'out_of_stock')
- createdAt: DATETIME
- updatedAt: DATETIME

### Order（订单表）
- id: INT (主键)
- orderNo: VARCHAR(50)
- userId: INT (外键)
- totalAmount: DECIMAL(10,2)
- status: ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled')
- paymentStatus: ENUM('unpaid', 'paid', 'refunded')
- shippingAddress: JSON
- createdAt: DATETIME
- updatedAt: DATETIME

### OrderItem（订单项表）
- id: INT (主键)
- orderId: INT (外键)
- productId: INT (外键)
- quantity: INT
- price: DECIMAL(10,2)
- subtotal: DECIMAL(10,2)

## 安装依赖

```bash
npm install
```

## 环境变量

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=ecommerce

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## 运行项目

```bash
# 开发模式
npm run dev

# 编译
npm run build

# 生产模式
npm start

# 数据库迁移
npm run migration:run
```

## API 文档

### 用户接口

#### 注册
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123",
  "role": "customer"
}
```

#### 登录
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123"
}
```

### 商品接口

#### 获取商品列表
```http
GET /api/products?page=1&limit=10&category=1
Authorization: Bearer {token}
```

#### 创建商品
```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "最新款 iPhone",
  "price": 9999.00,
  "stock": 100,
  "categoryId": 1,
  "images": ["image1.jpg", "image2.jpg"]
}
```

#### 更新商品
```http
PUT /api/products/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 8999.00,
  "stock": 80
}
```

#### 删除商品
```http
DELETE /api/products/:id
Authorization: Bearer {token}
```

### 订单接口

#### 创建订单
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市朝阳区xxx"
  }
}
```

#### 获取订单列表
```http
GET /api/orders?status=pending
Authorization: Bearer {token}
```

#### 更新订单状态
```http
PATCH /api/orders/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shipped"
}
```

## 权限设计

### 角色权限

- **admin（管理员）**
  - 所有权限
  - 用户管理
  - 全局数据查看

- **merchant（商家）**
  - 管理自己的商品
  - 查看自己的订单
  - 商品统计

- **customer（客户）**
  - 浏览商品
  - 下单
  - 查看自己的订单

## 学习要点

1. **TypeORM 使用**
   - Entity 定义
   - Repository 模式
   - 关系映射
   - 查询构建器

2. **Koa 与 TypeScript**
   - 中间件类型
   - 上下文类型
   - 路由组织

3. **权限控制**
   - RBAC（基于角色的访问控制）
   - 路由级权限
   - 数据级权限

4. **数据验证**
   - class-validator 使用
   - DTO 模式
   - 自定义验证器

5. **文件上传**
   - Multer 配置
   - 文件类型验证
   - 文件存储

## 后续扩展

- [ ] 购物车功能
- [ ] 优惠券系统
- [ ] 商品评价
- [ ] 库存预警
- [ ] 数据导出
- [ ] 支付对接
- [ ] 物流跟踪

