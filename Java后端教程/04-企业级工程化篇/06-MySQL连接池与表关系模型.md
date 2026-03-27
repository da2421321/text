# 06 - MySQL 连接池与表关系模型（零基础详解版）

> **本章目标**：理解数据库连接池原理，掌握 HikariCP 配置，学会设计表关系和索引  
> **预计耗时**：3~4 小时

---

## 一、什么是数据库连接池？

### 1.1 生活类比

```
没有连接池 = 每次打电话都买一部新手机：
  打电话 → 买手机 → 打完 → 扔掉
  再打电话 → 再买 → 再扔
  问题：买手机（建连接）很贵很慢！

有连接池 = 公司有10部座机：
  打电话 → 从座机架拿一部 → 打完 → 放回座机架
  再打电话 → 拿另一部 → 打完 → 放回
  好处：手机（连接）重复使用，快！
```

### 1.2 技术原理

```
应用启动时
  → 预先创建 N 个数据库连接，放入"连接池"

请求来了
  → 从池中借一个连接
  → 执行 SQL
  → 归还连接到池中

好处：
  ✅ 避免频繁创建/销毁连接（创建一个连接约需 30~50ms）
  ✅ 控制最大连接数（防止数据库被压垮）
  ✅ 连接复用，性能大幅提升
```

---

## 二、HikariCP 配置详解

Spring Boot 默认使用 HikariCP（目前最快的连接池）。

### 2.1 完整配置

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4
    username: root
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

    hikari:
      # === 连接数配置 ===
      maximum-pool-size: 20      # 最大连接数（默认10）
      minimum-idle: 5            # 最小空闲连接数（默认=最大连接数）

      # === 超时配置 ===
      connection-timeout: 30000  # 获取连接的超时时间（ms），超时抛异常
      idle-timeout: 600000       # 空闲连接存活时间（ms），10分钟
      max-lifetime: 1800000      # 连接最大生命周期（ms），30分钟
      validation-timeout: 5000   # 连接检测超时时间（ms）

      # === 其他 ===
      pool-name: demo-pool       # 连接池名称（日志中显示）
      leak-detection-threshold: 60000  # 连接泄漏检测阈值（ms）
```

### 2.2 连接数怎么算？

```
经验公式：最大连接数 = (CPU核数 × 2) + 有效磁盘数

示例：4核CPU 服务器
  最大连接数 = 4 × 2 + 1 = 9 ≈ 10

实际建议：
  开发环境: 5~10
  生产环境: 10~30（根据并发量调整）
  
注意：并不是越多越好！连接数太多，数据库反而因为上下文切换变慢
```

### 2.3 连接泄漏检测

```yaml
hikari:
  leak-detection-threshold: 60000
  # 如果一个连接被借出去超过60秒还没归还，日志会打印警告
  # 帮你发现忘记关闭连接的代码 Bug
```

---

## 三、表关系设计

### 3.1 常见的四种关系

```
一对一（1:1）：
  用户表 ↔ 用户详情表
  一个用户对应一条详情

一对多（1:N）：
  用户表 → 订单表
  一个用户可以有多个订单
  每个订单只属于一个用户

多对一（N:1）：
  订单表 → 用户表（一对多的反向）

多对多（M:N）：
  用户表 ↔ 角色表
  一个用户可以有多个角色
  一个角色可以分配给多个用户
  通过中间表 user_roles 关联
```

### 3.2 SQL 建表实战

```sql
-- ==================== 用户表 ====================
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(200) NOT NULL COMMENT '密码（BCrypt加密）',
    email       VARCHAR(100) NOT NULL COMMENT '邮箱',
    avatar      VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    enabled     TINYINT(1) DEFAULT 1 COMMENT '是否启用 0禁用 1启用',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';


-- ==================== 角色表 ====================
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名 ADMIN/USER',
    description VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';


-- ==================== 用户角色中间表（多对多） ====================
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),              -- 联合主键
    FOREIGN KEY (user_id) REFERENCES users(id),  -- 外键约束
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';


-- ==================== 商品表 ====================
CREATE TABLE products (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL COMMENT '商品名称',
    price       DECIMAL(10,2) NOT NULL COMMENT '价格',
    stock       INT NOT NULL DEFAULT 0 COMMENT '库存',
    category    VARCHAR(50) NOT NULL COMMENT '分类',
    description TEXT COMMENT '描述',
    status      VARCHAR(20) DEFAULT 'ON_SHELF' COMMENT '状态 ON_SHELF/OFF_SHELF',
    version     INT DEFAULT 0 COMMENT '乐观锁版本号',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';


-- ==================== 订单表 ====================
CREATE TABLE orders (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no     VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
    user_id      BIGINT NOT NULL COMMENT '下单用户ID',
    total_amount DECIMAL(12,2) NOT NULL COMMENT '订单总金额',
    status       VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态',
    remark       VARCHAR(500) DEFAULT NULL COMMENT '备注',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';


-- ==================== 订单明细表 ====================
CREATE TABLE order_items (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id   BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity   INT NOT NULL COMMENT '数量',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '下单时单价（快照）',

    INDEX idx_order_id (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';
```

---

## 四、索引设计

### 4.1 什么是索引？

```
没有索引 = 在一本没有目录的书里找内容：
  → 从第1页翻到最后一页，逐页查找（全表扫描）

有索引 = 先看目录，直接翻到对应页：
  → 根据目录快速定位（索引查找）
```

### 4.2 哪些字段需要加索引？

```
✅ 必须加索引：
  1. WHERE 条件经常查询的字段（username, email）
  2. 外键字段（user_id, order_id）
  3. ORDER BY 排序的字段（created_at）
  4. 唯一约束的字段（order_no）

❌ 不需要加索引：
  1. 很少用于查询条件的字段
  2. 数据量很少的表（<1000行）
  3. 频繁更新的字段（索引维护有开销）
  4. 值重复率极高的字段（如性别：只有男/女）
```

### 4.3 组合索引和最左前缀原则

```sql
-- 组合索引（多个字段组合在一起）
CREATE INDEX idx_user_status_created ON orders(user_id, status, created_at);

-- 最左前缀原则：查询必须包含最左边的字段，索引才生效
-- ✅ 能用到索引：
WHERE user_id = 1
WHERE user_id = 1 AND status = 'PAID'
WHERE user_id = 1 AND status = 'PAID' AND created_at > '2024-01-01'

-- ❌ 用不到索引：
WHERE status = 'PAID'                              -- 缺少最左的 user_id
WHERE created_at > '2024-01-01'                    -- 缺少最左的 user_id
WHERE status = 'PAID' AND created_at > '2024-01-01' -- 缺少最左的 user_id
```

---

## 五、慢查询排查

### 5.1 开启慢查询日志

```sql
-- MySQL 配置
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 1;  -- 超过1秒的查询记录下来
```

### 5.2 用 EXPLAIN 分析

```sql
-- 在 SQL 前加 EXPLAIN 查看执行计划
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND status = 'PAID';

-- 重点看这几列：
-- type:    访问类型（ALL全表扫描 → index索引扫描 → ref引用 → const常量）
-- key:     实际使用的索引
-- rows:    预估扫描的行数（越少越好）
-- Extra:   额外信息（Using index 表示覆盖索引，性能好）
```

### 5.3 常见优化

| 问题 | 解决方案 |
|------|---------|
| type = ALL（全表扫描） | 给 WHERE 字段加索引 |
| rows 很大 | 优化查询条件，加索引 |
| Using filesort | 给 ORDER BY 字段加索引 |
| 子查询慢 | 改写为 JOIN |
| SELECT * | 只查需要的字段 |
| LIKE '%xxx%' | 前缀模糊查询无法用索引，考虑全文索引 |

---

## 六、事务隔离级别

```
读未提交(Read Uncommitted)：能读到别人未提交的数据（脏读）→ 几乎不用
读已提交(Read Committed)：只能读到已提交的数据 → Oracle 默认
可重复读(Repeatable Read)：同一事务中多次读取结果一致 → MySQL 默认 ⭐
串行化(Serializable)：完全隔离 → 性能最差，几乎不用
```

MySQL 默认的"可重复读"对大多数场景足够了，不需要修改。

---

## 七、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| 连接池原理 | ⭐⭐⭐ 必须 | 复用连接，避免频繁创建销毁 |
| HikariCP 配置 | ⭐⭐ 重要 | 控制最大连接数和超时 |
| 表关系设计 | ⭐⭐⭐ 必须 | 一对多用外键，多对多用中间表 |
| 索引设计 | ⭐⭐⭐ 必须 | WHERE、外键、ORDER BY 的字段必加 |
| 最左前缀原则 | ⭐⭐ 重要 | 组合索引查询必须包含最左字段 |
| EXPLAIN 分析 | ⭐⭐ 重要 | 排查慢查询的利器 |
| 事务隔离级别 | ⭐ 了解 | MySQL 默认可重复读，一般不改 |

---

> 下一章：[07-Redis缓存与高并发查询策略](./07-Redis缓存与高并发查询策略.md)
