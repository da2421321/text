# 02 - Spring Data JPA 数据库操作（零基础详解版）

> **本章目标**：学会用 JPA 连接 MySQL 数据库，完成实体建模、CRUD、分页查询、关联关系等操作  
> **预计耗时**：6~8 小时  
> **前置要求**：完成 Spring Boot REST 接口搭建

---

## 一、什么是 JPA 和 Spring Data JPA？

### 1.1 白话解释

```
你想操作数据库（增删改查），有三种方式：

方式一：手写 SQL（就像手洗衣服）
  → 写 "SELECT * FROM user WHERE id = 1"
  → 灵活但繁琐，每个操作都要写 SQL

方式二：JPA（就像洗衣机）
  → 你定义好 Java 对象，JPA 自动帮你生成 SQL
  → 写 Java 代码就能操作数据库，不用写 SQL

方式三：Spring Data JPA（就像全自动洗衣机）
  → 在 JPA 基础上进一步简化
  → 只需要定义接口，连实现代码都不用写！
```

### 1.2 前端对照

| 前端 ORM | Java ORM | 说明 |
|---------|----------|------|
| Prisma | Spring Data JPA | 定义模型 → 自动生成数据库操作 |
| TypeORM | Hibernate（JPA实现） | 装饰器/注解定义实体 |
| Sequelize | MyBatis | 更偏向手写 SQL |

---

## 二、环境准备

### 2.1 安装 MySQL

1. 下载 MySQL 8.0：https://dev.mysql.com/downloads/
2. 安装时设置 root 密码（记住！）
3. 验证：`mysql -u root -p`

或者用 Docker（推荐，更方便）：

```bash
docker run -d \
  --name mysql8 \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=demo \
  mysql:8.0
```

### 2.2 创建数据库

```sql
-- 连接 MySQL 后执行
CREATE DATABASE IF NOT EXISTS demo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### 2.3 添加依赖

在 `pom.xml` 中添加：

```xml
<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- MySQL 驱动 -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

### 2.4 配置数据库连接

在 `application.yml` 中添加：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    # 自动根据实体类创建/更新表结构
    hibernate:
      ddl-auto: update     # update: 自动更新表结构（开发用）
                           # create: 每次启动重建表（测试用）
                           # none: 什么都不做（生产用）
                           # validate: 只验证不修改
    # 在控制台打印 SQL（开发时开启，方便调试）
    show-sql: true
    properties:
      hibernate:
        format_sql: true   # 格式化 SQL（更易读）
```

---

## 三、实体类（Entity）

### 3.1 什么是实体类？

**实体类 = Java 类 ↔ 数据库表** 的映射

```
Java 类 User                数据库表 users
├── Long id          ↔      id BIGINT PRIMARY KEY
├── String username  ↔      username VARCHAR(50)
├── String email     ↔      email VARCHAR(100)
├── Integer age      ↔      age INT
├── LocalDateTime    ↔      created_at DATETIME
│   createdAt
└── LocalDateTime    ↔      updated_at DATETIME
    updatedAt
```

### 3.2 编写实体类

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity                          // 标记这是一个 JPA 实体类
@Table(name = "users")           // 对应数据库中的 users 表
public class User {

    @Id                          // 主键
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    // nullable: 不能为空
    // length: 最大长度50
    // unique: 唯一约束（不能重复）
    private String username;

    @Column(nullable = false, length = 100)
    private String email;

    @Column
    private Integer age;

    @Column(length = 500)
    private String avatar;       // 头像 URL

    @Column(nullable = false)
    private Boolean enabled = true; // 是否启用

    @CreationTimestamp           // 自动填充创建时间
    @Column(updatable = false)   // 创建后不可修改
    private LocalDateTime createdAt;

    @UpdateTimestamp             // 自动填充更新时间
    private LocalDateTime updatedAt;
}
```

### 3.3 常用 JPA 注解

| 注解 | 作用 | 示例 |
|------|------|------|
| `@Entity` | 标记实体类 | 必须加 |
| `@Table(name="xxx")` | 指定表名 | 不写默认用类名 |
| `@Id` | 主键 | 必须有 |
| `@GeneratedValue` | 主键生成策略 | IDENTITY=自增 |
| `@Column` | 列属性配置 | nullable, length, unique |
| `@CreationTimestamp` | 自动填充创建时间 | 只在插入时填 |
| `@UpdateTimestamp` | 自动填充更新时间 | 每次更新都填 |
| `@Transient` | 不映射到数据库 | 临时字段 |
| `@Enumerated` | 枚举类型映射 | EnumType.STRING |
| `@Lob` | 大文本/大数据 | TEXT/BLOB |

---

## 四、Repository（数据访问层）

### 4.1 JPA 的魔法：只写接口，不写实现！

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// JpaRepository<实体类, 主键类型>
// 继承这个接口后，Spring 自动生成所有基础 CRUD 方法！
public interface UserRepository extends JpaRepository<User, Long> {

    // ===== 以下方法不需要写实现，Spring 根据方法名自动生成 SQL！=====

    // 根据用户名查找
    // 自动生成: SELECT * FROM users WHERE username = ?
    Optional<User> findByUsername(String username);

    // 根据邮箱查找
    // 自动生成: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // 判断用户名是否存在
    // 自动生成: SELECT COUNT(*) > 0 FROM users WHERE username = ?
    boolean existsByUsername(String username);

    // 根据年龄范围查找
    // 自动生成: SELECT * FROM users WHERE age BETWEEN ? AND ?
    List<User> findByAgeBetween(int minAge, int maxAge);

    // 根据用户名模糊查找
    // 自动生成: SELECT * FROM users WHERE username LIKE %?%
    List<User> findByUsernameContaining(String keyword);

    // 根据启用状态查找，按创建时间降序
    // 自动生成: SELECT * FROM users WHERE enabled = ? ORDER BY created_at DESC
    List<User> findByEnabledOrderByCreatedAtDesc(Boolean enabled);

    // 根据年龄大于某值查找
    // 自动生成: SELECT * FROM users WHERE age > ?
    List<User> findByAgeGreaterThan(int age);
}
```

### 4.2 方法命名规则

Spring Data JPA 根据方法名自动生成 SQL，规则如下：

| 关键词 | 方法名示例 | 生成的 SQL |
|--------|-----------|-----------|
| `findBy` | `findByUsername(name)` | `WHERE username = ?` |
| `And` | `findByNameAndAge(name, age)` | `WHERE name = ? AND age = ?` |
| `Or` | `findByNameOrEmail(name, email)` | `WHERE name = ? OR email = ?` |
| `Between` | `findByAgeBetween(min, max)` | `WHERE age BETWEEN ? AND ?` |
| `LessThan` | `findByAgeLessThan(age)` | `WHERE age < ?` |
| `GreaterThan` | `findByAgeGreaterThan(age)` | `WHERE age > ?` |
| `Like` | `findByNameLike(pattern)` | `WHERE name LIKE ?` |
| `Containing` | `findByNameContaining(str)` | `WHERE name LIKE %?%` |
| `StartingWith` | `findByNameStartingWith(str)` | `WHERE name LIKE ?%` |
| `OrderBy` | `findByEnabledOrderByNameAsc()` | `ORDER BY name ASC` |
| `Not` | `findByNameNot(name)` | `WHERE name <> ?` |
| `In` | `findByAgeIn(ages)` | `WHERE age IN (?, ?, ?)` |
| `IsNull` | `findByEmailIsNull()` | `WHERE email IS NULL` |
| `Top/First` | `findTop5ByOrderByAgeDesc()` | `LIMIT 5 ORDER BY age DESC` |
| `Count` | `countByEnabled(true)` | `SELECT COUNT(*) WHERE enabled=?` |
| `Delete` | `deleteByUsername(name)` | `DELETE WHERE username = ?` |

### 4.3 JpaRepository 内置方法

继承 `JpaRepository` 后，自动拥有这些方法（不需要写）：

```java
// 保存（新增或更新）
User saved = userRepository.save(user);

// 根据 ID 查找
Optional<User> user = userRepository.findById(1L);

// 查找所有
List<User> all = userRepository.findAll();

// 根据 ID 判断是否存在
boolean exists = userRepository.existsById(1L);

// 统计总数
long count = userRepository.count();

// 根据 ID 删除
userRepository.deleteById(1L);

// 根据对象删除
userRepository.delete(user);

// 批量保存
userRepository.saveAll(List.of(user1, user2, user3));

// 分页查询（重要！下面详细讲）
Page<User> page = userRepository.findAll(PageRequest.of(0, 10));
```

---

## 五、Service 层改造

```java
package com.example.demo.service;

import com.example.demo.dto.CreateUserDTO;
import com.example.demo.dto.UpdateUserDTO;
import com.example.demo.entity.User;
import com.example.demo.exception.BizException;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // 创建用户
    @Transactional  // 事务注解：如果出错自动回滚
    public User create(CreateUserDTO dto) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw BizException.badRequest("用户名已存在: " + dto.getUsername());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setAge(dto.getAge());

        return userRepository.save(user); // save 会返回带 id 的对象
    }

    // 分页查询
    public Page<User> findPage(int page, int size) {
        // PageRequest.of(页码从0开始, 每页条数, 排序)
        PageRequest pageRequest = PageRequest.of(
            page - 1, // 前端传 1 表示第1页，JPA 页码从 0 开始
            size,
            Sort.by(Sort.Direction.DESC, "createdAt") // 按创建时间降序
        );
        return userRepository.findAll(pageRequest);
    }

    // 根据 ID 查询
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> BizException.notFound("用户不存在: " + id));
    }

    // 搜索用户
    public Page<User> search(String keyword, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page - 1, size);
        if (keyword != null && !keyword.isBlank()) {
            return userRepository.findByUsernameContaining(keyword, pageRequest);
        }
        return userRepository.findAll(pageRequest);
    }

    // 更新用户
    @Transactional
    public User update(Long id, UpdateUserDTO dto) {
        User user = findById(id);

        if (dto.getUsername() != null) {
            // 检查新用户名是否被其他人使用
            userRepository.findByUsername(dto.getUsername())
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> {
                    throw BizException.badRequest("用户名已被使用: " + dto.getUsername());
                });
            user.setUsername(dto.getUsername());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getAge() != null) {
            user.setAge(dto.getAge());
        }

        return userRepository.save(user);
    }

    // 删除用户
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw BizException.notFound("用户不存在: " + id);
        }
        userRepository.deleteById(id);
    }
}
```

注意 Repository 中需要增加分页搜索方法：

```java
// 在 UserRepository 接口中添加
Page<User> findByUsernameContaining(String keyword, Pageable pageable);
```

---

## 六、分页查询 Controller

```java
@GetMapping
public Result<Page<User>> findPage(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int size
) {
    return Result.success(userService.findPage(page, size));
}

@GetMapping("/search")
public Result<Page<User>> search(
    @RequestParam(required = false) String keyword,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int size
) {
    return Result.success(userService.search(keyword, page, size));
}
```

分页查询返回的 JSON 结构：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "content": [
            {"id": 1, "username": "张三", "email": "...", "age": 25},
            {"id": 2, "username": "李四", "email": "...", "age": 30}
        ],
        "totalElements": 25,
        "totalPages": 3,
        "number": 0,
        "size": 10,
        "first": true,
        "last": false
    }
}
```

---

## 七、实体关系映射

### 7.1 关系类型概览

```
一对一（@OneToOne）：  用户 ↔ 用户详情
一对多（@OneToMany）：用户 → 订单（一个用户有多个订单）
多对一（@ManyToOne）：订单 → 用户（多个订单属于一个用户）
多对多（@ManyToMany）：用户 ↔ 角色（一个用户多个角色，一个角色多个用户）
```

### 7.2 一对多 / 多对一 示例：用户和订单

```java
// ===== 用户实体（一的一方） =====
@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    // 一对多：一个用户有多个订单
    // mappedBy = "user" 表示关联关系由 Order 实体的 user 字段维护
    // cascade = CascadeType.ALL 表示级联操作（删除用户时同时删除其订单）
    // fetch = FetchType.LAZY 延迟加载（访问 orders 时才查询，不是一开始就查）
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
}
```

```java
// ===== 订单实体（多的一方） =====
@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderNo;        // 订单号

    @Column(nullable = false)
    private Double totalAmount;    // 总金额

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)   // 枚举存为字符串
    private OrderStatus status = OrderStatus.PENDING;

    // 多对一：多个订单属于一个用户
    // @JoinColumn 指定外键列名
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

```java
public enum OrderStatus {
    PENDING, PAID, SHIPPED, COMPLETED, CANCELLED
}
```

### 7.3 多对多示例：用户和角色

```java
// ===== 角色实体 =====
@Data
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
}

// ===== 用户实体中添加角色关联 =====
@Entity
@Table(name = "users")
public class User {
    // ... 其他字段

    // 多对多：用户 ↔ 角色
    // @JoinTable 指定中间表
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",                                    // 中间表名
        joinColumns = @JoinColumn(name = "user_id"),            // 当前实体的外键
        inverseJoinColumns = @JoinColumn(name = "role_id")      // 对方实体的外键
    )
    private Set<Role> roles = new HashSet<>();
}
```

生成的数据库表结构：

```sql
-- users 表
-- orders 表（有 user_id 外键）
-- roles 表
-- user_roles 中间表（user_id + role_id）
```

---

## 八、自定义 SQL 查询

当方法名规则无法满足需求时，可以用 `@Query` 写自定义查询：

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // JPQL 查询（面向对象的 SQL，用实体类名和属性名，不是表名和列名）
    @Query("SELECT u FROM User u WHERE u.age >= :minAge AND u.enabled = true")
    List<User> findActiveUsersByMinAge(@Param("minAge") int minAge);

    // 原生 SQL 查询
    @Query(value = "SELECT * FROM users WHERE age > ?1 ORDER BY created_at DESC LIMIT ?2",
           nativeQuery = true)
    List<User> findTopUsersByAge(int age, int limit);

    // 更新操作（需要加 @Modifying）
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.enabled = false WHERE u.id = :id")
    int disableUser(@Param("id") Long id);

    // 统计查询
    @Query("SELECT u.age, COUNT(u) FROM User u GROUP BY u.age ORDER BY u.age")
    List<Object[]> countByAge();
}
```

---

## 九、事务管理

### 9.1 什么是事务？

**事务 = 一组操作，要么全部成功，要么全部失败**

生活类比：银行转账
```
张三 → 李四 转账 100 元
步骤1: 张三账户 -100
步骤2: 李四账户 +100

如果步骤1成功了，步骤2失败了 → 钱就消失了！
事务保证：要么两步都成功，要么两步都回滚（撤销）
```

### 9.2 使用 @Transactional

```java
@Service
@RequiredArgsConstructor
public class TransferService {

    private final AccountRepository accountRepository;

    @Transactional // 加上这个注解，方法内的所有数据库操作是一个事务
    public void transfer(Long fromId, Long toId, double amount) {
        Account from = accountRepository.findById(fromId)
            .orElseThrow(() -> BizException.notFound("转出账户不存在"));
        Account to = accountRepository.findById(toId)
            .orElseThrow(() -> BizException.notFound("转入账户不存在"));

        if (from.getBalance() < amount) {
            throw BizException.badRequest("余额不足");
        }

        from.setBalance(from.getBalance() - amount); // 扣款
        to.setBalance(to.getBalance() + amount);     // 入账

        accountRepository.save(from);
        accountRepository.save(to);

        // 如果上面任何一步出错（抛出异常），整个事务都会回滚
        // from 和 to 的余额都会恢复到操作前的状态
    }
}
```

### 9.3 @Transactional 常用属性

```java
@Transactional(
    readOnly = false,                          // true: 只读事务（查询用，性能更好）
    timeout = 30,                              // 超时时间（秒），超时自动回滚
    rollbackFor = Exception.class,             // 哪些异常触发回滚
    noRollbackFor = BizException.class,        // 哪些异常不回滚
    propagation = Propagation.REQUIRED         // 事务传播行为（默认值，大多数场景够用）
)
```

**注意事项**：
- `@Transactional` 只对 `public` 方法有效
- 同一个类中 A 方法调用 B 方法，B 的 `@Transactional` 不生效（因为没有通过代理）
- 查询方法建议加 `@Transactional(readOnly = true)` 提升性能

---

## 十、N+1 问题与解决

### 10.1 什么是 N+1 问题？

```
查询 10 个用户，每个用户有订单信息（LAZY 加载）

第 1 次查询: SELECT * FROM users LIMIT 10;          ← 1 次
第 2 次查询: SELECT * FROM orders WHERE user_id = 1; ← 第1个用户的订单
第 3 次查询: SELECT * FROM orders WHERE user_id = 2; ← 第2个用户的订单
...
第 11次查询: SELECT * FROM orders WHERE user_id = 10;← 第10个用户的订单

总共: 1 + 10 = 11 次查询！如果有 1000 个用户就是 1001 次！
```

### 10.2 解决方案

```java
// 方案一：使用 @Query + JOIN FETCH（推荐）
@Query("SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.enabled = true")
List<User> findAllWithOrders();
// 只有 1 次 SQL，用 JOIN 把用户和订单一起查出来

// 方案二：使用 @EntityGraph
@EntityGraph(attributePaths = {"orders"})
List<User> findByEnabled(boolean enabled);
// 告诉 JPA 在查询用户时，同时加载 orders

// 方案三：使用 @BatchSize（批量加载）
// 在实体类的集合字段上加
@OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
@BatchSize(size = 20) // 每次批量加载 20 个用户的订单
private List<Order> orders;
// 原来 N+1 次查询变成 1 + ceil(N/20) 次
```

---

## 十一、乐观锁（防止并发更新冲突）

### 11.1 什么场景需要乐观锁？

```
场景：两个管理员同时编辑同一个商品的价格

管理员A 读取商品（价格100） → 改为 120
管理员B 读取商品（价格100） → 改为 150

如果没有乐观锁：
  A 保存: 价格 = 120
  B 保存: 价格 = 150（A的修改被覆盖了！A不知道）

有乐观锁：
  A 保存: 价格 = 120，version 1 → 2 ✅
  B 保存: 发现 version 不是 1 了（已被A改为2）→ 抛异常！❌
  B 被提示"数据已被其他人修改，请刷新后重试"
```

### 11.2 实现乐观锁

```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double price;
    private Integer stock;

    @Version  // 加上这一个注解就实现了乐观锁！
    private Integer version;
    // JPA 每次更新时会自动检查并递增 version
    // 如果 version 不匹配，抛出 OptimisticLockException
}
```

---

## 十二、索引和性能建议

### 12.1 添加索引

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username"),        // 普通索引
    @Index(name = "idx_email", columnList = "email", unique = true), // 唯一索引
    @Index(name = "idx_age_created", columnList = "age, createdAt")  // 组合索引
})
public class User {
    // ...
}
```

### 12.2 性能建议

1. **必加索引**：WHERE 条件经常用到的字段、外键字段、排序字段
2. **使用分页**：永远不要 `findAll()` 查全部数据，用分页
3. **合理使用 LAZY 加载**：关联数据默认用 LAZY，需要时再 FETCH
4. **避免 N+1**：用 `JOIN FETCH` 或 `@EntityGraph`
5. **只查需要的字段**：可以用投影（Projection）只查部分字段
6. **开启 SQL 日志**：开发时看 JPA 生成了多少条 SQL

---

## 十三、练习题

### 练习1：商品 CRUD

创建 Product 实体（id、name、price、stock、category、description），实现完整的 CRUD + 分页 + 搜索。

### 练习2：一对多关系

实现用户-订单关系：
- 创建订单时关联用户
- 查询用户时能看到其所有订单
- 解决 N+1 问题

### 练习3：库存扣减

实现一个扣减库存的接口，使用乐观锁防止超卖。

---

## 十四、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| 实体类 @Entity | ⭐⭐⭐ 必须 | Java 类映射数据库表 |
| JpaRepository | ⭐⭐⭐ 必须 | 继承即拥有 CRUD，方法名自动生成 SQL |
| 方法名查询规则 | ⭐⭐⭐ 必须 | findByXxx, existsByXxx 等 |
| 分页查询 | ⭐⭐⭐ 必须 | PageRequest + Page |
| @Transactional | ⭐⭐⭐ 必须 | 事务管理，保证数据一致性 |
| 一对多/多对多 | ⭐⭐ 重要 | @OneToMany, @ManyToMany |
| @Query | ⭐⭐ 重要 | 自定义 JPQL 或 SQL |
| N+1 问题 | ⭐⭐ 重要 | JOIN FETCH 解决 |
| 乐观锁 @Version | ⭐⭐ 重要 | 防止并发更新冲突 |
| 索引 | ⭐⭐ 重要 | 提升查询性能 |

---

> 下一章：[01-标准项目目录结构](../04-企业级工程化篇/01-标准项目目录结构.md)
