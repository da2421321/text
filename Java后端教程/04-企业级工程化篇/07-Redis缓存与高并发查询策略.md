# 07 - Redis 缓存与高并发查询策略（零基础详解版）

> **本章目标**：理解缓存原理，掌握 Spring Cache + Redis 的使用，了解缓存穿透/击穿/雪崩及解决方案  
> **预计耗时**：4~5 小时

---

## 一、为什么需要缓存？

### 1.1 生活类比

```
没有缓存：
  客人问："今天有什么菜？"
  服务员跑去厨房问厨师 → 厨师翻菜单 → 告诉服务员 → 服务员告诉客人
  每个客人都这样问一遍，厨师累死了

有缓存：
  第一个客人问 → 服务员跑去问厨师 → 把菜单抄在小黑板上（缓存）
  后面的客人问 → 服务员直接看小黑板（读缓存）
  菜单变了 → 擦掉小黑板重写（缓存失效）
```

### 1.2 数据访问速度对比

```
内存（Redis）：    约 0.1ms    ← 极快！
数据库（MySQL）：  约 1~10ms   ← 慢 10~100 倍
磁盘IO：          约 10~100ms ← 更慢

热点数据放 Redis，查询速度提升 10~100 倍
```

---

## 二、环境准备

### 2.1 安装 Redis

```bash
# Docker 安装（推荐）
docker run -d --name redis -p 6379:6379 redis:7

# 验证
docker exec -it redis redis-cli ping
# 返回 PONG 说明成功
```

### 2.2 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 2.3 配置

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password:              # 没有密码留空
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 20     # 最大连接数
          max-idle: 10       # 最大空闲连接
          min-idle: 5        # 最小空闲连接
          max-wait: 3000ms   # 获取连接的最大等待时间
```

### 2.4 Redis 序列化配置

默认序列化方式不可读，建议改为 JSON：

```java
package com.example.demo.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

import java.time.Duration;

@Configuration
@EnableCaching  // 开启缓存
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // Key 用 String 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Value 用 JSON 序列化（可读性好）
        GenericJackson2JsonRedisSerializer jsonSerializer =
            new GenericJackson2JsonRedisSerializer(objectMapper());
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);

        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))        // 默认过期时间 30 分钟
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer(objectMapper())))
            .disableCachingNullValues();              // 不缓存 null 值

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }

    private ObjectMapper objectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        om.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL);
        return om;
    }
}
```

---

## 三、Spring Cache 注解（最简单的缓存方式）

### 3.1 三个核心注解

```java
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // @Cacheable: 查询时先看缓存，有就直接返回，没有才查数据库并存入缓存
    // value: 缓存名称（分组）
    // key: 缓存的 key（SpEL 表达式）
    @Cacheable(value = "product", key = "#id")
    public Product findById(Long id) {
        // 这个方法只有在缓存中没找到时才会执行
        System.out.println(">>> 查询数据库: id=" + id);
        return productRepository.findById(id)
            .orElseThrow(() -> BizException.notFound("商品不存在"));
    }

    // @CachePut: 更新数据后同时更新缓存（始终执行方法）
    @CachePut(value = "product", key = "#id")
    @Transactional
    public Product update(Long id, UpdateProductRequest req) {
        Product product = findById(id);
        // ... 更新逻辑
        return productRepository.save(product);
    }

    // @CacheEvict: 删除缓存
    @CacheEvict(value = "product", key = "#id")
    @Transactional
    public void delete(Long id) {
        productRepository.deleteById(id);
    }

    // @CacheEvict(allEntries = true): 清空整个缓存分组
    @CacheEvict(value = "product", allEntries = true)
    public void clearCache() {
        // 清空所有商品缓存
    }
}
```

### 3.2 执行流程图

```
@Cacheable 流程：

请求 findById(1)
    │
    ▼
Redis 中有 "product::1" 的缓存吗？
    │
   有 ──→ 直接返回缓存数据（不执行方法！）
    │
   没有 ──→ 执行方法（查数据库）
              │
              ▼
         结果存入 Redis（key = "product::1"）
              │
              ▼
         返回结果
```

### 3.3 自定义 Key

```java
// 使用 SpEL 表达式定义缓存 key
@Cacheable(value = "user", key = "#username")
public User findByUsername(String username) { ... }

// 多参数组合 key
@Cacheable(value = "orders", key = "#userId + ':' + #status")
public List<Order> findOrders(Long userId, String status) { ... }

// 使用方法名作为 key 的一部分
@Cacheable(value = "stats", key = "'product_count'")
public long countProducts() { ... }
```

---

## 四、手动操作 Redis

有时候注解不够灵活，需要手动操作：

```java
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // 存入缓存（带过期时间）
    public void set(String key, Object value, long minutes) {
        redisTemplate.opsForValue().set(key, value, Duration.ofMinutes(minutes));
    }

    // 读取缓存
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    // 删除缓存
    public void delete(String key) {
        redisTemplate.delete(key);
    }

    // 判断 key 是否存在
    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    // 设置过期时间
    public void expire(String key, long minutes) {
        redisTemplate.expire(key, Duration.ofMinutes(minutes));
    }

    // 自增（用于计数器、限流等）
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }
}
```

### 4.1 实战：接口限流

```java
@Service
@RequiredArgsConstructor
public class RateLimiter {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 简单限流：每个 IP 每分钟最多请求 60 次
     * @return true 表示允许访问，false 表示被限流
     */
    public boolean allowRequest(String ip) {
        String key = "rate_limit:" + ip;
        Long count = redisTemplate.opsForValue().increment(key);

        if (count != null && count == 1) {
            // 第一次请求，设置过期时间为1分钟
            redisTemplate.expire(key, Duration.ofMinutes(1));
        }

        return count != null && count <= 60;
    }
}
```

---

## 五、缓存三大问题

### 5.1 缓存穿透

```
问题：查询一个数据库中根本不存在的数据
  → 缓存里没有 → 每次都查数据库 → 数据库压力大
  → 恶意攻击：大量请求不存在的 ID

解决方案一：缓存空值
  查到 null 也缓存起来（设短过期时间）

解决方案二：布隆过滤器
  请求先经过布隆过滤器判断数据是否存在
```

```java
// 方案一：缓存空值
@Cacheable(value = "product", key = "#id", unless = "#result == null")
public Product findById(Long id) {
    return productRepository.findById(id).orElse(null);
    // 如果找不到返回 null，也会被缓存（注意设置短过期时间）
}
```

### 5.2 缓存击穿

```
问题：一个热点 Key 过期的瞬间，大量请求同时到达
  → 所有请求同时穿透到数据库 → 数据库瞬间压力飙升

解决方案：分布式锁
  只让一个请求去查数据库，其他请求等着
```

```java
// 方案：分布式锁 + 双重检查
public Product findByIdWithLock(Long id) {
    String cacheKey = "product:" + id;
    String lockKey = "lock:product:" + id;

    // 第一次检查缓存
    Object cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return (Product) cached;
    }

    // 尝试获取分布式锁（3秒超时）
    Boolean locked = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "1", Duration.ofSeconds(3));

    if (Boolean.TRUE.equals(locked)) {
        try {
            // 第二次检查（可能等待期间别的线程已经写入缓存了）
            cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return (Product) cached;
            }

            // 查数据库
            Product product = productRepository.findById(id).orElse(null);

            // 写入缓存
            if (product != null) {
                redisTemplate.opsForValue().set(cacheKey, product, Duration.ofMinutes(30));
            }
            return product;
        } finally {
            // 释放锁
            redisTemplate.delete(lockKey);
        }
    } else {
        // 没获取到锁，等一会儿重试
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        return findByIdWithLock(id);
    }
}
```

### 5.3 缓存雪崩

```
问题：大量 Key 在同一时间过期
  → 所有请求同时穿透到数据库 → 数据库崩溃

解决方案：过期时间加随机值
  不要所有 Key 都设置相同的过期时间
```

```java
// 在过期时间上加随机偏移量
int baseMinutes = 30;
int randomMinutes = new Random().nextInt(10); // 0~9分钟的随机值
Duration ttl = Duration.ofMinutes(baseMinutes + randomMinutes);
redisTemplate.opsForValue().set(key, value, ttl);
```

### 5.4 三大问题速查表

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 穿透 | 查不存在的数据 | 缓存空值 / 布隆过滤器 |
| 击穿 | 热点Key过期 | 分布式锁 / 永不过期 |
| 雪崩 | 大量Key同时过期 | 过期时间加随机值 |

---

## 六、缓存一致性策略

### 6.1 先更新数据库，再删除缓存（推荐）

```java
@Transactional
public Product update(Long id, UpdateProductRequest req) {
    // 1. 更新数据库
    Product product = productRepository.findById(id).orElseThrow(...);
    product.setName(req.getName());
    product.setPrice(req.getPrice());
    Product saved = productRepository.save(product);

    // 2. 删除缓存（下次查询时自动重建）
    redisTemplate.delete("product:" + id);

    return saved;
}
```

**为什么是删除缓存而不是更新缓存？**
- 删除更简单，不用关心数据转换
- 如果数据被频繁更新但很少被查询，更新缓存浪费资源
- 删除后下次查询会自动从数据库加载最新数据

---

## 七、缓存 Key 设计规范

```
格式：项目名:模块:业务:ID
示例：
  demo:product:detail:123        商品详情
  demo:user:info:456             用户信息
  demo:order:list:user:789       用户的订单列表
  demo:rate_limit:ip:1.2.3.4    IP限流计数
  demo:lock:product:123          商品分布式锁

规则：
  ✅ 用冒号分隔层级
  ✅ 全小写
  ✅ 见名知意
  ❌ 不要太长（影响内存）
  ❌ 不要用特殊字符
```

---

## 八、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| 缓存原理 | ⭐⭐⭐ 必须 | 热数据放内存，减少数据库查询 |
| Redis 配置 | ⭐⭐⭐ 必须 | 连接池 + JSON 序列化 |
| @Cacheable | ⭐⭐⭐ 必须 | 最简单的缓存方式 |
| 手动操作 Redis | ⭐⭐ 重要 | RedisTemplate 灵活操作 |
| 穿透/击穿/雪崩 | ⭐⭐⭐ 必须 | 面试必考，方案要熟 |
| 缓存一致性 | ⭐⭐ 重要 | 先更新DB再删缓存 |
| Key 设计 | ⭐⭐ 重要 | 冒号分隔，见名知意 |

---

> 下一章：[08-线上生产级Docker部署打包指南](./08-线上生产级Docker部署打包指南.md)
