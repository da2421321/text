# 08 - 线上生产级 Docker 部署打包指南（零基础详解版）

> **本章目标**：学会用 Maven 打包 Spring Boot 项目，编写 Dockerfile，用 docker-compose 一键部署应用+数据库+Redis  
> **预计耗时**：3~4 小时

---

## 一、部署流程总览

```
你的代码
    │
    ▼
Maven 打包 → demo-0.0.1-SNAPSHOT.jar（可执行的 jar 文件）
    │
    ▼
Docker 构建 → 镜像（包含 JDK + jar 文件）
    │
    ▼
docker-compose → 一键启动（应用 + MySQL + Redis）
    │
    ▼
线上运行 ✅
```

---

## 二、Maven 打包

### 2.1 打包命令

```bash
# 在项目根目录执行
# clean: 清除旧的编译产物
# package: 编译 + 测试 + 打包
# -DskipTests: 跳过测试（加快打包速度）
mvn clean package -DskipTests
```

打包成功后，在 `target/` 目录下会生成 `demo-0.0.1-SNAPSHOT.jar`。

### 2.2 验证 jar 能否运行

```bash
java -jar target/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

看到 `Started DemoApplication` 说明打包成功。

---

## 三、编写 Dockerfile

### 3.1 多阶段构建（生产推荐）

```dockerfile
# ==================== 第一阶段：构建 ====================
# 使用 Maven 镜像来编译和打包
FROM maven:3.9-eclipse-temurin-17 AS builder

# 设置工作目录
WORKDIR /build

# 先复制 pom.xml，利用 Docker 缓存层加速（依赖不变就不重新下载）
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源代码并打包
COPY src ./src
RUN mvn clean package -DskipTests -B


# ==================== 第二阶段：运行 ====================
# 使用更小的 JRE 镜像来运行（不需要编译工具）
FROM eclipse-temurin:17-jre-alpine

# 安装时区数据（alpine 默认没有）
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 创建非 root 用户运行应用（安全最佳实践）
RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app

# 从第一阶段复制打包好的 jar
COPY --from=builder /build/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 健康检查：每30秒检查一次应用是否正常
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/actuator/health || exit 1

# JVM 参数 + 启动命令
ENTRYPOINT ["java", \
    "-Xms256m", \
    "-Xmx512m", \
    "-XX:+UseG1GC", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod}", \
    "-jar", "app.jar"]
```

### 3.2 Dockerfile 每一行解释

```
多阶段构建的好处：
  第一阶段（builder）：用大的 Maven 镜像编译打包（~800MB）
  第二阶段（运行）：只用小的 JRE 镜像运行（~200MB）
  最终镜像不包含 Maven 和源代码，体积小、更安全

JVM 参数解释：
  -Xms256m     初始堆内存 256MB
  -Xmx512m     最大堆内存 512MB（根据服务器内存调整）
  -XX:+UseG1GC 使用 G1 垃圾回收器（推荐）
```

### 3.3 构建和运行

```bash
# 构建镜像
docker build -t demo-app:latest .

# 运行容器
docker run -d \
  --name demo-app \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=123456 \
  demo-app:latest

# 查看日志
docker logs -f demo-app
```

---

## 四、docker-compose 一键部署

### 4.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # ========== 应用服务 ==========
  app:
    build: .                          # 使用当前目录的 Dockerfile
    container_name: demo-app
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_USERNAME=root
      - DB_PASSWORD=demo_password_123
      - DB_HOST=mysql                 # 容器名就是主机名
      - REDIS_HOST=redis
      - REDIS_PASSWORD=redis_password_456
    depends_on:
      mysql:
        condition: service_healthy    # 等 MySQL 健康检查通过后再启动
      redis:
        condition: service_healthy
    restart: unless-stopped           # 崩溃自动重启
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/api/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s              # 给应用40秒启动时间

  # ========== MySQL ==========
  mysql:
    image: mysql:8.0
    container_name: demo-mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=demo_password_123
      - MYSQL_DATABASE=demo
      - MYSQL_CHARSET=utf8mb4
      - MYSQL_COLLATION=utf8mb4_unicode_ci
      - TZ=Asia/Shanghai
    volumes:
      - mysql-data:/var/lib/mysql         # 数据持久化！容器删除数据不丢
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql  # 首次启动自动执行
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max-connections=200
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ========== Redis ==========
  redis:
    image: redis:7-alpine
    container_name: demo-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis_password_456 --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_password_456", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

# 数据卷（持久化存储）
volumes:
  mysql-data:
  redis-data:

# 自定义网络
networks:
  app-network:
    driver: bridge
```

### 4.2 对应的生产配置

```yaml
# application-prod.yml
server:
  port: 8080
  shutdown: graceful

spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:3306/demo?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: none             # 生产环境不自动改表
    show-sql: false
    open-in-view: false
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379
      password: ${REDIS_PASSWORD:}

logging:
  level:
    root: warn
    com.example.demo: info
  file:
    name: /app/logs/app.log
```

### 4.3 一键操作命令

```bash
# 启动所有服务（后台运行）
docker-compose up -d --build

# 查看所有服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app

# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 会删除数据库数据！）
docker-compose down -v

# 重启应用（不重启数据库）
docker-compose restart app

# 重新构建并启动应用
docker-compose up -d --build app
```

---

## 五、优雅停机

应用收到停止信号时，不是立刻杀死，而是等正在处理的请求完成后再停止。

```yaml
# application.yml
server:
  shutdown: graceful              # 开启优雅停机

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # 最多等30秒
```

---

## 六、JVM 参数建议

```bash
# 小型应用（1~2GB 服务器）
java -Xms256m -Xmx512m -XX:+UseG1GC -jar app.jar

# 中型应用（4GB 服务器）
java -Xms512m -Xmx1g -XX:+UseG1GC -jar app.jar

# 大型应用（8GB+ 服务器）
java -Xms1g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar

# 参数说明：
# -Xms    初始堆内存（建议和 -Xmx 一样，避免运行时扩容）
# -Xmx    最大堆内存（不要超过服务器内存的 70%）
# -XX:+UseG1GC    使用 G1 垃圾回收器
# -XX:MaxGCPauseMillis=200    GC 暂停时间目标 200ms
```

---

## 七、日志与可观测性

### 7.1 日志配置

```xml
<!-- logback-spring.xml -->
<configuration>
    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%X{traceId}] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 文件输出（按天滚动） -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/app/logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>/app/logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>3GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] [%X{traceId}] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 生产环境：CONSOLE + FILE -->
    <springProfile name="prod">
        <root level="WARN">
            <appender-ref ref="CONSOLE"/>
            <appender-ref ref="FILE"/>
        </root>
        <logger name="com.example.demo" level="INFO"/>
    </springProfile>

    <!-- 开发环境：只要 CONSOLE -->
    <springProfile name="dev">
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.example.demo" level="DEBUG"/>
    </springProfile>
</configuration>
```

### 7.2 健康检查接口

添加 Actuator 依赖后自动拥有健康检查接口：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics    # 只暴露必要的端点
  endpoint:
    health:
      show-details: always              # 显示详细健康信息
```

访问 `http://localhost:8080/api/actuator/health` 查看应用健康状态：
```json
{
    "status": "UP",
    "components": {
        "db": { "status": "UP" },
        "redis": { "status": "UP" },
        "diskSpace": { "status": "UP" }
    }
}
```

---

## 八、故障排查入口

| 场景 | 命令 |
|------|------|
| 查看应用日志 | `docker-compose logs -f app` |
| 查看 MySQL 日志 | `docker-compose logs -f mysql` |
| 进入应用容器 | `docker exec -it demo-app sh` |
| 进入 MySQL 终端 | `docker exec -it demo-mysql mysql -uroot -p` |
| 进入 Redis 终端 | `docker exec -it demo-redis redis-cli -a password` |
| 查看容器资源使用 | `docker stats` |
| 查看容器进程 | `docker top demo-app` |
| 查看网络情况 | `docker network inspect app-network` |
| 重启崩溃的容器 | `docker-compose restart app` |
| 强制重建容器 | `docker-compose up -d --force-recreate app` |

---

## 九、部署检查清单

上线前务必确认以下事项：

```
□ 配置检查
  □ spring.profiles.active = prod
  □ ddl-auto = none（不自动改表）
  □ show-sql = false（不打印SQL）
  □ 数据库密码使用环境变量
  □ Redis 设置了密码

□ 安全检查
  □ 密码没有硬编码在配置文件中
  □ Actuator 端点只暴露必要的
  □ CORS 配置了具体域名（不是 *）

□ 性能检查
  □ 数据库连接池参数合理
  □ Redis 连接池参数合理
  □ JVM 内存参数合理

□ 可靠性检查
  □ 优雅停机已开启
  □ 健康检查已配置
  □ 日志文件已配置滚动策略
  □ Docker restart 策略设为 unless-stopped

□ 数据安全
  □ 数据库数据卷已挂载（持久化）
  □ 定期备份数据库
```

---

## 十、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| Maven 打包 | ⭐⭐⭐ 必须 | `mvn clean package -DskipTests` |
| Dockerfile | ⭐⭐⭐ 必须 | 多阶段构建，最终镜像只含 JRE + jar |
| docker-compose | ⭐⭐⭐ 必须 | 一键启动应用 + MySQL + Redis |
| 健康检查 | ⭐⭐ 重要 | Actuator + Docker HEALTHCHECK |
| 优雅停机 | ⭐⭐ 重要 | 等请求处理完再停止 |
| JVM 参数 | ⭐⭐ 重要 | Xms/Xmx 合理配置 |
| 日志管理 | ⭐⭐ 重要 | 按天滚动，保留30天 |

---

> 恭喜你！到这里整套 Java 后端教程就全部学完了！  
> 建议回到 [README](../README.md) 复习学习路线，然后动手做一个完整的项目来巩固所学知识。
