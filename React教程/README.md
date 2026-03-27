# React 从入门到精通 - 完整教程

## 📚 目录

1. [基础篇 - React 入门](#基础篇---react-入门)
2. [进阶篇 - 核心概念与最佳实践](#进阶篇---核心概念与最佳实践)
3. [实战项目 - 完整应用开发](#实战项目---完整应用开发)
4. [练习题 - 巩固所学知识](#练习题---巩固所学知识)

## 🚀 快速开始

### 环境要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- 代码编辑器（推荐 VS Code）

### 安装依赖

```bash
# 进入教程目录
cd React教程

# 安装所有依赖（如果需要运行示例代码）
npm install
```

### 运行示例

```bash
# 创建新的 React 项目
npx create-react-app my-app

# 或者使用 Vite（推荐）
npm create vite@latest my-app -- --template react

# 进入项目目录
cd my-app

# 启动开发服务器
npm run dev
```

## 📖 学习路径

### 初学者路径

1. [简介与环境搭建](./基础篇/01-简介与环境搭建.md) - 了解 React 并搭建开发环境
2. [JSX 基础](./基础篇/02-JSX基础.md) - 学习 JSX 语法
3. [组件与 Props](./基础篇/03-组件与Props.md) - 掌握组件和属性
4. [State 与生命周期](./基础篇/04-State与生命周期.md) - 学习状态管理
5. [事件处理](./基础篇/05-事件处理.md) - 处理用户交互
6. [表单处理](./基础篇/06-表单处理.md) - 处理表单输入

### 进阶路径

1. [React Router](./进阶篇/07-React-Router.md) - 路由管理
2. [Hooks 进阶](./进阶篇/08-Hooks进阶.md) - 自定义 Hooks
3. [状态管理](./进阶篇/09-状态管理.md) - Redux、MobX、Zustand 等
4. [性能优化](./进阶篇/10-性能优化.md) - 优化应用性能
5. [测试](./进阶篇/11-测试.md) - 单元测试和端到端测试
6. [部署](./进阶篇/12-部署.md) - 部署到生产环境
7. [TypeScript](./进阶篇/13-TypeScript.md) - 使用 TypeScript
8. [React 新特性](./进阶篇/14-React新特性.md) - React 18/19 新特性
9. [Next.js 详解](./进阶篇/15-Next.js详解.md) - Next.js 框架深入
10. [错误处理](./进阶篇/16-错误处理.md) - 错误边界与异常处理

### 实战项目

1. [在线商城](./实战项目/在线商城/README.md) - 完整的电商应用

### 练习题

1. [基础练习](./练习题/基础练习.md) - 25 个练习题和 5 个综合项目
2. [练习题答案](./练习题/答案/README.md) - 参考答案和代码示例

## 📚 基础篇 - React 入门

### 01. 简介与环境搭建

- 什么是 React
- React 的核心特点
- 环境搭建（Create React App、Vite、Next.js）
- 开发工具推荐
- 第一个 React 组件

### 02. JSX 基础

- JSX 基本语法
- 嵌套元素
- JavaScript 表达式
- 属性（Props）
- 条件渲染
- 列表渲染
- 样式
- 注释
- 自闭合标签
- 事件处理

### 03. 组件与 Props

- 函数组件 vs 类组件
- Props 基本用法
- 解构 Props
- 默认 Props
- Props 类型检查
- 组件组合
- 组件通信

### 04. State 与生命周期

- 使用 useState Hook
- 使用 useEffect Hook
- 其他常用 Hooks（useReducer、useContext、useMemo、useCallback、useRef）
- 实战示例：待办事项应用

### 05. 事件处理

- 基本语法
- 常见事件类型（鼠标事件、键盘事件、表单事件、滚动事件）
- 事件对象
- 阻止默认行为
- 阻止事件冒泡
- 条件事件处理
- 事件委托
- 实战示例：交互式计数器、拖拽功能

### 06. 表单处理

- 受控组件
- 非受控组件
- 表单验证
- 实时验证
- 实战示例：用户注册表单
- 推荐表单库（Formik、React Hook Form）

## 🚀 进阶篇 - 核心概念与最佳实践

### 07. React Router

- 基本配置
- 路由配置
- 导航组件
- 路由参数
- 编程式导航
- 路由守卫
- 404 页面
- 滚动恢复
- 实战示例：博客应用

### 08. Hooks 进阶

- 自定义 Hooks
- Hooks 规则
- 高级 Hooks（useTransition、useDeferredValue、useId、useSyncExternalStore）
- Hooks 性能优化（useMemo、useCallback）
- 实战示例：自定义 Hook 组合

### 09. 状态管理

- Context API
- Redux
- MobX
- Zustand
- Jotai
- Recoil
- 状态管理方案对比
- 实战示例：购物车

### 10. 性能优化

- 使用 React.memo
- 使用 useMemo
- 使用 useCallback
- 虚拟化长列表
- 代码分割
- 避免不必要的渲染
- 使用 Transition
- 使用 Deferred Value
- 优化图片加载
- 使用 Web Workers
- 实战示例：优化后的列表组件
- 性能监控

### 11. 测试

- 测试类型（单元测试、集成测试、端到端测试）
- Jest 和 React Testing Library
- 基本测试
- 测试组件渲染
- 测试用户交互
- 测试异步操作
- Mock API 调用
- 测试 Hooks
- 测试表单
- 测试路由
- 测试 Context
- 快照测试
- 测试覆盖率
- Cypress（端到端测试）
- Playwright（端到端测试）
- 测试最佳实践

### 12. 部署

- 构建生产版本
- 部署到 Netlify
- 部署到 Vercel
- 部署到 GitHub Pages
- 部署到 AWS S3
- 部署到 Firebase Hosting
- 部署到 Docker
- 部署到 Nginx
- 环境变量
- 性能优化
- 监控和日志
- CI/CD
- 安全最佳实践

### 13. TypeScript

- 为什么使用 TypeScript
- 安装和配置
- 基本类型
- 对象类型
- 函数类型
- React 组件类型
- useState 类型
- useEffect 类型
- useRef 类型
- 自定义 Hook 类型
- 高级类型（联合类型、交叉类型、类型守卫、泛型）
- 实战示例：完整的 TypeScript React 应用
- TypeScript 最佳实践

## 🎯 实战项目 - 完整应用开发

### 在线商城

- 项目简介
- 技术栈
- 项目结构
- 类型定义
- Redux Store
- 组件
- 页面
- API 工具
- 应用入口
- 运行项目
- 项目特点
- 扩展功能

## 📝 练习题 - 巩固所学知识

### 基础练习

包含 25 个练习题，涵盖 React 基础知识：

1. 创建个人资料卡片
2. 实现计数器
3. 待办事项列表
4. 表单验证
5. 商品列表
6. 模态框组件
7. 标签页组件
8. 搜索框组件
9. 图片轮播组件
10. 折叠面板组件
11. 评分组件
12. 无限滚动列表
13. 拖拽排序
14. 树形组件
15. 日历组件
16. 图表组件
17. 表格组件
18. 通知组件
19. 进度条组件
20. 文件上传组件

### 进阶练习

21. 使用 React Router 实现路由
22. 使用 Redux 管理状态
23. 使用 Context API
24. 自定义 Hook
25. 性能优化

### 综合项目练习

1. 博客系统
2. 任务管理系统
3. 天气预报应用
4. 音乐播放器
5. 社交网络应用

## 🛠️ 开发工具推荐

### 编辑器

- **VS Code** - 推荐的代码编辑器
- **WebStorm** - JetBrains 的 IDE

### VS Code 插件

- **ES7+ React/Redux/React-Native snippets** - React 代码片段
- **Prettier** - 代码格式化
- **ESLint** - 代码检查
- **TypeScript Importer** - 自动导入 TypeScript 类型
- **Auto Rename Tag** - 自动重命名标签
- **Bracket Pair Colorizer** - 括号颜色匹配

### 浏览器扩展

- **React Developer Tools** - React 调试工具
- **Redux DevTools** - Redux 调试工具

## 📖 学习资源

### 官方文档

- [React 官方文档](https://react.dev/)
- [React 中文文档](https://zh-hans.react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Redux Toolkit 官方文档](https://redux-toolkit.js.org/)
- [React Router 官方文档](https://reactrouter.com/)

### 推荐书籍

- 《React 学习手册》
- 《React 进阶之路》
- 《深入浅出 React 和 Redux》
- 《TypeScript 编程》

### 在线课程

- React 官方教程
- Udemy React 课程
- Coursera React 课程
- 极客时间 React 课程

### 社区

- [React 官方论坛](https://react.dev/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/reactjs)
- [Reddit r/reactjs](https://www.reddit.com/r/reactjs/)
- [React 中文社区](https://react-china.org/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个教程。

## 📄 许可证

MIT License

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 发送邮件
- 加入社区讨论

## 🎓 学习建议

1. **循序渐进**：按照教程的顺序学习，不要跳过基础
2. **动手实践**：每学完一个章节，都要动手写代码
3. **多做练习**：完成所有练习题，巩固所学知识
4. **阅读源码**：阅读优秀的开源项目源码，学习最佳实践
5. **参与社区**：加入 React 社区，与其他开发者交流
6. **持续学习**：React 生态发展迅速，要持续学习新知识

## 🎯 学习目标

完成本教程后，你将能够：

- 独立开发 React 应用
- 理解 React 的核心概念和最佳实践
- 使用 TypeScript 开发类型安全的 React 应用
- 使用状态管理工具管理应用状态
- 使用 React Router 实现路由
- 优化 React 应用性能
- 编写测试保证代码质量
- 部署 React 应用到生产环境

## 📊 学习时间

- **基础篇**：2-3 周
- **进阶篇**：3-4 周
- **实战项目**：2-3 周
- **练习题**：2-3 周

总计：约 9-13 周（每天学习 2-3 小时）

## 🚀 开始学习

准备好了吗？让我们开始学习 React 吧！

从 [简介与环境搭建](./基础篇/01-简介与环境搭建.md) 开始你的 React 之旅。
