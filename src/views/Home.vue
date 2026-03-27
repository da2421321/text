<template>
  <div class="counter-container">
    <h2>我的计数器</h2>
    <p>当前计数: <strong>{{ count }}</strong></p>

    <button @click="handleIncrement">
      点击 +1
    </button>

    <router-link class="snake-link" to="/snake">Open Snake</router-link>
  </div>
</template>

<script setup name="Counter" lang="ts">
import { ref } from 'vue'

const count = ref(0)

const handleIncrement = () => {
  count.value++
}
</script>

<style scoped>
.counter-container {
  padding: 20px;
  border: 1px solid #ccc;
}

.snake-link {
  display: inline-block;
  margin-top: 12px;
}
</style>
