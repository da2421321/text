# 实战项目二：后台管理系统

## 项目概述

使用 **TailwindCSS v4 + Vue 3 + Pinia + Vue Router** 构建一个完整的 Admin Dashboard。

**技术栈：**
- TailwindCSS v4
- Vue 3 + Composition API + TypeScript
- Pinia（状态管理）
- Vue Router 4
- Chart.js（图表）
- @tailwindcss/typography

**功能模块：**
- 登录/注册页
- 仪表盘（数据概览）
- 用户管理（列表、详情、编辑）
- 商品管理
- 订单管理
- 系统设置
- 深色模式切换

## 项目结构

```
src/
  components/
    layout/
      AppSidebar.vue      # 侧边栏
      AppHeader.vue       # 顶部栏
      AppLayout.vue       # 布局容器
    ui/
      BaseButton.vue      # 按钮
      BaseInput.vue       # 输入框
      BaseTable.vue       # 表格
      BaseModal.vue       # 弹窗
      BaseBadge.vue       # 徽章
      BaseCard.vue        # 卡片
      StatCard.vue        # 统计卡片
  views/
    LoginView.vue
    DashboardView.vue
    UsersView.vue
    ProductsView.vue
    OrdersView.vue
    SettingsView.vue
  stores/
    auth.ts
    theme.ts
  styles/
    main.css
```

## 核心布局实现

### 侧边栏（AppSidebar.vue）

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  collapsed: boolean
}>()

const route = useRoute()

const menuItems = [
  { icon: '📊', label: '仪表盘', to: '/dashboard' },
  { icon: '👥', label: '用户管理', to: '/users' },
  { icon: '📦', label: '商品管理', to: '/products' },
  { icon: '📋', label: '订单管理', to: '/orders' },
  { icon: '⚙️', label: '系统设置', to: '/settings' },
]

function isActive(to: string) {
  return route.path.startsWith(to)
}
</script>

<template>
  <aside
    :class="[
      'flex flex-col bg-gray-900 dark:bg-gray-950 transition-all duration-300 h-screen sticky top-0',
      collapsed ? 'w-16' : 'w-64',
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-gray-800">
      <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-sm">A</span>
      </div>
      <span v-if="!collapsed" class="text-white font-bold text-lg truncate">Admin</span>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group',
          isActive(item.to)
            ? 'bg-brand-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white',
        ]"
      >
        <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
        <span v-if="!collapsed" class="font-medium truncate">{{ item.label }}</span>

        <!-- 折叠时的 tooltip -->
        <div
          v-if="collapsed"
          class="absolute left-16 bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
        >
          {{ item.label }}
        </div>
      </router-link>
    </nav>

    <!-- 用户信息 -->
    <div class="px-2 py-4 border-t border-gray-800">
      <div :class="['flex items-center gap-3 px-3 py-2 rounded-xl', collapsed ? 'justify-center' : '']">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex-shrink-0"></div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">管理员</p>
          <p class="text-xs text-gray-500 truncate">admin@example.com</p>
        </div>
      </div>
    </div>
  </aside>
</template>
```

### 顶部栏（AppHeader.vue）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'

defineProps<{ onToggleSidebar: () => void }>()

const themeStore = useThemeStore()
const searchQuery = ref('')
</script>

<template>
  <header class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-40">
    <!-- 折叠按钮 -->
    <button
      @click="onToggleSidebar"
      class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- 搜索框 -->
    <div class="flex-1 max-w-md">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜索..."
          class="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
      </div>
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <!-- 通知 -->
      <button class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <!-- 深色模式切换 -->
      <button
        @click="themeStore.toggle()"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span v-if="themeStore.isDark">☀️</span>
        <span v-else>🌙</span>
      </button>
    </div>
  </header>
</template>
```

## 仪表盘页面（DashboardView.vue）

```vue
<script setup lang="ts">
const stats = [
  { label: '总用户', value: '12,345', change: '+12%', trend: 'up', icon: '👥', color: 'bg-blue-50 text-blue-600' },
  { label: '今日订单', value: '234', change: '+8%', trend: 'up', icon: '📋', color: 'bg-green-50 text-green-600' },
  { label: '月收入', value: '¥56,789', change: '+23%', trend: 'up', icon: '💰', color: 'bg-purple-50 text-purple-600' },
  { label: '退款率', value: '2.4%', change: '-0.3%', trend: 'down', icon: '↩️', color: 'bg-orange-50 text-orange-600' },
]

const recentOrders = [
  { id: '#001', customer: '张三', product: 'Pro 套餐', amount: '¥299', status: 'completed' },
  { id: '#002', customer: '李四', product: 'Basic 套餐', amount: '¥99', status: 'pending' },
  { id: '#003', customer: '王五', product: 'Enterprise', amount: '¥999', status: 'processing' },
  { id: '#004', customer: '赵六', product: 'Pro 套餐', amount: '¥299', status: 'completed' },
]

const statusConfig = {
  completed: { label: '已完成', class: 'bg-green-100 text-green-700' },
  pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', class: 'bg-blue-100 text-blue-700' },
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">欢迎回来，今天是个好日子！</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-lg', stat.color]">
            {{ stat.icon }}
          </div>
          <span
            :class="[
              'text-xs font-medium px-2 py-1 rounded-full',
              stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            ]"
          >
            {{ stat.change }}
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <!-- 图表 + 最近订单 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 图表区域 -->
      <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-bold text-gray-900 dark:text-white">销售趋势</h2>
          <select class="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none">
            <option>最近 7 天</option>
            <option>最近 30 天</option>
            <option>最近 90 天</option>
          </select>
        </div>
        <!-- 图表占位 -->
        <div class="h-48 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center text-gray-400">
          图表区域（集成 Chart.js）
        </div>
      </div>

      <!-- 最近订单 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 class="font-bold text-gray-900 dark:text-white mb-4">最近订单</h2>
        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between py-2"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ order.customer }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ order.product }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ order.amount }}</p>
              <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[order.status].class]">
                {{ statusConfig[order.status].label }}
              </span>
            </div>
          </div>
        </div>
        <a href="/orders" class="block mt-4 text-center text-sm text-brand-600 hover:text-brand-700 font-medium">
          查看全部订单 →
        </a>
      </div>
    </div>
  </div>
</template>
```

## 学习要点

- 侧边栏折叠/展开动画
- 深色模式与 Pinia 状态管理结合
- 响应式仪表盘布局（Grid）
- 统计卡片设计模式
- 表格组件封装
- 路由高亮状态
