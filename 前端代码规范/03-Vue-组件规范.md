# 03 - Vue 组件规范（含示例）

## 基本约定
- 单文件组件（SFC）结构顺序：`<template>` → `<script setup lang="ts">` → `<style>`。
- 组件命名使用 `PascalCase`，文件名与组件名一致：`UserCard.vue`。
- `props`/`emits` 显式声明与类型标注；避免隐式 `any`。
- 组合式 API：可复用逻辑抽到 `composables/`；避免在组件中堆积复杂业务。
- 样式使用 `scoped` 并采用 BEM 命名；避免全局污染。

示例组件：
```vue
<template>
  <article class="user-card" :aria-busy="loading ? 'true' : 'false'">
    <header class="user-card__header">
      <h2 class="user-card__title">{{ user?.name ?? '未命名用户' }}</h2>
      <button class="button button--primary" type="button" @click="onRefresh">刷新</button>
    </header>
    <p class="user-card__email">{{ user?.email }}</p>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
}

const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ (e: 'refreshed', user: User): void }>();

const user = ref<User | null>(null);
const loading = ref(false);

async function fetchUser(userId: string): Promise<User> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('加载用户失败');
  return (await res.json()) as User;
}

async function onRefresh() {
  loading.value = true;
  try {
    user.value = await fetchUser(props.userId);
    emit('refreshed', user.value);
  } finally {
    loading.value = false;
  }
}

onMounted(onRefresh);
</script>

<style scoped>
.user-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
}
.user-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.user-card__title { font-size: 16px; margin: 0; }
.user-card__email { color: #6b7280; margin: 0; }

.button { cursor: pointer; padding: 6px 10px; border-radius: 6px; border: 1px solid #3b82f6; color: #fff; background: #3b82f6; }
.button:hover { filter: brightness(1.05); }
</style>

## 细则
- `v-if`/`v-for` 不同元素不要混用在同一标签；优先 `key` 稳定。
- 事件命名使用 kebab-case：`update:model-value`；自定义事件显式定义。
- 禁止在模板中书写复杂逻辑；将计算提到 `computed` 或函数。
- 组件对外暴露最小接口，避免穿透内部实现细节。

