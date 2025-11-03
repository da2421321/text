<template>
  <div class="container">
    <header class="header">
      <h1 class="title">🚀 Nuxt.js 教程</h1>
      <p class="subtitle">从入门到精通的完整学习指南</p>
    </header>

    <main class="main">
      <div class="features">
        <div class="feature-card">
          <h2>📚 基础篇</h2>
          <ul>
            <li>Nuxt.js 简介与安装</li>
            <li>项目结构解析</li>
            <li>页面与路由</li>
            <li>组件开发</li>
          </ul>
        </div>

        <div class="feature-card">
          <h2>🔧 进阶篇</h2>
          <ul>
            <li>数据获取与API</li>
            <li>状态管理</li>
            <li>中间件</li>
            <li>插件系统</li>
          </ul>
        </div>

        <div class="feature-card">
          <h2>🚀 高级篇</h2>
          <ul>
            <li>SEO优化</li>
            <li>性能优化</li>
            <li>服务端渲染</li>
            <li>静态站点生成</li>
          </ul>
        </div>

        <div class="feature-card">
          <h2>💼 实战篇</h2>
          <ul>
            <li>电商网站开发</li>
            <li>博客系统开发</li>
            <li>部署与运维</li>
            <li>最佳实践</li>
          </ul>
        </div>
      </div>

      <div class="cta-section">
        <NuxtLink to="/getting-started" class="btn btn-primary">
          开始学习
        </NuxtLink>
        <NuxtLink to="/examples" class="btn btn-secondary">
          查看示例
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
// 设置页面元数据
useHead({
  title: 'Nuxt.js 教程 - 首页',
  meta: [
    { name: 'description', content: '完整的Nuxt.js学习教程，从基础到实战项目' }
  ]
})

// 响应式数据
const features = ref([
  { id: 1, title: '基础篇', icon: '📚' },
  { id: 2, title: '进阶篇', icon: '🔧' },
  { id: 3, title: '高级篇', icon: '🚀' },
  { id: 4, title: '实战篇', icon: '💼' }
])
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: #00dc82;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h2 {
  color: #00dc82;
  margin-bottom: 1rem;
}

.feature-card ul {
  list-style-type: none;
  padding: 0;
}

.feature-card li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.feature-card li:last-child {
  border-bottom: none;
}

.cta-section {
  text-align: center;
  margin-top: 2rem;
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  margin: 0 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #00dc82;
  color: white;
}

.btn-primary:hover {
  background: #00c472;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 220, 130, 0.3);
}

.btn-secondary {
  background: #666;
  color: white;
}

.btn-secondary:hover {
  background: #555;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 102, 102, 0.3);
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
  
  .btn {
    display: block;
    margin: 1rem auto;
    width: 80%;
  }
}
</style>