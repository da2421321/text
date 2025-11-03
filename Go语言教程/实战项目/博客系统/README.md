# 博客系统

## 项目简介

这是一个使用Go语言和Gin框架开发的博客系统，支持用户注册、登录、文章发布、评论等功能。

## 功能特性

- 用户认证（注册、登录、JWT令牌）
- 文章管理（创建、编辑、删除、列表、详情）
- 评论系统
- 标签分类
- Markdown支持
- RESTful API设计
- 数据库迁移
- 单元测试
- Docker部署

## 技术栈

- **后端**: Go + Gin + GORM
- **数据库**: MySQL/PostgreSQL
- **认证**: JWT
- **部署**: Docker + Docker Compose
- **监控**: Prometheus + Grafana
- **日志**: Logrus
- **测试**: Go Test

## 目录结构

```
博客系统/
├── api/                 # API路由和处理器
├── config/              # 配置文件
├── database/            # 数据库相关
├── middleware/          # 中间件
├── models/              # 数据模型
├── utils/               # 工具函数
├── tests/               # 测试文件
├── docs/                # API文档
├── deployments/         # 部署文件
├── main.go             # 入口文件
├── go.mod              # Go模块文件
└── README.md           # 项目说明
```

## 快速开始

### 环境要求

- Go 1.19+
- Docker (可选)
- MySQL/PostgreSQL

### 本地运行

1. 克隆项目
```bash
git clone <repository-url>
cd 博客系统
```

2. 安装依赖
```bash
go mod tidy
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库连接等信息
```

4. 运行应用
```bash
go run main.go
```

### Docker部署

```bash
docker-compose up -d
```

## API接口

### 认证接口

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 用户接口

- `GET /api/v1/users/:id` - 获取用户信息
- `PUT /api/v1/users/:id` - 更新用户信息

### 文章接口

- `GET /api/v1/articles` - 获取文章列表
- `GET /api/v1/articles/:id` - 获取文章详情
- `POST /api/v1/articles` - 创建文章
- `PUT /api/v1/articles/:id` - 更新文章
- `DELETE /api/v1/articles/:id` - 删除文章

### 评论接口

- `GET /api/v1/articles/:id/comments` - 获取文章评论
- `POST /api/v1/articles/:id/comments` - 创建评论
- `DELETE /api/v1/comments/:id` - 删除评论

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 文章表 (articles)
```sql
CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    user_id BIGINT NOT NULL,
    status TINYINT DEFAULT 1, -- 1:草稿 2:已发布
    view_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 评论表 (comments)
```sql
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL,
    article_id BIGINT NOT NULL,
    parent_id BIGINT DEFAULT NULL, -- 回复评论的ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
);
```

### 标签表 (tags)
```sql
CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 文章标签关联表 (article_tags)
```sql
CREATE TABLE article_tags (
    article_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

## 配置说明

### 环境变量

```env
# 服务器配置
SERVER_PORT=8080
SERVER_HOST=localhost

# 数据库配置
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=blog

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 测试

### 运行单元测试

```bash
go test ./tests/... -v
```

### 运行基准测试

```bash
go test ./tests/... -bench=. -benchmem
```

## 部署

### Docker部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=database
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=blog
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: blog
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### Kubernetes部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blog-app
  template:
    metadata:
      labels:
        app: blog-app
    spec:
      containers:
      - name: blog-app
        image: your-registry/blog-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "mysql-service"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
```

## 监控

### Prometheus指标

应用集成了Prometheus监控指标：

- HTTP请求总数
- HTTP请求延迟
- 活跃用户数
- 数据库连接数

### Grafana仪表板

提供预配置的Grafana仪表板，可视化应用性能指标。

## 安全特性

- 密码加密存储
- JWT令牌认证
- SQL注入防护
- XSS防护
- 速率限制
- CORS配置

## 性能优化

- 数据库连接池
- Redis缓存
- 数据库索引优化
- HTTP压缩
- 静态资源缓存

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请联系项目维护者。