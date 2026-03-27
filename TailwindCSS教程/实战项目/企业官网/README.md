# 实战项目一：企业官网

## 项目概述

使用 **TailwindCSS v4 + Vue 3 + Vite** 构建一个完整的响应式企业官网。

**技术栈：**
- TailwindCSS v4（样式）
- Vue 3 + Composition API
- Vite（构建工具）
- @tailwindcss/typography（文章排版）

**页面结构：**
- 首页（Hero + 特性 + 定价 + CTA）
- 关于我们
- 产品/服务
- 博客列表 + 详情
- 联系我们

## 项目初始化

```bash
npm create vue@latest company-website -- --typescript
cd company-website
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography
```

`vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

`src/styles/main.css`：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-sans: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  --color-brand-50: oklch(97% 0.02 250);
  --color-brand-100: oklch(93% 0.05 250);
  --color-brand-500: oklch(60% 0.2 250);
  --color-brand-600: oklch(52% 0.22 250);
  --color-brand-700: oklch(44% 0.2 250);

  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
```

## 核心组件实现

### 导航组件（TheNavbar.vue）

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const navLinks = [
  { label: '首页', href: '/' },
  { label: '产品', href: '/products' },
  { label: '定价', href: '/pricing' },
  { label: '博客', href: '/blog' },
  { label: '关于', href: '/about' },
]

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <header
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100'
        : 'bg-transparent',
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 lg:h-20">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">C</span>
          </div>
          <span
            :class="['text-xl font-bold transition-colors', isScrolled ? 'text-gray-900' : 'text-white']"
          >
            Company
          </span>
        </a>

        <!-- 桌面导航 -->
        <nav class="hidden lg:flex items-center gap-8">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            :class="[
              'font-medium transition-colors',
              isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white',
            ]"
          >
            {{ link.label }}
          </a>
        </nav>

        <!-- 操作按钮 -->
        <div class="hidden lg:flex items-center gap-3">
          <a
            href="/login"
            :class="['font-medium transition-colors', isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white']"
          >
            登录
          </a>
          <a
            href="/signup"
            class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            免费开始
          </a>
        </div>

        <!-- 移动端菜单按钮 -->
        <button
          class="lg:hidden p-2 rounded-lg"
          :class="isScrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div
      v-show="isMobileMenuOpen"
      class="lg:hidden bg-white border-t border-gray-100 shadow-lg"
    >
      <div class="max-w-7xl mx-auto px-4 py-4 space-y-1">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          {{ link.label }}
        </a>
        <div class="pt-3 border-t border-gray-100 flex flex-col gap-2">
          <a href="/login" class="block px-4 py-3 text-center text-gray-700 font-medium">登录</a>
          <a href="/signup" class="block px-4 py-3 text-center bg-brand-600 text-white font-semibold rounded-xl">
            免费开始
          </a>
        </div>
      </div>
    </div>
  </header>
</template>
```

### Hero 区域（HeroSection.vue）

```vue
<template>
  <section class="relative min-h-screen bg-gradient-to-br from-gray-900 via-brand-900 to-gray-900 flex items-center overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <!-- 文字内容 -->
        <div>
          <!-- 标签 -->
          <div class="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span class="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span>
            全新 v4 版本发布
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            构建更快<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
              更美的界面
            </span>
          </h1>

          <p class="text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
            使用 TailwindCSS v4，享受 CSS 优先的配置方式、极速构建引擎和全新的设计令牌系统。
          </p>

          <div class="flex flex-col sm:flex-row gap-4">
            <a
              href="/docs"
              class="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-lg"
            >
              开始使用
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </a>
            <a
              href="/demo"
              class="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-lg"
            >
              查看演示
            </a>
          </div>

          <!-- 统计数据 -->
          <div class="flex gap-8 mt-12 pt-12 border-t border-white/10">
            <div>
              <p class="text-3xl font-bold text-white">10x</p>
              <p class="text-sm text-gray-500 mt-1">构建速度提升</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-white">50k+</p>
              <p class="text-sm text-gray-500 mt-1">开发者使用</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-white">100%</p>
              <p class="text-sm text-gray-500 mt-1">类型安全</p>
            </div>
          </div>
        </div>

        <!-- 代码展示 -->
        <div class="hidden lg:block">
          <div class="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <!-- 标题栏 -->
            <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="ml-2 text-xs text-gray-500 font-mono">main.css</span>
            </div>
            <!-- 代码内容 -->
            <div class="p-6 font-mono text-sm">
              <p class="text-purple-400">@import <span class="text-green-400">"tailwindcss"</span>;</p>
              <p class="mt-4 text-purple-400">@theme <span class="text-white">{</span></p>
              <p class="pl-4 text-blue-400">--color-brand: <span class="text-orange-400">#3B82F6</span>;</p>
              <p class="pl-4 text-blue-400">--font-sans: <span class="text-green-400">'Inter'</span>;</p>
              <p class="text-white">}</p>
              <p class="mt-4 text-gray-500">/* 就这些！自动检测内容 */</p>
              <p class="mt-4 text-gray-500">/* 无需 content 配置 */</p>
              <p class="text-gray-500">/* 无需 tailwind.config.js */</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

### 特性区域（FeaturesSection.vue）

```vue
<script setup>
const features = [
  {
    icon: '⚡',
    title: 'CSS 优先配置',
    description: '用 @theme 指令在 CSS 中配置设计令牌，告别 tailwind.config.js。',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: '🚀',
    title: '极速构建',
    description: '基于 Rust 的 Oxide 引擎，全量构建速度提升 10 倍，增量构建近乎即时。',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: '🎨',
    title: 'CSS 变量令牌',
    description: '所有设计令牌自动生成 CSS 变量，可在任何地方直接使用。',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: '🔍',
    title: '自动内容检测',
    description: '无需配置 content 路径，自动扫描项目文件，零配置开箱即用。',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: '📦',
    title: '容器查询',
    description: '内置容器查询支持，基于父容器宽度响应，而非视口宽度。',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: '🌙',
    title: '深色模式',
    description: '完善的深色模式支持，跟随系统或手动切换，CSS 变量轻松实现。',
    color: 'bg-indigo-100 text-indigo-600',
  },
]
</script>

<template>
  <section class="py-24 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          为什么选择 TailwindCSS v4
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          全新架构，更快的构建速度，更简洁的配置方式，更强大的功能。
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4', feature.color]">
            {{ feature.icon }}
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
```

## 页面组合（App.vue）

```vue
<script setup>
import TheNavbar from './components/TheNavbar.vue'
import HeroSection from './components/HeroSection.vue'
import FeaturesSection from './components/FeaturesSection.vue'
import PricingSection from './components/PricingSection.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <div class="min-h-screen">
    <TheNavbar />
    <main>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </main>
    <TheFooter />
  </div>
</template>
```

## 学习要点

- 响应式导航：移动端汉堡菜单 + 桌面端水平导航
- 滚动状态检测：`window.scrollY` + 动态类名
- Hero 区域：渐变背景 + 装饰元素 + 响应式布局
- 特性卡片：Grid 布局 + hover 效果
- 深色背景上的文字对比度处理
