<template>
  <div class="named-card">
    <header class="card-header">
      <slot name="header">
        <h3>默认标题</h3>
      </slot>
    </header>
    
    <main class="card-body">
      <slot>
        <p>默认内容</p>
      </slot>
    </main>
    
    <footer class="card-footer">
      <slot name="footer">
        <button>默认按钮</button>
      </slot>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.named-card {
  border: 2px solid #28a745;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  background: #28a745;
  color: white;
  padding: 12px 16px;
}

.card-header h3 {
  margin: 0;
}

.card-body {
  padding: 16px;
  min-height: 80px;
}

.card-footer {
  background: #f8f9fa;
  padding: 12px 16px;
  border-top: 1px solid #dee2e6;
}

.card-footer button {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.card-footer button:hover {
  background: #218838;
}
</style>
