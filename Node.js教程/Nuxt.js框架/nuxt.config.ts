// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 应用配置
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Nuxt.js 教程',
      meta: [
        { name: 'description', content: 'Node.js教程中的Nuxt.js框架学习' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // CSS配置
  css: [
    '~/assets/css/main.css'
  ],

  // 构建配置
  build: {
    transpile: []
  },

  // 开发配置
  dev: {},

  // 运行时配置
  runtimeConfig: {
    // 服务端可访问的私有配置
    apiSecret: '',
    // 客户端和服务端都可访问的公有配置
    public: {
      apiBase: '/api'
    }
  },

  // 模块配置
  modules: [
    // '@nuxtjs/tailwindcss',
    // '@nuxtjs/sitemap',
    // '@nuxtjs/robots'
  ],

  // 路由配置
  routeRules: {
    // 静态渲染
    '/': { prerender: true },
    // 服务端渲染
    '/products/**': { ssr: true },
    // 客户端渲染
    '/admin/**': { ssr: false }
  },

  // TypeScript配置
  typescript: {
    strict: true,
    shim: false
  },

  // 实验性功能
  experimental: {
    // 启用新的路由系统
    typedPages: true
  },

  // 开发工具
  devtools: {
    enabled: true
  },

  // 兼容性日期
  compatibilityDate: '2024-04-03'
})