<template>
  <div class="scoped-list">
    <h4>用户列表</h4>
    <div class="list-container">
      <div 
        v-for="(item, index) in items" 
        :key="index"
        class="slot-wrapper"
      >
        <slot :item="item" :index="index">
          <!-- 默认显示 -->
          <div class="default-item">
            {{ item.name }} ({{ item.age }})
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.scoped-list {
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.scoped-list h4 {
  margin-top: 0;
  color: #856404;
}

.list-container {
  margin-top: 12px;
}

.default-item {
  padding: 8px;
  margin: 4px 0;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}
</style>
