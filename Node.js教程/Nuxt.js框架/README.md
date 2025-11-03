# Nuxt.js 框架教程

## 📚 目录
1. [Nuxt.js 简介](#nuxtjs-简介)
2. [环境搭建](#环境搭建)
3. [项目结构](#项目结构)
4. [核心概念](#核心概念)
5. [路由系统](#路由系统)
6. [数据获取](#数据获取)
7. [状态管理](#状态管理)
8. [SEO优化](#seo优化)
9. [部署上线](#部署上线)
10. [实战项目](#实战项目)

## Nuxt.js 简介

Nuxt.js 是一个基于 Vue.js 的通用应用框架，它简化了 Vue.js 应用的开发，提供了服务器端渲染(SSR)、静态站点生成(SSG)、单页应用(SPA)等多种渲染模式。

### 主要特性
- 🔧 **自动路由** - 基于文件系统的路由
- 🚀 **服务器端渲染** - 提升SEO和首屏加载速度
- 📦 **自动代码分割** - 优化加载性能
- 🎨 **强大的开发体验** - 热重载、错误提示
- 🔌 **模块系统** - 丰富的生态系统
- 🛡️ **TypeScript支持** - 类型安全

## 环境搭建

### 系统要求
- Node.js 14.18.0 或更高版本
- npm 或 yarn 包管理器

### 创建新项目
```bash
# 使用 nuxi CLI 创建新项目
npx nuxi@latest init my-nuxt-app

# 进入项目目录
cd my-nuxt-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 项目脚本
```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  }
}
```

## 项目结构

```
my-nuxt-app/
├── .nuxt/                 # Nuxt自动生成的目录
├── assets/                # 静态资源文件
│   ├── css/
│   └── images/
├── components/            # Vue组件
│   └── AppButton.vue
├── composables/           # 组合式函数
│   └── useCounter.ts
├── layouts/               # 布局组件
│   └── default.vue
├── middleware/            # 中间件
│   └── auth.ts
├── pages/                 # 页面组件
│   ├── index.vue
│   └── about.vue
├── plugins/               # 插件
│   └── api.ts
├── public/                # 静态文件
│   └── favicon.ico
├── server/                # 服务端API
│   └── api/
├── app.vue                # 根组件
├── nuxt.config.ts         # 配置文件
└── package.json
```

## 核心概念

### App.vue 根组件
```vue
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

### 页面组件
```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>欢迎来到Nuxt.js</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
const message = '这是一个Nuxt.js页面'
</script>

<style scoped>
h1 {
  color: #00dc82;
}
</style>
```

## 路由系统

### 自动路由
Nuxt.js 基于文件系统自动生成路由：

```
pages/
├── index.vue         → /
├── about.vue         → /about
├── products/
│   ├── index.vue     → /products
│   └── [id].vue      → /products/:id
└── user/
    ├── index.vue     → /user
    └── [id].vue      → /user/:id
```

### 动态路由
```vue
<!-- pages/products/[id].vue -->
<template>
  <div>
    <h1>产品详情</h1>
    <p>ID: {{ route.params.id }}</p>
  </div>
</template>

<script setup>
const route = useRoute()
</script>
```

### 嵌套路由
```vue
<!-- pages/products/index.vue -->
<template>
  <div>
    <h1>产品列表</h1>
    <NuxtLink to="/products/1">产品1</NuxtLink>
  </div>
</template>
```

## 数据获取

### useAsyncData
```vue
<script setup>
const { data: products, pending, error } = await useAsyncData(
  'products',
  () => $fetch('/api/products')
)
</script>
```

### useFetch
```vue
<script setup>
const { data: product } = await useFetch(`/api/products/${id}`)
</script>
```

### 服务端API
```typescript
// server/api/products.ts
export default defineEventHandler(async (event) => {
  return {
    products: [
      { id: 1, name: '产品1', price: 100 },
      { id: 2, name: '产品2', price: 200 }
    ]
  }
})
```

## 状态管理

### Composables 状态管理
```typescript
// composables/useCart.ts
export const useCart = () => {
  const cart = useState('cart', () => [])
  
  const addToCart = (product) => {
    cart.value.push(product)
  }
  
  const removeFromCart = (productId) => {
    cart.value = cart.value.filter(item => item.id !== productId)
  }
  
  return {
    cart,
    addToCart,
    removeFromCart
  }
}
```

### 使用状态
```vue
<script setup>
const { cart, addToCart } = useCart()
</script>
```

## SEO优化

### 元数据设置
```vue
<script setup>
useHead({
  title: '页面标题',
  meta: [
    { name: 'description', content: '页面描述' },
    { property: 'og:title', content: 'OG标题' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com' }
  ]
})
</script>
```

### Sitemap 生成
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'],
  sitemap: {
    hostname: 'https://example.com',
    routes: ['/about', '/products']
  }
})
```

## 部署上线

### 静态部署
```bash
# 生成静态站点
npm run generate

# 预览静态站点
npm run preview
```

### 服务端渲染部署
```bash
# 构建应用
npm run build

# 启动服务
node .output/server/index.mjs
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

## 实战项目

### 电商网站示例
1. 商品展示页面
2. 商品详情页面
3. 购物车功能
4. 用户登录注册
5. 订单管理

### 博客系统示例
1. 文章列表
2. 文章详情
3. 分类标签
4. 评论系统
5. 搜索功能

---

## 学习资源

- [官方文档](https://nuxt.com/docs)
- [示例项目](https://github.com/nuxt/examples)
- [模块市场](https://nuxt.com/modules)