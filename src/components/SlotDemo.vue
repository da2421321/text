<template>
  <div class="slot-demo">
    <h2>插槽演示组件</h2>
    
    <!-- 基础插槽 -->
    <div class="card">
      <h3>基础插槽</h3>
      <BasicCard>
        <p>这是插入到基础插槽的内容</p>
      </BasicCard>
    </div>

    <!-- 具名插槽 -->
    <div class="card">
      <h3>具名插槽</h3>
      <NamedCard>
        <template #header>
          <h4>自定义标题</h4>
        </template>
        <template #default>
          <p>这是主要内容区域</p>
        </template>
        <template #footer>
          <button>确定按钮</button>
        </template>
      </NamedCard>
    </div>

    <!-- 作用域插槽 -->
    <div class="card">
      <h3>作用域插槽</h3>
      <ScopedList :items="userList">
        <template #default="{ item, index }">
          <div class="user-item">
            <span>{{ index + 1 }}. </span>
            <strong>{{ item.name }}</strong>
            <span> - {{ item.age }}岁</span>
          </div>
        </template>
      </ScopedList>
    </div>

    <!-- 动态插槽 -->
    <div class="card">
      <h3>动态插槽</h3>
      <DynamicCard>
        <template #[dynamicSlot]>
          <p>这是动态插槽内容: {{ dynamicSlot }}</p>
        </template>
      </DynamicCard>
      <button @click="toggleSlot">切换插槽</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BasicCard from './slots/BasicCard.vue'
import DynamicCard from './slots/DynamicCard.vue'
import NamedCard from './slots/NamedCard.vue'
import ScopedList from './slots/ScopedList.vue'

const dynamicSlot = ref('header')
const userList = ref([
  { name: '张三', age: 25 },
  { name: '李四', age: 30 },
  { name: '王五', age: 28 }
])

const toggleSlot = () => {
  dynamicSlot.value = dynamicSlot.value === 'header' ? 'footer' : 'header'
}
</script>

<style scoped>
.slot-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.card h3 {
  margin-top: 0;
  color: #333;
}

.user-item {
  padding: 8px;
  margin: 4px 0;
  background: white;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background: #0056b3;
}
</style>
