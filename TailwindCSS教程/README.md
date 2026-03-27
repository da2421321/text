# TailwindCSS v4 从入门到精通 - 完整教程

> 一套完整的 TailwindCSS v4 学习资料，从零开始掌握现代 CSS 工具类框架 —— 包含完整的理论讲解、代码示例和实战项目

![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0+-06B6D4.svg)
![CSS](https://img.shields.io/badge/CSS-First-1572B6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 关于本教程

本教程专注于 TailwindCSS v4，这是一次重大版本升级，引入了全新的 CSS 优先配置方式、自动内容检测、CSS 变量设计令牌等革命性特性。无论你是 TailwindCSS 新手，还是从 v3 迁移过来的开发者，这套教程都能帮你快速上手。

### ✨ TailwindCSS v4 核心变化

- 🎨 **CSS 优先配置**：用 `@theme` 指令在 CSS 中配置，告别 `tailwind.config.js`
- ⚡ **零配置安装**：Vite 插件自动检测内容，无需配置 `content` 路径
- 🔧 **CSS 变量令牌**：所有设计令牌自动生成 CSS 变量，可直接在 CSS 中使用
- 🚀 **全新构建引擎**：基于 Rust 的 Oxide 引擎，构建速度提升 5-10 倍
- 📦 **新指令系统**：`@utility`、`@variant`、`@source` 等新指令
- 🎭 **新变体**：`not-*`、`inert`、`nth-*`、`starting` 等全新变体

## 📚 教程结构

### 🌟 基础篇（5章）

1. [TailwindCSS 简介与安装](./基础篇/01-简介与安装.md)
   - TailwindCSS 是什么，v4 有哪些变化
   - Vite / PostCSS / CDN 三种安装方式
   - 第一个 TailwindCSS 页面

2. [核心概念与工作原理](./基础篇/02-核心概念.md)
   - 工具类优先（Utility-First）理念
   - 按需生成 CSS
   - 自动内容检测机制
   - `@import "tailwindcss"` 新语法

3. [布局系统](./基础篇/03-布局系统.md)
   - Flexbox 布局
   - Grid 布局
   - 容器与间距
   - 定位与层叠

4. [响应式设计](./基础篇/04-响应式设计.md)
   - 断点系统
   - 移动优先策略
   - 自定义断点
   - 容器查询（Container Queries）

5. [颜色与排版](./基础篇/05-颜色与排版.md)
   - 全新调色板
   - 文字排版
   - 背景与边框
   - 阴影与透明度

### 🚀 进阶篇（5章）

6. [主题配置（CSS 优先）](./进阶篇/06-主题配置.md)
   - `@theme` 指令详解
   - CSS 变量设计令牌
   - 扩展与覆盖默认主题
   - 多主题切换

7. [状态变体与交互](./进阶篇/07-状态变体.md)
   - 伪类变体（hover、focus、active）
   - 新变体：`not-*`、`inert`、`nth-*`
   - `group-*` 和 `peer-*` 组合变体
   - `@variant` 自定义变体

8. [动画与过渡](./进阶篇/08-动画与过渡.md)
   - 过渡工具类
   - 内置动画
   - `@starting-style` 与 `starting` 变体
   - 自定义动画

9. [深色模式](./进阶篇/09-深色模式.md)
   - `dark:` 变体
   - 系统偏好 vs 手动切换
   - CSS 变量实现主题切换
   - 多主题方案

10. [组件化实践](./进阶篇/10-组件化实践.md)
    - `@apply` 指令
    - `@utility` 自定义工具类
    - 与 Vue / React 组件结合
    - 设计系统构建

### 🔥 高级篇（5章）

11. [自定义插件开发](./高级篇/11-自定义插件.md)
    - 插件 API
    - 添加工具类、组件、变体
    - 发布 TailwindCSS 插件

12. [性能优化](./高级篇/12-性能优化.md)
    - 构建产物分析
    - PurgeCSS 与按需生成
    - 关键 CSS 提取
    - 生产环境最佳实践

13. [框架集成](./高级篇/13-框架集成.md)
    - Vue 3 + TailwindCSS v4
    - React + TailwindCSS v4
    - Next.js / Nuxt 集成
    - Astro 集成

14. [企业级实践](./高级篇/14-企业级实践.md)
    - 设计令牌管理
    - 多品牌主题
    - 团队协作规范
    - 与 UI 组件库共存

15. [v3 迁移指南](./高级篇/15-v3迁移指南.md)
    - 破坏性变更清单
    - 自动迁移工具
    - 常见问题处理
    - 渐进式迁移策略

### 💼 实战项目（2个）

- [企业官网](./实战项目/企业官网/README.md) - 响应式多页面官网
- [后台管理系统](./实战项目/后台管理系统/README.md) - 完整的 Admin Dashboard

### 📝 练习题

- [基础练习](./练习题/基础练习.md)
- [进阶练习](./练习题/进阶练习.md)

## 🚀 快速开始

### Vite 项目（推荐）

```bash
# 创建 Vite 项目
npm create vite@latest my-app -- --template vanilla

cd my-app

# 安装 TailwindCSS v4 Vite 插件
npm install tailwindcss @tailwindcss/vite
```

配置 `vite.config.js`：

```js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

在 CSS 入口文件中导入：

```css
@import "tailwindcss";
```

就这些！无需 `tailwind.config.js`，无需配置 `content` 路径。

### PostCSS 项目

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

`postcss.config.js`：

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### CDN（快速体验）

```html
<script src="https://cdn.tailwindcss.com/4"></script>
```

## 💡 v4 vs v3 快速对比

| 特性 | v3 | v4 |
|------|----|----|
| 配置文件 | `tailwind.config.js` | CSS `@theme` 指令 |
| 内容配置 | 需要配置 `content` 数组 | 自动检测 |
| CSS 导入 | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| 设计令牌 | JS 对象 | CSS 变量 |
| 构建引擎 | Node.js | Rust (Oxide) |
| 自定义工具类 | `@layer utilities` | `@utility` 指令 |
| 自定义变体 | `addVariant()` 插件 | `@variant` 指令 |

## 📄 许可证

本教程采用 [MIT License](LICENSE) 开源协议。
