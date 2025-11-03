# TypeScript 完整教程

> 从零开始，循序渐进学习 TypeScript —— 包含完整的理论讲解、代码示例和实战项目

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 关于本教程

本教程是一套完整的 TypeScript 学习资料，涵盖从基础到高级的所有知识点，并提供两个完整的实战项目。无论你是 JavaScript 开发者想要学习 TypeScript，还是想深入掌握 TypeScript 的高级特性，这套教程都能满足你的需求。

### ✨ 教程特色

- 📚 **系统完整**：从基础到高级，循序渐进
- 💻 **代码丰富**：每个概念都有完整的代码示例
- 🎯 **实战导向**：两个完整的企业级项目实战
- 🔍 **深入浅出**：复杂概念用简单的例子解释
- 🚀 **最佳实践**：遵循业界最佳实践和规范

## 📚 教程结构

### 🌟 基础篇（5章）
从零开始学习 TypeScript 的核心概念

1. [TypeScript 简介与环境搭建](./基础篇/01-简介与环境搭建.md)
   - TypeScript 是什么
   - 环境配置
   - 第一个 TypeScript 程序

2. [基本类型与类型注解](./基础篇/02-基本类型.md)
   - 原始类型
   - 数组、元组、枚举
   - any、unknown、never
   - 类型推断和类型断言

3. [接口与类型别名](./基础篇/03-接口与类型别名.md)
   - 接口定义和使用
   - 类型别名
   - interface vs type
   - 可选属性和只读属性

4. [函数与可选参数](./基础篇/04-函数.md)
   - 函数类型
   - 可选参数和默认参数
   - 剩余参数
   - 函数重载
   - 高阶函数

5. [类与继承](./基础篇/05-类与继承.md)
   - 类的定义
   - 访问修饰符
   - 继承和抽象类
   - Getter/Setter
   - 静态成员

### 🚀 进阶篇（5章）
掌握 TypeScript 的高级类型系统

6. [泛型编程](./进阶篇/06-泛型.md)
   - 泛型函数、类、接口
   - 泛型约束
   - 泛型默认类型
   - 实用数据结构实现

7. [高级类型](./进阶篇/07-高级类型.md)
   - 联合类型和交叉类型
   - 类型守卫
   - 可辨识联合
   - 索引类型和映射类型
   - 条件类型

8. [枚举与字面量类型](./进阶篇/08-枚举.md)
   - 数字枚举和字符串枚举
   - 常量枚举
   - 字面量类型
   - 枚举 vs 字面量类型

9. [模块与命名空间](./进阶篇/09-模块.md)
   - ES6 模块
   - 模块解析
   - 命名空间
   - 动态导入
   - 模块增强

10. [类型守卫与类型断言](./进阶篇/10-类型守卫.md)
    - typeof 和 instanceof
    - 自定义类型守卫
    - 类型断言
    - 非空断言
    - 控制流分析

### 🔥 高级篇（5章）
深入学习 TypeScript 的企业级应用

11. [装饰器](./高级篇/11-装饰器.md)
    - 装饰器基础
    - 类装饰器、方法装饰器
    - 属性装饰器、参数装饰器
    - 依赖注入实现
    - 路由装饰器实现

12. [声明文件](./高级篇/12-声明文件.md)
    - 声明文件基础
    - 全局声明和模块声明
    - 为第三方库编写声明文件
    - 声明合并
    - 环境声明

13. [工具类型](./高级篇/13-工具类型.md)
    - 内置工具类型（Partial、Required、Pick 等）
    - 自定义工具类型
    - 类型安全的 API 客户端
    - 高级类型编程

14. [TypeScript 配置详解](./高级篇/14-配置详解.md)
    - tsconfig.json 详解
    - 编译选项
    - 项目引用
    - 不同场景的配置

15. [最佳实践与性能优化](./高级篇/15-最佳实践.md)
    - 代码组织
    - 类型定义最佳实践
    - 性能优化
    - 错误处理
    - 测试和文档

### 💼 实战项目（2个）
通过完整项目巩固所学知识

#### [项目一：任务管理系统](./实战项目/任务管理系统/)
使用 **TypeScript + Express + MongoDB** 构建

**功能特性：**
- ✅ 用户认证（JWT）
- ✅ 任务 CRUD
- ✅ 任务状态管理
- ✅ 权限控制
- ✅ RESTful API

**学习要点：**
- Express 与 TypeScript 集成
- Mongoose 类型定义
- 中间件开发
- 认证授权实现

#### [项目二：电商后台管理系统](./实战项目/电商后台管理系统/)
使用 **TypeScript + Koa + MySQL** 构建

**功能特性：**
- ✅ 商品管理
- ✅ 订单管理
- ✅ 分类管理
- ✅ 用户管理
- ✅ 统计分析

**学习要点：**
- TypeORM 使用
- Koa 与 TypeScript
- RBAC 权限设计
- 文件上传处理

### 📝 练习题
- [基础练习题](./练习题/基础练习.md) - 巩固基础知识

## 🚀 快速开始

### 1. 安装 TypeScript

```bash
# 全局安装
npm install -g typescript

# 验证安装
tsc --version
```

### 2. 创建第一个 TypeScript 项目

```bash
# 创建项目目录
mkdir my-ts-project
cd my-ts-project

# 初始化项目
npm init -y

# 安装 TypeScript
npm install --save-dev typescript @types/node

# 创建配置文件
npx tsc --init

# 创建源文件
mkdir src
echo 'const greeting: string = "Hello TypeScript!";
console.log(greeting);' > src/index.ts

# 编译并运行
npx tsc
node dist/index.js
```

### 3. 开始学习

建议按照以下顺序学习：

1. **基础篇**（第 1-5 章）- 1-2 周
2. **进阶篇**（第 6-10 章）- 2-3 周
3. **高级篇**（第 11-15 章）- 2-3 周
4. **实战项目** - 2-4 周

## 💡 学习建议

### 对于初学者

1. **按顺序学习**：不要跳章节，TypeScript 的知识是层层递进的
2. **动手实践**：每学完一章，都要把示例代码敲一遍
3. **做练习题**：完成每章后的练习题，检验学习效果
4. **查阅文档**：遇到问题时查阅 [官方文档](https://www.typescriptlang.org/docs/)

### 对于有经验的开发者

1. **快速浏览基础篇**：如果已熟悉 JavaScript，可快速浏览基础篇
2. **重点学习进阶篇和高级篇**：深入理解 TypeScript 的类型系统
3. **直接上手实战项目**：通过项目学习最快
4. **关注最佳实践**：学习如何在企业项目中应用 TypeScript

## 📝 代码规范

本教程遵循以下代码规范：

- ✅ 使用 4 空格缩进
- ✅ 优先使用 `interface` 定义对象类型
- ✅ 变量使用 `camelCase`
- ✅ 类型/接口使用 `PascalCase`
- ✅ 常量使用 `UPPER_SNAKE_CASE`
- ✅ 启用严格模式（`strict: true`）
- ✅ 避免使用 `any`，优先使用 `unknown`

## 🛠 开发工具推荐

### IDE
- **Visual Studio Code** （强烈推荐）
  - 内置 TypeScript 支持
  - 智能提示和代码补全
  - 调试功能强大

### VS Code 扩展
- TypeScript Importer
- ESLint
- Prettier
- Error Lens
- Path Intellisense

### 在线工具
- [TypeScript Playground](https://www.typescriptlang.org/play) - 在线编辑器
- [StackBlitz](https://stackblitz.com/) - 在线 IDE

## 📖 推荐资源

### 官方资源
- [TypeScript 官方网站](https://www.typescriptlang.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript GitHub](https://github.com/microsoft/TypeScript)

### 学习资源
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [TypeScript 类型挑战](https://github.com/type-challenges/type-challenges)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来完善本教程！

## 📄 许可证

本教程采用 [MIT License](LICENSE) 开源协议。

---

**开始你的 TypeScript 学习之旅吧！** 🎉

