<template>
  <div class="container">
    <nav class="breadcrumb">
      <NuxtLink to="/">首页</NuxtLink>
      <span> / 入门指南</span>
    </nav>

    <header class="header">
      <h1>🏁 入门指南</h1>
      <p>快速开始你的Nuxt.js学习之旅</p>
    </header>

    <main class="content">
      <section class="section">
        <h2>🎯 学习目标</h2>
        <div class="goals">
          <div class="goal-card">
            <h3>1. 环境搭建</h3>
            <p>安装Node.js和创建第一个Nuxt.js项目</p>
          </div>
          <div class="goal-card">
            <h3>2. 项目结构</h3>
            <p>理解Nuxt.js的目录结构和文件约定</p>
          </div>
          <div class="goal-card">
            <h3>3. 基础概念</h3>
            <p>掌握页面、组件、路由等核心概念</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📋 安装步骤</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>安装Node.js</h3>
              <p>确保Node.js版本 >= 14.18.0</p>
              <pre><code class="bash">node --version
npm --version</code></pre>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>创建项目</h3>
              <p>使用Nuxi CLI创建新项目</p>
              <pre><code class="bash"># 创建新项目
npx nuxi@latest init my-nuxt-app

# 进入项目目录
cd my-nuxt-app</code></pre>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>安装依赖</h3>
              <p>安装项目所需依赖</p>
              <pre><code class="bash"># 安装依赖
npm install

# 或使用yarn
yarn install</code></pre>
            </div>
          </div>

          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>启动开发服务器</h3>
              <p>启动开发环境并查看效果</p>
              <pre><code class="bash"># 启动开发服务器
npm run dev

# 访问 http://localhost:3000</code></pre>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>📁 项目结构</h2>
        <p>Nuxt.js采用基于文件系统的约定路由，以下是标准项目结构：</p>
        
        <div class="file-tree">
          <pre><code class="directory">my-nuxt-app/
├── .nuxt/                 # Nuxt自动生成
├── assets/                # 静态资源
│   ├── css/
│   └── images/
├── components/            # Vue组件
├── composables/           # 组合式函数
├── layouts/               # 布局组件
├── middleware/            # 中间件
├── pages/                 # 页面组件
│   ├── index.vue          # 首页 /
│   └── about.vue          # 关于页面 /about
├── plugins/               # 插件
├── public/                # 静态文件
├── server/                # 服务端API
├── app.vue                # 根组件
├── nuxt.config.ts         # 配置文件
└── package.json           # 项目配置</code></pre>
        </div>
      </section>

      <section class="section">
        <h2>⚡ 第一个页面</h2>
        <p>创建你的第一个Nuxt.js页面：</p>
        
        <div class="code-example">
          <h3>pages/index.vue</h3>
          <pre><code class="vue">&lt;template&gt;
  &lt;div class="welcome"&gt;
    &lt;h1&gt;🎉 欢迎使用Nuxt.js!&lt;/h1&gt;
    &lt;p&gt;这是你的第一个Nuxt.js页面&lt;/p&gt;
    &lt;NuxtLink to="/about"&gt;关于我们&lt;/NuxtLink&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
// 页面级组件逻辑
const title = '欢迎页面'

// 设置页面元数据
useHead({
  title: '首页 - Nuxt.js教程'
})
&lt;/script&gt;

&lt;style scoped&gt;
.welcome {
  text-align: center;
  padding: 2rem;
}

.welcome h1 {
  color: #00dc82;
  margin-bottom: 1rem;
}

.welcome a {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #00dc82;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
&lt;/style&gt;</code></pre>
        </div>
      </section>

      <div class="navigation">
        <NuxtLink to="/examples" class="btn btn-primary">
          下一章: 示例项目
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup>
// 设置页面元数据
useHead({
  title: 'Nuxt.js 入门指南',
  meta: [
    { name: 'description', content: 'Nuxt.js入门教程，包含环境搭建、项目结构、第一个页面等内容' }
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

.goals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.goal-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.goal-card h3 {
  color: #00dc82;
  margin-bottom: 0.5rem;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step {
  display: flex;
  gap: 1.5rem;
}

.step-number {
  background: #00dc82;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  margin-top: 0;
  color: #333;
}

pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1rem 0;
}

.directory {
  color: #a0aec0;
}

.file-tree {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.code-example {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.code-example h3 {
  margin-top: 0;
  color: #00dc82;
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: #00dc82;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #00c472;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 220, 130, 0.3);
}

.navigation {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .step {
    flex-direction: column;
  }
  
  .goals {
    grid-template-columns: 1fr;
  }
}
</style>