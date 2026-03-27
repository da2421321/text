<template>
  <div class="basic-card">
    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.basic-card {
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-content {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
