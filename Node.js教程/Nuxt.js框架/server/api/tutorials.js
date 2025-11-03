/**
 * 教程API端点
 * 提供Nuxt.js教程相关的数据
 */

// 模拟教程数据
const tutorials = [
  {
    id: 1,
    title: 'Nuxt.js 基础入门',
    description: '学习Nuxt.js的基本概念和核心功能',
    duration: 120,
    difficulty: 'beginner',
    sections: [
      { id: 'setup', title: '环境搭建', duration: 30 },
      { id: 'structure', title: '项目结构', duration: 20 },
      { id: 'pages', title: '页面和路由', duration: 40 },
      { id: 'components', title: '组件开发', duration: 30 }
    ]
  },
  {
    id: 2,
    title: 'Nuxt.js 数据获取',
    description: '掌握Nuxt.js中的数据获取方法',
    duration: 180,
    difficulty: 'intermediate',
    sections: [
      { id: 'async-data', title: 'useAsyncData', duration: 45 },
      { id: 'fetch', title: 'useFetch', duration: 45 },
      { id: 'server-api', title: '服务端API', duration: 50 },
      { id: 'error-handling', title: '错误处理', duration: 40 }
    ]
  },
  {
    id: 3,
    title: 'Nuxt.js 部署上线',
    description: '学习如何部署Nuxt.js应用',
    duration: 90,
    difficulty: 'intermediate',
    sections: [
      { id: 'ssr-deploy', title: 'SSR部署', duration: 30 },
      { id: 'ssg-deploy', title: 'SSG部署', duration: 30 },
      { id: 'docker', title: 'Docker部署', duration: 30 }
    ]
  }
]

// 获取所有教程
export default defineEventHandler((event) => {
  return {
    success: true,
    data: tutorials,
    total: tutorials.length
  }
})

// 根据ID获取特定教程
export const tutorial = defineEventHandler((event) => {
  const id = parseInt(event.context.params.id)
  const tutorial = tutorials.find(t => t.id === id)
  
  if (!tutorial) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tutorial not found'
    })
  }
  
  return {
    success: true,
    data: tutorial
  }
})