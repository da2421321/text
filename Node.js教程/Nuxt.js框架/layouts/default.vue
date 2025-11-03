<template>
  <div class="layout">
    <header class="header">
      <div class="container">
        <nav class="navbar">
          <NuxtLink to="/" class="logo">
            <span class="logo-icon">🚀</span>
            <span class="logo-text">Nuxt.js 教程</span>
          </NuxtLink>
          
          <div class="nav-menu">
            <NuxtLink to="/" class="nav-link" active-class="active">首页</NuxtLink>
            <NuxtLink to="/getting-started" class="nav-link" active-class="active">入门指南</NuxtLink>
            <NuxtLink to="/examples" class="nav-link" active-class="active">示例项目</NuxtLink>
          </div>
          
          <button class="menu-toggle" @click="toggleMenu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>

    <main class="main">
      <slot />
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>Nuxt.js 教程</h3>
            <p>从入门到精通的完整学习指南</p>
          </div>
          
          <div class="footer-section">
            <h4>资源链接</h4>
            <ul>
              <li><a href="https://nuxt.com/docs" target="_blank">官方文档</a></li>
              <li><a href="https://github.com/nuxt/examples" target="_blank">示例项目</a></li>
              <li><a href="https://nuxt.com/modules" target="_blank">模块市场</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>社区</h4>
            <ul>
              <li><a href="https://github.com/nuxt/nuxt" target="_blank">GitHub</a></li>
              <li><a href="https://twitter.com/nuxt_js" target="_blank">Twitter</a></li>
              <li><a href="https://discord.nuxtjs.org/" target="_blank">Discord</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 Nuxt.js 教程. 基于 MIT License.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// 监听路由变化关闭菜单
const route = useRoute()
watch(route, () => {
  isMenuOpen.value = false
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #00dc82;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #00dc82;
}

.nav-link.active {
  color: #00dc82;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #00dc82;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.menu-toggle span {
  width: 25px;
  height: 3px;
  background: #333;
  margin: 3px 0;
  transition: 0.3s;
}

.main {
  flex: 1;
}

.footer {
  background: #2d3748;
  color: #e2e8f0;
  padding: 2rem 0 1rem;
  margin-top: 3rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  color: #00dc82;
  margin-top: 0;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #00dc82;
}

.footer-bottom {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #4a5568;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .menu-toggle {
    display: flex;
  }
  
  .container {
    padding: 0 0.5rem;
  }
}
</style>