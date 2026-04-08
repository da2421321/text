# Java 后端开发教程（零基础新手版）

> **适用人群**：完全没有 Java 经验、或前端转后端的同学  
> **教学理念**：每个概念都用生活类比 + 白话解释 + 完整可运行代码 + 常见踩坑，确保你能真正理解而非死记硬背

---

## 一、这套教程能教你什么？

学完这套教程，你将能够：

1. **独立搭建** 一个生产级 Spring Boot 后端项目
2. **理解** Java 语言的核心语法、面向对象、集合、异常、泛型、并发
3. **掌握** REST API 设计、数据库操作、缓存、认证鉴权
4. **具备** 企业级项目的工程化能力：分层架构、配置管理、单元测试、Docker 部署

---

## 二、技术栈一览

| 分类 | 技术 | 作用（白话解释） |
|------|------|-----------------|
| 语言 | Java 17 | 写代码的语言，类似 JavaScript/TypeScript |
| 构建 | Maven | 管理依赖 + 打包工具，类似 npm/pnpm |
| 框架 | Spring Boot 3.x | Web 框架，类似 Express/Nest.js |
| 数据库 | MySQL + Spring Data JPA | 存数据 + ORM框架，类似 Prisma/TypeORM |
| 缓存 | Redis + Spring Cache | 加速查询，减少数据库压力 |
| 认证 | Spring Security + JWT | 登录认证 + 权限管理 |
| 部署 | Docker + docker-compose | 打包 + 一键部署 |

---

## 三、学习路线（建议按顺序）

```
第一阶段：语言基础（1~2周）
├── 01-基础篇
│   ├── 01-环境与语法初探          ← 先跑起来，熟悉基本语法
│   ├── 02-面向对象、接口与集合框架  ← Java 的核心思想
│   └── 03-Lombok快速上手          ← 消除模板代码，开发效率翻倍 ⭐新增
│
第二阶段：进阶能力（1~2周）
├── 02-进阶篇
│   ├── 01-异常处理与泛型进阶      ← 写出健壮的代码
│   ├── 02-并发编程与JUC           ← 理解多线程（后端必备）
│   └── 03-SpringBoot单元测试      ← JUnit5 + Mockito，保证代码质量 ⭐新增
│
第三阶段：动手实战（1~2周）
├── 03-实战篇
│   ├── 01-SpringBoot框架搭建REST接口  ← 搭建真实API
│   └── 02-SpringDataJPA数据库操作     ← 连接数据库做CRUD
│
第四阶段：企业级进阶（2~3周）
└── 04-企业级工程化篇
    ├── 01-标准项目目录结构
    ├── 02-配置管理与多环境
    ├── 03-核心中间件与认证
    ├── 04-三层架构与解耦
    ├── 05-参数校验与统一异常响应
    ├── 06-MySQL连接池与表关系模型
    ├── 07-Redis缓存与高并发查询策略
    └── 08-线上生产级Docker部署打包指南
```

---

## 四、前置要求

- **必须**：会用电脑，会装软件（仅此而已！）
- **加分**：有任何编程经验（前端、Python 等都行）
- **不需要**：不需要提前学 Java，这套教程从零开始教

---

## 五、如果你是前端转后端

这套教程特别为前端同学做了对照说明：

| 前端概念 | Java 后端对应 |
|---------|--------------|
| `npm install` | `mvn install`（Maven 安装依赖） |
| `package.json` | `pom.xml`（项目配置文件） |
| `node_modules/` | `.m2/repository/`（本地依赖缓存） |
| `Express/Koa` | `Spring Boot`（Web 框架） |
| `Prisma/TypeORM` | `Spring Data JPA`（ORM 框架） |
| `middleware` | `Filter / Interceptor / AOP` |
| `JWT 认证` | `Spring Security + JWT` |
| `.env` | `application.yml`（配置文件） |
| `docker build` | 一样！Java 也用 Docker 部署 |

---

## 六、学习建议

1. **一定要动手敲代码**，不要只看不练
2. **遇到报错先看错误信息**，Java 的报错通常很详细
3. **每章末尾都有练习题**，务必完成
4. **不要跳章节**，后面的内容依赖前面的知识
5. **善用搜索**：`Java XXX教程` 或 `Spring Boot XXX example`

---

## 七、推荐工具

| 工具 | 用途 | 下载地址 |
|------|------|---------|
| IntelliJ IDEA（社区版免费） | Java IDE，最好用的 | https://www.jetbrains.com/idea/ |
| JDK 17 | Java 运行环境 | https://adoptium.net/ |
| Maven | 构建工具 | https://maven.apache.org/ |
| MySQL 8.0 | 数据库 | https://dev.mysql.com/downloads/ |
| Redis | 缓存 | https://redis.io/download/ |
| Postman / Apifox | 接口测试 | https://www.postman.com/ |
| Docker Desktop | 容器化部署 | https://www.docker.com/ |
| Lombok（IDEA 插件） | 自动生成 getter/setter | IDEA 内置，Settings → Plugins 搜索安装 |
| JUnit 5 | 单元测试框架 | 通过 `spring-boot-starter-test` 自动引入 |

---

> 准备好了吗？让我们从第一章开始吧！→ [01-环境与语法初探](./01-基础篇/01-环境与语法初探.md)
