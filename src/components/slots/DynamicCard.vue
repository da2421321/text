<template>
  <div class="dynamic-card">
    <header v-if="$slots.header" class="dynamic-header">
      <slot name="header"></slot>
    </header>
    
    <main class="dynamic-body">
      <slot></slot>
    </main>
    
    <footer v-if="$slots.footer" class="dynamic-footer">
      <slot name="footer"></slot>
    </footer>
    
    <aside v-if="$slots.sidebar" class="dynamic-sidebar">
      <slot name="sidebar"></slot>
    </aside>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dynamic-card {
  border: 2px solid #6f42c1;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
}

.dynamic-header {
  background: #6f42c1;
  color: white;
  padding: 12px 16px;
  border-radius: 6px 6px 0 0;
}

.dynamic-body {
  padding: 16px;
  min-height: 60px;
}

.dynamic-footer {
  background: #e9ecef;
  padding: 12px 16px;
  border-top: 1px solid #dee2e6;
  border-radius: 0 0 6px 6px;
}

.dynamic-sidebar {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: #f8f9fa;
  border-left: 2px solid #6f42c1;
  padding: 8px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
  max-width: 120px;
}
</style>
