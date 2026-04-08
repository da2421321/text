# 03 - Lombok 快速上手（零基础详解版）

> **本章目标**：掌握 Lombok 核心注解，消除 Java 代码中的模板代码，让代码更简洁
> **预计耗时**：2~3 小时
> **前置要求**：完成面向对象章节（Lombok 本质是对 getter/setter/构造器的简化）

---

## 一、为什么需要 Lombok？

### 1.1 一个真实的"痛苦"

写一个普通的 Java 实体类，你需要写多少代码？

```java
public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 无参构造
    public User() {}

    // 有参构造
    public User(Long id, String username, String email, Integer age,
                Boolean enabled, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.age = age;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // 8个字段 × 2（getter + setter）= 16个方法
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // equals
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id) &&
               Objects.equals(username, user.username) &&
               Objects.equals(email, user.email) &&
               Objects.equals(age, user.age) &&
               Objects.equals(enabled, user.enabled) &&
               Objects.equals(createdAt, user.createdAt) &&
               Objects.equals(updatedAt, user.updatedAt);
    }

    // hashCode
    public int hashCode() {
        return Objects.hash(id, username, email, age, enabled, createdAt, updatedAt);
    }

    // toString
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', ...}";
    }
}
```

一个简单的数据类，写了 **超过 60 行模板代码**！而且这些代码不需要你理解，只需要你复制粘贴。

### 1.2 Lombok 登场

**Lombok = 用注解自动生成这些模板代码的工具。**

同样的类，用 Lombok 写：

```java
@Data                   // 一个注解，搞定 getter/setter/equals/hashCode/toString
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String email;

    private Integer age;

    private Boolean enabled = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**从 60+ 行变成 30 行，代码更少，功能一样。**

### 1.3 Lombok 的工作原理

```
源代码(.java)
    │
    │  Lombok 在编译期介入
    │  读取注解信息
    │  自动生成额外的方法
    │
    ▼
编译后的 .class 文件
包含所有 Lombok 生成的方法 + 你写的代码
```

Lombok 不是运行时魔法，它是**编译时注解处理器**（Annotation Processor）。IDEA 或 javac 在编译时看到 `@Data` 注解，就会自动生成对应的 getter/setter 等方法。

---

## 二、快速上手：安装与配置

### 2.1 添加 Maven 依赖

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <scope>provided</scope>
</dependency>
```

`provided` 意味着：这个依赖只在编译时用，运行时不需要，打包时不会包含它。

### 2.2 IDEA 中启用 Lombok

1. `File → Settings → Plugins`，搜索 "Lombok"，点击 Install
2. `Settings → Build → Compiler → Annotation Processors`
   - 勾选 **Enable annotation processing** ✅
3. 重启 IDEA

如果代码里 `@Data` 报红线但项目能运行，先确认这两步有没有漏。

> **验证方法**：在类上写一个 `@Data`，如果 IDEA 能识别并提供 getter/setter 的代码提示，说明安装成功。

---

## 三、核心注解详解

### 3.1 `@Data` — 全能选手

`@Data` 是最常用的注解，包含以下所有功能：

| 自动生成 | 说明 |
|---------|------|
| getter | 所有字段的 getter 方法 |
| setter | 所有字段的 setter 方法 |
| equals | 基于所有字段的 equals 方法 |
| hashCode | 基于所有字段的 hashCode 方法 |
| toString | 包含所有字段的 toString 方法 |

```java
@Data
public class Product {
    private Long id;
    private String name;
    private Double price;
}

// 编译后自动等价于上面 60+ 行的手写代码
```

### 3.2 `@Getter` 和 `@Setter` — 按需使用

如果只需要 getter，不需要 setter（比如配置类中的只读字段）：

```java
@Getter
@Setter
public class Config {
    private String appName;      // 有 getter 也有 setter
    private final String version = "1.0"; // getter
    private Boolean debug = false;          // setter
}

// 如果只要 getter，不要 setter：
@Getter
@Setter(AccessLevel.NONE) // 这个字段完全没有 setter
public class User {
    private String username;
    private final Long id; // id 没有 setter（final 字段只能赋值一次）
}
```

### 3.3 `@NoArgsConstructor` — 无参构造

```java
@Data
@NoArgsConstructor  // 生成无参构造：public User() {}
public class User {
    private String name;
}
```

### 3.4 `@AllArgsConstructor` — 全参构造

```java
@Data
@NoArgsConstructor
@AllArgsConstructor  // 生成全参构造：public User(Long id, String name) {}
public class User {
    private Long id;
    private String name;
}
```

### 3.5 `@RequiredArgsConstructor` — 必填参数构造 ⭐

**这是 Spring Boot 教程中最常用的构造器注解！**

```java
@Service
@RequiredArgsConstructor  // 生成构造器，只包含 final 和 @NonNull 字段
public class UserService {

    private final UserRepository userRepository;  // final 字段
    private final PasswordEncoder passwordEncoder; // final 字段

    // Lombok 自动生成：
    // public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    //     this.userRepository = userRepository;
    //     this.passwordEncoder = passwordEncoder;
    // }
    // Spring 会自动把这个构造器用于依赖注入！
}
```

这就是为什么教程里的 Service 只需要写字段，不需要写构造方法，Spring 依然能正确注入依赖。

**哪些字段会被包含？**
- `final` 修饰的字段
- 标注了 `@NonNull` 的字段

### 3.6 `@Builder` — 建造者模式 ⭐

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
}
```

使用方式（链式调用）：

```java
// 不用 Builder：必须按构造器参数顺序传参
User user1 = new User(1L, "张三", "zhangsan@example.com", 25);

// 用 Builder：可以只填需要的字段，参数顺序随意
User user2 = User.builder()
    .username("李四")
    .email("lisi@example.com")
    .age(30)
    .build();

// 还可以链式修改（配合 @Setter）
user2.setUsername("李四新名字");
```

**Builder 的好处**：
- 不用记住参数顺序
- 可以只设置部分字段
- 代码更易读

### 3.7 `@Slf4j` — 日志对象 ⭐

```java
@Slf4j  // 自动生成：private static final org.slf4j.Logger log = ...
public class UserService {

    public void createUser(String name) {
        log.info("开始创建用户: {}", name);  // {} 是占位符
        // ...
        log.debug("创建成功，用户ID: {}", userId);
    }
}
```

不用手动写 `private static final Logger log = LoggerFactory.getLogger(...)`。

支持的日志框架注解：
- `@Slf4j` → SLF4J（日志门面，最常用）
- `@Log4j` → Log4j 1.x
- `@Log4j2` → Log4j 2.x
- `@JBossLog` → JBoss

### 3.8 `@EqualsAndHashCode` — 控制 equals 和 hashCode

```java
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true) // 默认基于所有字段，手动指定后只用这些
public class User {
    @EqualsAndHashCode.Include  // 只有 id 参与 equals 和 hashCode
    private Long id;

    private String username;
    private String email;
    private String password; // password 不参与比较！
}
```

---

## 四、注解组合常见用法

### 4.1 实体类（Entity）最常用组合

```java
@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false) // 如果有父类，考虑父类字段
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    private String email;
    private Integer age;
}
```

### 4.2 DTO / VO 类组合

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank @Email
    private String email;

    @Min(1) @Max(150)
    private Integer age;
}
```

### 4.3 Service 类组合

```java
@Slf4j
@Service
@RequiredArgsConstructor  // 自动生成依赖注入的构造器
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
}
```

---

## 五、常见坑与最佳实践

### 5.1 `@Data` 的坑：不要用在 Entity 上！

```java
// ❌ 错误：Entity 用 @Data 有严重隐患
@Data
@Entity
public class User {
    private Long id;
    private String password;  // 密码字段会被 equals/toString 包含！
    private String username;
}

// 如果有两个 User 对象，内容分别是：
// user1: {id=1, username="admin", password="明文密码"}
// user2: {id=1, username="admin", password="明文密码"}
// equals 认为他们相等 → OK

// 但如果用 toString 输出：
log.debug("用户信息: {}", user);
// 输出：用户信息: User(id=1, username=admin, password=123456)
// ^^^^ 密码被打印到日志里了！安全漏洞！⚠️
```

**Entity 推荐写法**：

```java
// ✅ 正确：Entity 只用 @Data，手动排除敏感字段
@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"password"})          // 排除密码
@ToString(exclude = {"password"})                     // 排除密码
public class User {
    private Long id;
    private String username;
    private String password;  // 不会出现在 equals/toString 中
}
```

**更推荐：用 DTO/VO 代替 Entity 暴露给外部**

```java
// ✅ 最佳实践：Entity 只做数据库映射
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String password;
}

// VO 做外部展示（没有 password 字段）
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVO {
    private Long id;
    private String username;
    private LocalDateTime createdAt;
}
```

### 5.2 `@Builder.Default` — 设置 Builder 的默认值

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Config {
    private String host = "localhost";  // 普通默认值
    private int port = 8080;
    private boolean enabled = true;
}

// 问题：
Config c = Config.builder().build();
// host = null（不是 "localhost"！）
// 因为 Builder 不认普通默认值！
```

正确写法：

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Config {
    @Builder.Default  // ⭐ 告诉 Builder 使用这个默认值
    private String host = "localhost";

    @Builder.Default
    private int port = 8080;

    @Builder.Default
    private boolean enabled = true;
}

// 现在：
Config c = Config.builder().build();
// host = "localhost", port = 8080, enabled = true ✅
```

### 5.3 `@NonNull` — 做空指针保护

```java
@Data
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public void createUser(@NonNull String username) { // 生成 null 检查
        // Lombok 自动在方法开头插入：
        // if (username == null) throw new NullPointerException("username");
        System.out.println("创建用户: " + username);
    }
}
```

### 5.4 `@Value` — 不可变对象

```java
// @Value 等价于 @Data + 所有字段 private + final + 无 setter
// 适合做"纯粹的配置文件"或"不可变的数据对象"
@Value
public class Point {
    private final int x;
    private final int y;
}

// 等价于：
public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }
    public int getX() { return x; }
    public int getY() { return y; }
    // equals, hashCode, toString 也都生成了
}

// 但注意：@Value 生成的 getter 没有 get 前缀！
Point p = new Point(10, 20);
int x = p.getX();  // ✅ 可以
// 或者（根据版本）：
int x = p.x();     // ✅ 也可以（Lombok 生成的是 getX() 或 x() 都可以）
```

### 5.5 Lombok 注解速查表

| 注解 | 生成什么 | 适用场景 |
|------|---------|---------|
| `@Data` | getter/setter/equals/hashCode/toString | 非 Entity 的简单类 |
| `@Getter` | getter | 只读字段，不需要 setter |
| `@Setter` | setter | 一般配合 @Getter 用 |
| `@NoArgsConstructor` | 无参构造 | JPA、JSON 反序列化需要 |
| `@AllArgsConstructor` | 全参构造 | 需要一次性构造所有字段 |
| `@RequiredArgsConstructor` | 必填参数构造 | **Spring 依赖注入必用！** |
| `@Builder` | 建造者 | 参数多、可选参数多的场景 |
| `@Slf4j` | 日志对象 | Service、Controller 等各类 |
| `@EqualsAndHashCode` | equals + hashCode | Entity 排除敏感字段 |
| `@ToString` | toString | Entity 排除敏感字段 |
| `@NonNull` | 空指针检查 | 方法参数保护 |
| `@Value` | 不可变类 | 配置类、不可变数据 |
| `@Cleanup` | 自动关闭资源 | IO 流、连接等 |

---

## 六、实战对比：手写 vs Lombok

### 6.1 Service 类

```java
// ❌ 手写（啰嗦、容易出错）
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// ✅ Lombok（简洁、安全）
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
}
```

### 6.2 DTO 类

```java
// ❌ 手写
@Data
public class CreateUserDTO {
    @NotBlank
    private String username;
    @Email
    private String email;

    private String password;  // 需要 builder 的话还要再加字段

    public CreateUserDTO() {}
    public CreateUserDTO(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    // ... 还有 email 和 password 的 getter/setter 要写
}

// ✅ Lombok
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserDTO {
    @NotBlank
    private String username;
    @Email
    private String email;
    private String password;
}
```

---

## 七、Lombok 常见报错

### 7.1 报错："Cannot resolve symbol 'Data'"

```
原因：Lombok 插件没装好，或者 Annotation Processing 没开启
解决：
  1. IDEA: Settings → Plugins → 安装 Lombok 插件
  2. IDEA: Settings → Build → Compiler → Annotation Processors → 勾选 Enable
  3. 重启 IDEA
```

### 7.2 报错："The method getXxx() is already defined in the type"

```
原因：同时使用了 @Data 和手写的 getter，或者类继承关系有问题
解决：检查是否同时用了 @Getter + @Data，或者 @AllArgsConstructor + @RequiredArgsConstructor 冲突
```

### 7.3 运行时找不到 getter/setter

```
原因：通常是 IDE 缓存问题，Lombok 在编译时生成了，但 IDE 没识别到
解决：
  1. IDEA: File → Invalidate Caches → Invalidate and Restart
  2. Maven: mvn clean compile 重新编译
```

### 7.4 JSON 反序列化失败

```java
// Jackson 反序列化需要无参构造
@Data
@Builder
public class User {  // ❌ 没有无参构造，JSON → 对象会报错
    private String name;
    private int age;
}

// ✅ 加 @NoArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class User {
    private String name;
    private int age;
}
```

---

## 八、练习题

### 练习1：Lombok 注解组合

用 Lombok 写一个 `Product` 类：
- 字段：id、name、price、stock、category
- 需要无参构造、全参构造、Builder 模式
- 日志对象用于打印操作信息

### 练习2：发现坑

运行下面的代码，观察输出，理解 `@Data` + `toString` 的安全问题：

```java
@Data
public class User {
    private Long id;
    private String username;
    private String password; // 模拟敏感数据
}

public class Main {
    public static void main(String[] args) {
        User user = new User();
        user.setId(1L);
        user.setUsername("admin");
        user.setPassword("SuperSecret123!");

        // 用 toString 输出用户信息看看
        System.out.println(user);
        // 密码是不是暴露了？
    }
}
```

然后用 `@ToString(exclude = {"password"})` 修复这个问题。

### 练习3：@RequiredArgsConstructor 依赖注入

创建一个 Service 类，注入两个 Repository（用 `@RequiredArgsConstructor`），打印日志，调用方法。验证构造器自动注入是否生效。

---

## 九、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| `@Data` | ⭐⭐⭐ 必须 | 自动生成 getter/setter/equals/hashCode/toString |
| `@RequiredArgsConstructor` | ⭐⭐⭐ 必须 | Spring 依赖注入的核心，配合 final 字段 |
| `@Builder` | ⭐⭐ 重要 | 链式构建对象，设置部分字段 |
| `@Slf4j` | ⭐⭐ 重要 | 替代手写 Logger |
| `@NoArgsConstructor` + `@AllArgsConstructor` | ⭐⭐ 重要 | 构造器生成，配合 JPA 和 Builder |
| Entity 用 `@EqualsAndHashCode(exclude)` | ⭐⭐⭐ 必须 | 避免敏感字段进入 equals/toString |
| `@Builder.Default` | ⭐⭐ 重要 | Builder 模式下保持字段默认值 |

**记住一个原则**：
- **非 Entity 类**放心用 `@Data`
- **Entity 类**用 `@Data` + `@EqualsAndHashCode(exclude)` + `@ToString(exclude)`
- **Service 类**用 `@Slf4j` + `@RequiredArgsConstructor`
- **DTO 类**用 `@Data` + `@Builder` + `@NoArgsConstructor`

---

> 下一章：[01-异常处理与泛型进阶](../02-进阶篇/01-异常处理与泛型进阶.md)
