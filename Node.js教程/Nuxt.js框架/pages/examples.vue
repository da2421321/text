<template>
  <div class="container">
    <nav class="breadcrumb">
      <NuxtLink to="/">首页</NuxtLink>
      <span> / 示例项目</span>
    </nav>

    <header class="header">
      <h1>💡 示例项目</h1>
      <p>通过实际项目学习Nuxt.js核心概念</p>
    </header>

    <main class="content">
      <section class="section">
        <h2>🛍️ 电商网站示例</h2>
        <div class="example-card">
          <div class="example-content">
            <h3>功能特性</h3>
            <ul>
              <li>商品展示与分类</li>
              <li>商品搜索与筛选</li>
              <li>购物车管理</li>
              <li>用户登录注册</li>
              <li>订单管理系统</li>
              <li>支付集成</li>
            </ul>
            
            <h3>技术要点</h3>
            <div class="tech-tags">
              <span class="tag">SSR</span>
              <span class="tag">Composition API</span>
              <span class="tag">Pinia</span>
              <span class="tag">TailwindCSS</span>
              <span class="tag">RESTful API</span>
            </div>
          </div>
          
          <div class="example-code">
            <h4>商品列表页面示例</h4>
            <pre><code class="vue">&lt;script setup&gt;
const { data: products } = await useAsyncData(
  'products',
  () => $fetch('/api/products')
)

const searchQuery = ref('')

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(product => 
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;input v-model="searchQuery" placeholder="搜索商品..." /&gt;
    &lt;div class="product-grid"&gt;
      &lt;ProductCard 
        v-for="product in filteredProducts" 
        :key="product.id" 
        :product="product" 
      /&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📝 博客系统示例</h2>
        <div class="example-card">
          <div class="example-content">
            <h3>功能特性</h3>
            <ul>
              <li>文章发布与管理</li>
              <li>分类与标签系统</li>
              <li>文章搜索功能</li>
              <li>评论系统</li>
              <li>SEO优化</li>
              <li>Markdown支持</li>
            </ul>
            
            <h3>技术要点</h3>
            <div class="tech-tags">
              <span class="tag">SSG</span>
              <span class="tag">Markdown</span>
              <span class="tag">SEO</span>
              <span class="tag">Content模块</span>
              <span class="tag">静态部署</span>
            </div>
          </div>
          
          <div class="example-code">
            <h4>文章详情页面示例</h4>
            <pre><code class="vue">&lt;script setup&gt;
const route = useRoute()
const { data: article } = await useAsyncData(
  `article-${route.params.slug}`,
  () => queryContent('articles').where({ slug: route.params.slug }).findOne()
)

// 设置SEO
useHead({
  title: article.value.title,
  meta: [
    { name: 'description', content: article.value.description }
  ]
})
&lt;/script&gt;

&lt;template&gt;
  &lt;article class="article"&gt;
    &lt;h1&gt;{{ article.title }}&lt;/h1&gt;
    &lt;div class="meta"&gt;
      &lt;time&gt;{{ article.date }}&lt;/time&gt;
      &lt;span&gt;作者: {{ article.author }}&lt;/span&gt;
    &lt;/div&gt;
    &lt;div class="content"&gt;
      &lt;ContentRenderer :value="article" /&gt;
    &lt;/div&gt;
  &lt;/article&gt;
&lt;/template&gt;</code></pre>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📊 仪表板示例</h2>
        <div class="example-card">
          <div class="example-content">
            <h3>功能特性</h3>
            <ul>
              <li>数据可视化</li>
              <li>用户管理</li>
              <li>权限控制</li>
              <li>实时数据</li>
              <li>响应式设计</li>
              <li>国际化支持</li>
            </ul>
            
            <h3>技术要点</h3>
            <div class="tech-tags">
              <span class="tag">Admin</span>
              <span class="tag">Chart.js</span>
              <span class="tag">权限控制</span>
              <span class="tag">i18n</span>
              <span class="tag">WebSocket</span>
            </div>
          </div>
          
          <div class="example-code">
            <h4>数据图表组件示例</h4>
            <pre><code class="vue">&lt;script setup&gt;
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = {
  labels: ['一月', '二月', '三月', '四月', '五月'],
  datasets: [
    {
      label: '销售额',
      data: [12000, 19000, 15000, 18000, 22000],
      backgroundColor: '#00dc82'
    }
  ]
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
&lt;/script&gt;

&lt;template&gt;
  &lt;div class="chart-container"&gt;
    &lt;Bar
      :data="chartData"
      :options="chartOptions"
    /&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
          </div>
        </div>
      </section>

      <div class="navigation">
        <NuxtLink to="/getting-started" class="btn btn-secondary">
          上一章: 入门指南
        </NuxtLink>
        <NuxtLink to="/" class="btn btn-primary">
          返回首页
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
// 设置页面元数据
useHead({
  title: 'Nuxt.js 示例项目',
  meta: [
    { name: 'description', content: 'Nuxt.js示例项目，包含电商网站、博客系统、仪表板等实际应用' }
  ]
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.breadcrumb {
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #00dc82;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #00dc82;
  margin-bottom: 1rem;
}

.content {
  line-height: 1.6;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  color: #333;
  border-bottom: 2px solid #00dc82;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.example-card {
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.example-content {
  padding: 1.5rem;
}

.example-content h3 {
  color: #00dc82;
  margin-top: 0;
}

.example-content ul {
  padding-left: 1.5rem;
}

.example-content li {
  margin-bottom: 0.5rem;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  background: #00dc82;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.example-code {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1.5rem;
}

.example-code h4 {
  color: #00dc82;
  margin-top: 0;
}

pre {
  background: #1a202c;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1rem 0;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  margin: 0 0.5rem;
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

.navigation {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .btn {
    display: block;
    margin: 1rem auto;
    width: 80%;
  }
}
</style>