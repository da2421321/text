# 01 - Spring Boot 框架搭建 REST 接口（零基础详解版）

> **本章目标**：从零搭建一个 Spring Boot 项目，写出完整的 CRUD REST API，理解 Spring 的核心概念  
> **预计耗时**：6~8 小时  
> **前置要求**：完成基础篇和进阶篇

---

## 一、什么是 Spring Boot？

### 1.1 白话解释

如果把写后端比作开餐厅：

```
不用框架 = 自己盖房子 + 买桌椅 + 装修 + 请厨师 + 采购食材 + 做菜
用 Spring Boot = 直接入驻商场，商场提供一切基础设施，你只管做菜
```

**Spring Boot** 帮你做了：
- 自动配置（Auto Configuration）：常见的配置项都帮你设好了
- 内嵌 Web 服务器：不需要单独装 Tomcat，直接 `java -jar` 就能运行
- 依赖管理：常用库的版本都帮你匹配好了，不会版本冲突
- 生态齐全：数据库、缓存、消息队列、认证 等等都有现成的方案

### 1.2 前端对照

| 前端概念 | Spring Boot 对应 | 作用 |
|---------|-----------------|------|
| Express/Koa | Spring MVC | 处理 HTTP 请求 |
| package.json | pom.xml | 项目配置 + 依赖管理 |
| npm install | mvn install | 安装依赖 |
| .env | application.yml | 配置文件 |
| middleware | Filter / Interceptor | 请求拦截处理 |
| routes | @Controller + @RequestMapping | 路由定义 |
| npm run dev | mvn spring-boot:run | 启动项目 |

---

## 二、创建项目（手把手）

### 2.1 使用 Spring Initializr

1. 打开 https://start.spring.io/
2. 填写以下配置：

```
Project: Maven
Language: Java
Spring Boot: 3.x（选最新的稳定版）
Group: com.example
Artifact: demo
Name: demo
Packaging: Jar
Java: 17

Dependencies（点 ADD DEPENDENCIES 添加）：
  ✅ Spring Web          ← 写 REST API 必须
  ✅ Spring Boot DevTools ← 热重启（改代码自动重启）
  ✅ Lombok              ← 减少模板代码（可选但强烈推荐）
  ✅ Validation          ← 参数校验
```

3. 点击 `GENERATE`，下载 zip 文件
4. 解压，用 IntelliJ IDEA 打开

### 2.2 在 IDEA 中创建（更方便）

`File → New → Project → Spring Initializr`，填写同样的配置即可。

### 2.3 项目目录结构

```
demo/
├── pom.xml                         ← Maven 配置文件（依赖在这里）
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       └── DemoApplication.java  ← 启动类（程序入口）
│   │   └── resources/
│   │       ├── application.properties    ← 配置文件（建议改为 .yml）
│   │       ├── static/                   ← 静态资源
│   │       └── templates/                ← 模板文件
│   └── test/                             ← 测试代码
│       └── java/
└── .mvn/                                 ← Maven 包装器
```

### 2.4 pom.xml 核心依赖说明

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>

    <!-- 继承 Spring Boot 父项目（管理所有依赖版本） -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Web 开发（内嵌 Tomcat + Spring MVC） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 参数校验 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Lombok（减少模板代码） -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- 热重启 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <!-- 测试 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

---

## 三、启动类和配置文件

### 3.1 启动类

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication 是一个组合注解，包含：
// @SpringBootConfiguration - 标记这是一个配置类
// @EnableAutoConfiguration - 开启自动配置
// @ComponentScan - 自动扫描当前包及子包下的组件
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        // 启动 Spring Boot 应用
        SpringApplication.run(DemoApplication.class, args);
        // 启动后访问 http://localhost:8080
    }
}
```

### 3.2 配置文件（推荐用 yml 格式）

把 `application.properties` 改名为 `application.yml`：

```yaml
# 服务配置
server:
  port: 8080                    # 端口号（默认8080）
  servlet:
    context-path: /api          # 接口前缀，所有接口都以 /api 开头

# 应用信息
spring:
  application:
    name: demo-app              # 应用名称
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss   # JSON 日期格式
    time-zone: Asia/Shanghai            # 时区
    default-property-inclusion: non_null # null 值不输出到 JSON

# 日志配置
logging:
  level:
    root: info                          # 全局日志级别
    com.example.demo: debug             # 自己代码的日志级别
```

### 3.3 运行项目

**方式一**（IDEA 中）：点击 DemoApplication 类旁边的绿色三角形 ▶

**方式二**（命令行）：
```bash
mvn spring-boot:run
```

看到以下输出说明启动成功：
```
Started DemoApplication in 2.345 seconds
```

访问 http://localhost:8080/api —— 现在会返回 404，因为我们还没写接口。

---

## 四、Spring 核心概念：IoC 和依赖注入

### 4.1 什么是 IoC（控制反转）？

**传统方式**：你自己 new 对象
```java
// 你自己创建对象，自己管理依赖关系
UserService userService = new UserService();
UserController controller = new UserController(userService);
```

**IoC 方式**：Spring 帮你创建和管理对象
```java
// Spring 自动创建 UserService 和 UserController
// 并自动把 UserService "注入" 到 UserController 中
// 你什么都不用管！
```

**白话解释**：
- 传统方式 = 你自己做饭（自己买菜、洗菜、切菜、炒菜）
- IoC = 请了一个管家（Spring），你只需要说"我要吃红烧肉"，管家帮你搞定一切

### 4.2 常用注解

```java
// ===== 标记组件（让 Spring 管理这个类）=====
@Component      // 通用组件
@Service        // 业务逻辑层（语义化的 @Component）
@Repository     // 数据访问层（语义化的 @Component）
@Controller     // Web 控制层
@RestController // @Controller + @ResponseBody（返回 JSON）
@Configuration  // 配置类

// ===== 注入依赖（让 Spring 自动填充需要的对象）=====
@Autowired      // 自动注入（按类型匹配）
// 推荐用构造器注入（下面会详细讲）
```

### 4.3 依赖注入的三种方式

```java
@Service
public class OrderService {

    // ❌ 方式一：字段注入（不推荐，但写起来最简单）
    @Autowired
    private UserService userService;

    // ✅ 方式二：构造器注入（推荐！Spring 官方推荐）
    // 好处：依赖关系明确，不可变，方便测试
    private final UserService userService;
    private final ProductService productService;

    // 如果只有一个构造器，@Autowired 可以省略
    public OrderService(UserService userService, ProductService productService) {
        this.userService = userService;
        this.productService = productService;
    }

    // ✅ 方式三：用 Lombok 简化构造器注入
    // 在类上加 @RequiredArgsConstructor
    // Lombok 会自动生成包含所有 final 字段的构造器
}

// 最终推荐写法：Lombok + 构造器注入
@Service
@RequiredArgsConstructor  // Lombok 自动生成构造器
public class OrderService {
    private final UserService userService;       // final！
    private final ProductService productService; // final！

    // 不需要手写构造器，Lombok 帮你生成
}
```

---

## 五、写第一个接口：Hello World

### 5.1 创建 Controller

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// @RestController = @Controller + @ResponseBody
// 表示这个类是一个 REST 控制器，方法返回值自动转为 JSON
@RestController
// @RequestMapping 定义这个控制器的基础路径
@RequestMapping("/hello")
public class HelloController {

    // @GetMapping 处理 GET 请求
    // 完整路径: GET /api/hello
    @GetMapping
    public String hello() {
        return "Hello, Spring Boot!";
    }

    // 完整路径: GET /api/hello/name?name=张三
    @GetMapping("/name")
    public String helloName(String name) {
        return "Hello, " + name + "!";
    }
}
```

启动项目后：
- 访问 http://localhost:8080/api/hello → `Hello, Spring Boot!`
- 访问 http://localhost:8080/api/hello/name?name=张三 → `Hello, 张三!`

---

## 六、统一响应格式

### 6.1 为什么需要统一格式？

不同接口返回不同格式，前端很难处理：
```json
// 接口A返回字符串
"操作成功"

// 接口B返回对象
{"name": "张三"}

// 接口C返回数组
[1, 2, 3]
```

统一格式后，前端处理就很方便了：
```json
{
    "code": 200,
    "message": "success",
    "data": { ... }
}
```

### 6.2 定义统一响应类

```java
package com.example.demo.common;

import lombok.Data;

@Data // Lombok: 自动生成 getter/setter/toString
public class Result<T> {
    private int code;        // 状态码：200成功，其他为失败
    private String message;  // 提示信息
    private T data;          // 数据（泛型，可以是任意类型）

    private Result() {}

    // 成功（带数据）
    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.message = "success";
        r.data = data;
        return r;
    }

    // 成功（不带数据）
    public static <T> Result<T> success() {
        return success(null);
    }

    // 失败
    public static <T> Result<T> error(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        r.data = null;
        return r;
    }

    // 常用错误快捷方法
    public static <T> Result<T> badRequest(String message) {
        return error(400, message);
    }

    public static <T> Result<T> notFound(String message) {
        return error(404, message);
    }

    public static <T> Result<T> serverError(String message) {
        return error(500, message);
    }
}
```

---

## 七、完整 CRUD 实战：用户管理

### 7.1 创建 DTO（数据传输对象）

```java
package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

// 创建用户的请求体
@Data
public class CreateUserDTO {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度必须在2~20之间")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
}
```

```java
package com.example.demo.dto;

import lombok.Data;

// 更新用户的请求体（字段可选）
@Data
public class UpdateUserDTO {

    @Size(min = 2, max = 20, message = "用户名长度必须在2~20之间")
    private String username;

    @Email(message = "邮箱格式不正确")
    private String email;

    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
}
```

### 7.2 创建 Model（数据模型）

```java
package com.example.demo.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 7.3 创建 Service（业务逻辑层）

```java
package com.example.demo.service;

import com.example.demo.dto.CreateUserDTO;
import com.example.demo.dto.UpdateUserDTO;
import com.example.demo.model.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class UserService {

    // 用 Map 模拟数据库（后面会换成真正的数据库）
    private final Map<Long, User> userStore = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    // 创建用户
    public User create(CreateUserDTO dto) {
        // 检查用户名是否已存在
        boolean exists = userStore.values().stream()
            .anyMatch(u -> u.getUsername().equals(dto.getUsername()));
        if (exists) {
            throw new RuntimeException("用户名已存在: " + dto.getUsername());
        }

        User user = new User();
        user.setId(idGenerator.getAndIncrement());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setAge(dto.getAge());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userStore.put(user.getId(), user);
        return user;
    }

    // 查询所有用户
    public List<User> findAll() {
        return new ArrayList<>(userStore.values());
    }

    // 根据 ID 查询
    public User findById(Long id) {
        User user = userStore.get(id);
        if (user == null) {
            throw new RuntimeException("用户不存在: " + id);
        }
        return user;
    }

    // 更新用户
    public User update(Long id, UpdateUserDTO dto) {
        User user = findById(id);

        if (dto.getUsername() != null) {
            user.setUsername(dto.getUsername());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getAge() != null) {
            user.setAge(dto.getAge());
        }
        user.setUpdatedAt(LocalDateTime.now());

        return user;
    }

    // 删除用户
    public void delete(Long id) {
        User user = userStore.remove(id);
        if (user == null) {
            throw new RuntimeException("用户不存在: " + id);
        }
    }
}
```

### 7.4 创建 Controller（控制器层）

```java
package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.CreateUserDTO;
import com.example.demo.dto.UpdateUserDTO;
import com.example.demo.model.User;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // POST /api/users — 创建用户
    @PostMapping
    public Result<User> create(@Valid @RequestBody CreateUserDTO dto) {
        // @Valid 开启参数校验
        // @RequestBody 把请求体的 JSON 自动转为 Java 对象
        User user = userService.create(dto);
        return Result.success(user);
    }

    // GET /api/users — 查询所有用户
    @GetMapping
    public Result<List<User>> findAll() {
        return Result.success(userService.findAll());
    }

    // GET /api/users/1 — 根据 ID 查询
    @GetMapping("/{id}")
    public Result<User> findById(@PathVariable Long id) {
        // @PathVariable 从 URL 路径中提取参数
        return Result.success(userService.findById(id));
    }

    // PUT /api/users/1 — 更新用户
    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id,
                               @Valid @RequestBody UpdateUserDTO dto) {
        return Result.success(userService.update(id, dto));
    }

    // DELETE /api/users/1 — 删除用户
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return Result.success();
    }
}
```

### 7.5 请求参数注解详解

```java
// ===== @PathVariable — 路径参数 =====
// URL: /api/users/42
@GetMapping("/{id}")
public Result<User> findById(@PathVariable Long id) { ... }
// id = 42

// ===== @RequestParam — 查询参数 =====
// URL: /api/users?page=1&size=10&keyword=张
@GetMapping
public Result<List<User>> search(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(required = false) String keyword
) { ... }

// ===== @RequestBody — 请求体（JSON） =====
// POST /api/users，请求体: {"username":"张三","email":"..."}
@PostMapping
public Result<User> create(@Valid @RequestBody CreateUserDTO dto) { ... }

// ===== @RequestHeader — 请求头 =====
@GetMapping("/me")
public Result<User> getCurrentUser(
    @RequestHeader("Authorization") String token
) { ... }
```

---

## 八、全局异常处理

### 8.1 自定义业务异常

```java
package com.example.demo.exception;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public static BizException notFound(String message) {
        return new BizException(404, message);
    }

    public static BizException badRequest(String message) {
        return new BizException(400, message);
    }
}
```

### 8.2 全局异常处理器

```java
package com.example.demo.exception;

import com.example.demo.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

// @RestControllerAdvice: 全局异常处理器
// 所有 Controller 抛出的异常都会在这里被统一捕获和处理
@Slf4j // Lombok: 自动生成 log 变量
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 处理业务异常
    @ExceptionHandler(BizException.class)
    public Result<Void> handleBizException(BizException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    // 处理参数校验异常（@Valid 校验失败时）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        // 把所有校验错误拼接成一条消息
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining("; "));

        log.warn("参数校验失败: {}", message);
        return Result.error(400, message);
    }

    // 处理所有未捕获的异常（兜底）
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e); // 记录完整堆栈
        return Result.error(500, "系统繁忙，请稍后重试");
        // 不要把真实的错误信息返回给前端！安全风险！
    }
}
```

### 8.3 在 Service 中使用业务异常

```java
// 改造之前的 UserService
public User findById(Long id) {
    User user = userStore.get(id);
    if (user == null) {
        throw BizException.notFound("用户不存在: " + id); // 抛出业务异常
    }
    return user;
}
```

---

## 九、接口测试

### 9.1 使用 curl 测试

```bash
# 创建用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"张三","email":"zhangsan@example.com","age":25}'

# 响应：
# {"code":200,"message":"success","data":{"id":1,"username":"张三",...}}

# 查询所有用户
curl http://localhost:8080/api/users

# 查询单个用户
curl http://localhost:8080/api/users/1

# 更新用户
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"张三丰","age":30}'

# 删除用户
curl -X DELETE http://localhost:8080/api/users/1

# 测试参数校验（邮箱格式错误）
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"李四","email":"not-email","age":25}'
# 响应：{"code":400,"message":"email: 邮箱格式不正确"}
```

### 9.2 使用 Postman 或 Apifox

推荐使用图形化的 API 测试工具，操作更方便直观。导入以上接口地址，设置好请求方法和参数即可测试。

---

## 十、文件上传

```java
package com.example.demo.controller;

import com.example.demo.common.Result;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

    private static final String UPLOAD_DIR = "uploads/";

    // POST /api/files/upload
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return Result.badRequest("文件不能为空");
        }

        // 限制文件大小（5MB）
        if (file.getSize() > 5 * 1024 * 1024) {
            return Result.badRequest("文件大小不能超过5MB");
        }

        // 生成唯一文件名，避免覆盖
        String originalName = file.getOriginalFilename();
        String ext = originalName != null ? originalName.substring(originalName.lastIndexOf(".")) : "";
        String newName = UUID.randomUUID() + ext;

        // 确保上传目录存在
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 保存文件
        Path filePath = uploadPath.resolve(newName);
        file.transferTo(filePath.toFile());

        return Result.success("/files/" + newName);
    }
}
```

在 `application.yml` 中配置文件大小限制：

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB        # 单个文件最大10MB
      max-request-size: 50MB     # 整个请求最大50MB
```

---

## 十一、REST API 设计规范

### 11.1 URL 设计

```
✅ 推荐：
GET    /api/users           获取用户列表
GET    /api/users/1         获取用户详情
POST   /api/users           创建用户
PUT    /api/users/1         更新用户（全量更新）
PATCH  /api/users/1         更新用户（部分更新）
DELETE /api/users/1         删除用户

GET    /api/users/1/orders  获取用户的订单列表（嵌套资源）

❌ 不推荐：
GET    /api/getUser         动词命名
GET    /api/user_list       下划线
POST   /api/deleteUser/1    用 POST 做删除
```

### 11.2 状态码使用

```
200 OK            - 成功
201 Created       - 创建成功
204 No Content    - 删除成功（无返回体）
400 Bad Request   - 请求参数错误
401 Unauthorized  - 未登录
403 Forbidden     - 没有权限
404 Not Found     - 资源不存在
500 Server Error  - 服务器内部错误
```

---

## 十二、完整的项目目录结构

```
com.example.demo/
├── DemoApplication.java          ← 启动类
├── common/                       ← 通用类
│   └── Result.java               ← 统一响应
├── config/                       ← 配置类
│   └── WebConfig.java
├── controller/                   ← 控制器层（接收请求）
│   ├── UserController.java
│   └── FileController.java
├── dto/                          ← 数据传输对象
│   ├── CreateUserDTO.java
│   └── UpdateUserDTO.java
├── exception/                    ← 异常处理
│   ├── BizException.java
│   └── GlobalExceptionHandler.java
├── model/                        ← 数据模型
│   └── User.java
└── service/                      ← 业务逻辑层
    └── UserService.java
```

---

## 十三、练习题

### 练习1：商品管理 API

参考用户管理的模式，实现商品的 CRUD：
- 商品字段：id、name、price、stock、category、description
- 接口：列表/详情/创建/更新/删除
- 加上参数校验（价格大于0，库存不为负等）

### 练习2：分页查询

给用户列表接口加上分页功能：
- 接收 page 和 size 参数
- 返回分页数据（总数、总页数、当前页数据）

### 练习3：搜索接口

实现一个搜索接口 `GET /api/users/search?keyword=张&minAge=20&maxAge=30`，支持按用户名模糊搜索和年龄范围过滤。

---

## 十四、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| 项目创建 | ⭐⭐⭐ 必须 | Spring Initializr 或 IDEA 创建 |
| application.yml | ⭐⭐⭐ 必须 | 项目配置文件 |
| IoC / 依赖注入 | ⭐⭐⭐ 必须 | Spring 帮你创建和管理对象 |
| @RestController | ⭐⭐⭐ 必须 | 定义 REST API 控制器 |
| 请求参数注解 | ⭐⭐⭐ 必须 | @PathVariable, @RequestParam, @RequestBody |
| 统一响应 Result | ⭐⭐⭐ 必须 | 所有接口返回统一格式 |
| 参数校验 @Valid | ⭐⭐⭐ 必须 | DTO 上加校验注解 |
| 全局异常处理 | ⭐⭐⭐ 必须 | @RestControllerAdvice 统一处理异常 |
| REST 设计规范 | ⭐⭐ 重要 | URL 用名词，方法表示动作 |

---

> 下一章：[02-SpringDataJPA数据库操作](./02-SpringDataJPA数据库操作.md)
