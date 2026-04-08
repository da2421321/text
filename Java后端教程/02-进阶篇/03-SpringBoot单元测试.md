# 03 - Spring Boot 单元测试（零基础详解版）

> **本章目标**：掌握 JUnit 5 + Mockito 编写单元测试，测试 Service 层、Controller 层和 Repository 层
> **预计耗时**：5~8 小时
> **前置要求**：完成 Spring Boot REST 接口搭建、Lombok、三层架构

---

## 一、为什么需要写测试？

### 1.1 一个真实的故事

你写了一个用户管理的 Service，代码逻辑看起来没问题：

```java
@Transactional
public void transfer(Long fromId, Long toId, double amount) {
    Account from = accountRepository.findById(fromId);
    Account to = accountRepository.findById(toId);

    from.setBalance(from.getBalance() - amount);
    to.setBalance(to.getBalance() + amount);

    accountRepository.save(from);
    accountRepository.save(to);
}
```

上线三个月后，有人反馈：余额凭空消失了 100 块。排查后发现：
- 转账 50 元，余额扣了 50 ✅
- 再转 50 元，余额扣了 100 ❌ —— **第二次扣款只扣了 50，但页面显示扣了 100**

问题在哪？你根本没想过测试 `amount = 0`、`fromId == toId`、`amount < 0` 这些边界情况。

### 1.2 有测试 vs 没有测试

```
没有测试：
  写代码 → 手动测试 → 上线 → 出 bug → 紧急修复 → 提心吊胆

有测试：
  写代码 → 写测试 → 运行测试（全绿） → 上线 → 出 bug 概率大幅下降
  改代码 → 重新运行测试 → 如果测试失败，立刻知道改坏了什么
```

### 1.3 前端对照

| 前端 | Java 后端 |
|------|----------|
| Jest / Vitest | JUnit 5 |
| `describe` / `it` | `@Nested` / `@Test` |
| `expect()` | `Assertions.assertEquals()` |
| `vi.fn()` / `jest.fn()` | `@Mock` / `Mockito.when()` |
| `userEvent` / `fireEvent` | Spring Test (`@WebMvcTest`) |

---

## 二、环境准备

### 2.1 Maven 依赖

Spring Boot 项目默认已包含测试依赖（通过 `spring-boot-starter-test`）：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

这个依赖包含了：
- **JUnit 5** — 测试框架
- **Mockito** — Mock 对象
- **Spring Boot Test** — Spring 测试支持
- **AssertJ** — 断言库（比 JUnit 自带的更好用）

### 2.2 测试目录结构

```
src/
├── main/
│   └── java/com/example/demo/
│       ├── controller/UserController.java
│       ├── service/UserService.java
│       └── repository/UserRepository.java
└── test/
    └── java/com/example/demo/
        ├── controller/UserControllerTest.java      ← Controller 测试
        ├── service/UserServiceTest.java           ← Service 测试
        └── repository/UserRepositoryTest.java     ← Repository 测试
```

**约定**：测试类的命名 = `被测类名 + Test`，放在同包下。

---

## 三、JUnit 5 基础

### 3.1 第一个测试

```java
package com.example.demo.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorServiceTest {

    @Test
    void testAdd() {
        int result = 2 + 3;
        assertEquals(5, result);  // 断言：期望值 = 5，实际值 = result
    }

    @Test
    void testDivideByZero() {
        // assertThrows：断言抛出指定异常
        assertThrows(ArithmeticException.class, () -> {
            int result = 10 / 0;
        });
    }
}
```

### 3.2 常用断言

```java
import static org.junit.jupiter.api.Assertions.*;

// 基本比较
assertEquals(5, 2 + 3);                    // 相等
assertNotEquals(6, 2 + 3);                 // 不等
assertTrue(3 > 2);                         // 为真
assertFalse(3 < 2);                        // 为假
assertNull(null);                           // 为空
assertNotNull("hello");                     // 不为空

// 数组/集合
assertArrayEquals(new int[]{1,2,3}, new int[]{1,2,3}); // 数组相等
assertIterableEquals(List.of(1,2), List.of(1,2));    // 集合相等

// 字符串
assertEquals("hello", "hello");
assertTrue("hello".contains("ell"));       // 包含
assertTrue("hello".startsWith("he"));      // 开头

// 异常
assertThrows(IllegalArgumentException.class, () -> {
    throw new IllegalArgumentException("参数错误");
});

// 超时（方法执行超过1秒就失败）
assertTimeout(Duration.ofSeconds(1), () -> {
    // 模拟耗时操作
});
```

### 3.3 生命周期注解

```java
class LifecycleTest {

    @BeforeEach       // 每个 @Test 方法执行前都运行
    void setUp() {
        System.out.println("每个测试前执行一次");
    }

    @AfterEach       // 每个 @Test 方法执行后都运行
    void tearDown() {
        System.out.println("每个测试后执行一次");
    }

    @BeforeAll       // 所有测试执行前运行一次（必须是 static）
    static void beforeAll() {
        System.out.println("整个测试类开始前执行一次");
    }

    @AfterAll        // 所有测试执行后运行一次（必须是 static）
    static void afterAll() {
        System.out.println("整个测试类结束后执行一次");
    }

    @Test
    void test1() { /* 测试1 */ }

    @Test
    void test2() { /* 测试2 */ }
}
```

### 3.4 分组和禁用

```java
@Disabled("这个功能还没实现，跳过测试")
@Test
void testNotReady() { }

@Nested  // 嵌套测试类，按功能分组
class UserServiceTest {

    @Nested
    class CreateUserTests {
        @Test void testCreateSuccess() { }
        @Test void testCreateDuplicate() { }
    }

    @Nested
    class DeleteUserTests {
        @Test void testDeleteSuccess() { }
        @Test void testDeleteNotFound() { }
    }
}
```

---

## 四、Mockito：Mock 对象

### 4.1 什么是 Mock？

**Mock = 假对象**，用来代替真实的依赖。

比如你要测试 `UserService`，它依赖 `UserRepository`：

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}
```

测试 `UserService` 时，你**不想真的连数据库**。那就 Mock 一个假的 `UserRepository`：

```
真实依赖：UserService → UserRepository（需要数据库）
测试时：  UserService → Mock UserRepository（假数据，不连数据库）
```

### 4.2 三种创建 Mock 的方式

```java
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.*;

// 方式一：Mockito.mock() — 手动创建
@Test
void testManual() {
    UserRepository mockRepo = Mockito.mock(UserRepository.class);
    when(mockRepo.findById(1L)).thenReturn(Optional.of(new User()));
    // ...
}

// 方式二：@Mock + @ExtendWith(MockitoExtension.class) — 注解方式 ⭐
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void testFindById() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        // ...
    }
}

// 方式三：@MockBean — Spring 环境下注入 Mock ⭐⭐
@SpringBootTest
class UserControllerTest {

    @MockBean
    private UserService userService; // Mock 掉整个 Service
}
```

### 4.3 常用 Mockito 方法

```java
// ===== when().thenReturn() — 设定返回值 =====
when(mockRepo.findById(1L)).thenReturn(Optional.of(user));  // 正常返回值
when(mockRepo.findById(2L)).thenReturn(Optional.empty());   // 返回空

// 抛异常
when(mockRepo.findById(1L)).thenThrow(new RuntimeException("数据库挂了"));

// 连续调用返回不同值（第一次、第二次、第三次...）
when(mockRepo.count()).thenReturn(0L, 1L, 2L, 10L);

// ===== doThrow().when() — 模拟 void 方法抛异常 =====
// 适合 setter 或返回 void 的方法
doThrow(new RuntimeException("保存失败")).when(mockRepo).save(any());

// ===== verify() — 验证方法被调用 =====
@Test
void testSaveUser() {
    userService.save(user);

    // 验证 save() 被调用了 1 次，参数是 user
    verify(userRepository, times(1)).save(user);

    // 验证只调用了 save，没调用 delete
    verify(userRepository, never()).delete(any());

    // 验证调用顺序：先 save 再 findAll
    InOrder inOrder = inOrder(userRepository);
    inOrder.verify(userRepository).save(user);
    inOrder.verify(userRepository).findAll();
}

// ===== any() — 任意参数匹配 =====
// 任何参数都可以匹配（不关心参数内容）
verify(userRepository).save(any(User.class));
verify(userRepository).findById(anyLong());

// 任意字符串
verify(userService).findByUsername(anyString());

// nullable — 允许 null
verify(userService).findByEmail(nullable(String.class));
```

### 4.4 @InjectMocks — 自动注入 Mock

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks  // ⭐ 自动把 @Mock 注入到这个字段
    private UserService userService;

    @Test
    void testFindById() {
        // 给 Mock 设置行为
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));

        // 调用真实方法
        User result = userService.findById(1L);

        // 验证结果
        assertNotNull(result);
        verify(userRepository).findById(1L);
    }
}
```

---

## 五、测试 Service 层（Mock 方式）

### 5.1 完整示例

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    // ===== 创建用户测试 =====
    @Test
    void createUser_Success() {
        // 准备数据
        CreateUserRequest req = CreateUserRequest.builder()
            .username("zhangsan")
            .email("zhangsan@example.com")
            .password("123456")
            .build();

        User savedUser = User.builder()
            .id(1L)
            .username("zhangsan")
            .email("zhangsan@example.com")
            .build();

        // 设定 Mock 行为
        when(userRepository.existsByUsername("zhangsan")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // 执行
        User result = userService.createUser(req);

        // 验证结果
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("zhangsan", result.getUsername());

        // 验证调用
        verify(userRepository).existsByUsername("zhangsan");
        verify(passwordEncoder).encode("123456");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_UsernameDuplicate() {
        // 准备数据
        CreateUserRequest req = CreateUserRequest.builder()
            .username("existing_user")
            .email("test@example.com")
            .password("123456")
            .build();

        // 设定 Mock 行为：用户名已存在
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        // 执行 + 断言抛出异常
        BizException exception = assertThrows(BizException.class, () -> {
            userService.createUser(req);
        });

        assertEquals("用户名已存在", exception.getMessage());
        verify(userRepository, never()).save(any()); // 确认没有调用 save
    }

    // ===== 查询用户测试 =====
    @Test
    void findById_UserExists() {
        User user = User.builder().id(1L).username("zhangsan").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User result = userService.findById(1L);

        assertNotNull(result);
        assertEquals("zhangsan", result.getUsername());
    }

    @Test
    void findById_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        BizException exception = assertThrows(BizException.class, () -> {
            userService.findById(999L);
        });

        assertEquals("用户不存在", exception.getMessage());
    }

    // ===== 删除用户测试 =====
    @Test
    void deleteUser_Success() {
        when(userRepository.existsById(1L)).thenReturn(true);
        doNothing().when(userRepository).deleteById(1L);

        assertDoesNotThrow(() -> userService.deleteUser(1L));

        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_NotFound() {
        when(userRepository.existsById(999L)).thenReturn(false);

        BizException exception = assertThrows(BizException.class, () -> {
            userService.deleteUser(999L);
        });

        assertEquals("用户不存在", exception.getMessage());
        verify(userRepository, never()).deleteById(anyLong());
    }
}
```

### 5.2 Service 测试模板

```java
@ExtendWith(MockitoExtension.class)
class XxxServiceTest {

    @Mock
    private XxxRepository xxxRepository;

    @InjectMocks
    private XxxService xxxService;

    // 1. 正常情况 — 返回预期的成功结果
    @Test
    void methodName_Success() { }

    // 2. 边界情况 — 参数为空、零值、最大值等
    @Test
    void methodName_EmptyInput() { }

    // 3. 异常情况 — 资源不存在、数据不合法
    @Test
    void methodName_ResourceNotFound() { }

    // 4. 验证调用次数和顺序
    @Test
    void methodName_VerifyInteractions() { }
}
```

---

## 六、测试 Controller 层

### 6.1 @WebMvcTest — 轻量级 Controller 测试

```java
@WebMvcTest(UserController.class)  // 只启动 Web 层（Controller + Filter + Interceptor）
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;  // 模拟 HTTP 请求

    @MockBean
    private UserService userService;  // Mock 掉 Service

    // ===== GET 测试 =====
    @Test
    void getUser_Success() throws Exception {
        User user = User.builder().id(1L).username("zhangsan").email("z@example.com").build();
        when(userService.findById(1L)).thenReturn(user);

        mockMvc.perform(get("/users/1"))              // 发送 GET 请求
            .andExpect(status().isOk())               // 期望状态码 200
            .andExpect(jsonPath("$.code").value(200))  // 期望 JSON 中 code = 200
            .andExpect(jsonPath("$.data.username").value("zhangsan"));  // 期望 data.username = "zhangsan"
    }

    @Test
    void getUser_NotFound() throws Exception {
        when(userService.findById(999L))
            .thenThrow(BizException.notFound("用户不存在"));

        mockMvc.perform(get("/users/999"))
            .andExpect(status().isNotFound())         // 期望 404
            .andExpect(jsonPath("$.code").value(404));
    }

    // ===== POST 测试 =====
    @Test
    void createUser_Success() throws Exception {
        CreateUserRequest req = CreateUserRequest.builder()
            .username("zhangsan")
            .email("z@example.com")
            .password("123456")
            .build();

        User savedUser = User.builder().id(1L).username("zhangsan").build();
        when(userService.createUser(any())).thenReturn(savedUser);

        mockMvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))  // 发送 JSON 请求体
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.id").value(1));
    }

    // ===== 参数校验失败测试 =====
    @Test
    void createUser_ValidationError() throws Exception {
        String invalidJson = """
            {
                "username": "",
                "email": "not-an-email",
                "password": "123"
            }
            """;

        mockMvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(400));
    }

    // ===== 404 测试 =====
    @Test
    void endpointNotFound() throws Exception {
        mockMvc.perform(get("/nonexistent"))
            .andExpect(status().isNotFound());
    }
}
```

### 6.2 JSON 路径快速参考

```java
jsonPath("$.data.username")       // 读取对象字段
jsonPath("$.data.products[0].name")  // 读取数组第一个元素的字段
jsonPath("$.data.length()")      // 读取数组长度
jsonPath("$.data", hasSize(3))   // 断言数组长度为3
jsonPath("$.data", hasKey("id"))  // 断言包含某个 key
```

---

## 七、测试 Repository 层

### 7.1 @DataJpaTest — 只启动 JPA 层

```java
@DataJpaTest  // 只加载 JPA 相关组件（DataSource、JPA Repository、Hibernate）
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;  // 用于手动插入测试数据

    @BeforeEach
    void setUp() {
        // 每个测试前清空数据，保证测试隔离
        userRepository.deleteAll();
    }

    @Test
    void testSaveAndFind() {
        User user = User.builder()
            .username("zhangsan")
            .email("z@example.com")
            .enabled(true)
            .build();

        User saved = userRepository.save(user);
        Optional<User> found = userRepository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("zhangsan", found.get().getUsername());
    }

    @Test
    void testFindByUsername() {
        User user1 = User.builder().username("zhangsan").email("z1@x.com").enabled(true).build();
        User user2 = User.builder().username("lisi").email("l2@x.com").enabled(true).build();
        userRepository.saveAll(List.of(user1, user2));

        Optional<User> result = userRepository.findByUsername("zhangsan");

        assertTrue(result.isPresent());
        assertEquals("zhangsan", result.get().getUsername());
    }

    @Test
    void testFindByEnabled() {
        User user1 = User.builder().username("zhangsan").email("z1@x.com").enabled(true).build();
        User user2 = User.builder().username("lisi").email("l2@x.com").enabled(false).build();
        userRepository.saveAll(List.of(user1, user2));

        List<User> activeUsers = userRepository.findByEnabled(true);

        assertEquals(1, activeUsers.size());
        assertEquals("zhangsan", activeUsers.get(0).getUsername());
    }
}
```

**重要**：`@DataJpaTest` 默认使用内存数据库（H2）。需要在 `test/resources/` 下创建 `application.yml` 或 `application-test.yml`：

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop  # 测试完自动删除表
    show-sql: true
```

---

## 八、集成测试：@SpringBootTest

### 8.1 什么是集成测试？

Mock 测试只测单个类，集成测试把整个 Spring 上下文都启动，测试真实组件之间的协作。

```java
@SpringBootTest  // 启动完整的 Spring 上下文
@AutoConfigureMockMvc  // 自动注入 MockMvc
class FullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void fullCreateAndRetrieveFlow() throws Exception {
        // 1. 创建用户
        String json = """
            {
                "username": "zhangsan",
                "email": "zhangsan@example.com",
                "password": "123456"
            }
            """;

        mockMvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("zhangsan"));

        // 2. 验证数据库中有数据
        assertEquals(1, userRepository.count());
        assertTrue(userRepository.existsByUsername("zhangsan"));

        // 3. 查询该用户
        mockMvc.perform(get("/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value("zhangsan@example.com"));
    }
}
```

### 8.2 什么时候用 Mock 测试，什么时候用集成测试？

| 维度 | Mock 测试 | 集成测试 |
|------|----------|---------|
| 速度 | 快（毫秒级） | 慢（秒级） |
| 依赖 | 无需真实数据库/Redis | 可能需要真实基础设施 |
| 覆盖范围 | 单个类的方法逻辑 | 组件间的协作 |
| 适用场景 | 业务逻辑验证 | 端到端流程验证 |
| 建议比例 | 70% | 30% |

---

## 九、测试的最佳实践

### 9.1 测试命名规范

```java
// ✅ 推荐：方法名_场景_预期结果
@Test
void createUser_DuplicateUsername_ThrowsException() { }

// ✅ 或者：should_场景_预期结果
@Test
void shouldThrowExceptionWhenUsernameDuplicate() { }

// ❌ 不推荐：testCreate()
@Test
void testCreate() { }
```

### 9.2 测试结构（AAA 模式）

```java
@Test
void testTransfer_Success() {
    // 1. Arrange — 准备数据（Mock 行为、被测对象）
    Account from = Account.builder().id(1L).balance(1000.0).build();
    Account to = Account.builder().id(2L).balance(500.0).build();
    when(accountRepository.findById(1L)).thenReturn(Optional.of(from));
    when(accountRepository.findById(2L)).thenReturn(Optional.of(to));

    // 2. Act — 执行要测试的方法
    transferService.transfer(1L, 2L, 100.0);

    // 3. Assert — 验证结果
    assertEquals(900.0, from.getBalance());
    assertEquals(600.0, to.getBalance());
    verify(accountRepository, times(2)).save(any());
}
```

### 9.3 测试隔离原则

```java
@BeforeEach
void setUp() {
    // 每个测试前清空 Mock 的调用记录
    clearInvocations(userRepository);
    // 每个测试前重置 Mock 的行为
    reset(userRepository);
}
```

### 9.4 不要测试私有方法

```java
public class UserService {
    private boolean validateUsername(String username) {  // 不要单独测这个
        return username != null && username.length() >= 2;
    }

    public void createUser(String username) {
        if (!validateUsername(username)) {  // 通过公共方法间接测试
            throw new BizException("用户名不合法");
        }
        // ...
    }
}
```

### 9.5 覆盖率速查

```
测试覆盖率 = 被执行的代码行数 / 总代码行数

不是覆盖率越高越好！重点是：
- 核心业务逻辑必须测
- 边界条件必须测（空、零、负数、最大值）
- 异常分支必须测

建议目标：核心 Service 80%+，普通类 60%+
```

---

## 十、常见报错与解决

### 10.1 报错："Wanted but not invoked"

```
原因：验证了一个没被调用的方法
解决：
  1. 检查 Mock 行为是否设置正确
  2. 检查方法签名是否匹配（参数类型）
  3. 用 any() 代替具体参数试试
```

### 10.2 报错："NullPointerException" 或 Mock 没生效

```
原因：@Mock 没生效，Mock 对象是 null
解决：
  1. 确认类上有 @ExtendWith(MockitoExtension.class)
  2. 如果是 Spring 测试，确认有 @SpringBootTest
  3. 如果是 @WebMvcTest，确认 @MockBean
```

### 10.3 报错："No qualifying bean"

```
原因：Spring 上下文找不到某个 Bean
解决：
  1. 用 @MockBean 替换不存在的依赖
  2. 用 @WebMvcTest 代替 @SpringBootTest（更轻量）
  3. 检查 @ComponentScan 是否覆盖了需要的包
```

### 10.4 报错："Unexpected value"

```
原因：方法被调用了，但参数对不上
解决：用 any()、eq() 等匹配器
  verify(repo).save(any(User.class));
  verify(repo).findById(eq(1L));
```

---

## 十一、练习题

### 练习1：测试 Service 层

给 `OrderService` 写单元测试：
- 正常创建订单（验证库存扣减、订单创建）
- 库存不足时抛出异常
- 用户不存在时抛出异常

### 练习2：测试 Controller 层

用 `@WebMvcTest` 测试 `ProductController`：
- GET /products — 返回商品列表
- GET /products/1 — 返回单个商品
- GET /products/999 — 返回 404
- POST /products — 参数校验失败

### 练习3：测试 Repository 层

用 `@DataJpaTest` 测试 `ProductRepository`：
- 保存和查询
- 按分类筛选
- 价格区间查询

### 练习4：集成测试

用 `@SpringBootTest` 测试完整的注册-登录流程。

---

## 十二、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| JUnit 5 基础 | ⭐⭐⭐ 必须 | @Test + Assertions 断言 |
| @Mock + @InjectMocks | ⭐⭐⭐ 必须 | 替换依赖，隔离测试 |
| when/thenReturn | ⭐⭐⭐ 必须 | 设定 Mock 的行为 |
| verify | ⭐⭐⭐ 必须 | 验证方法调用 |
| @WebMvcTest | ⭐⭐⭐ 必须 | 测试 Controller 层 |
| @DataJpaTest | ⭐⭐ 重要 | 测试 Repository 层 |
| @SpringBootTest | ⭐⭐ 重要 | 集成测试 |
| AAA 模式 | ⭐⭐⭐ 必须 | Arrange（准备）→ Act（执行）→ Assert（验证） |
| 测试命名 | ⭐⭐ 重要 | 方法名_场景_预期结果 |

---

> 下一章：[02-并发编程与JUC](./02-并发编程与JUC.md)
