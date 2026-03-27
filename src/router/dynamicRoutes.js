import { filterMenuByPermission, generateRoutes } from '@/utils/routeUtils'
import { createRouter, createWebHistory } from 'vue-router'

// 基础路由（不需要权限）
const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404.vue'),
    meta: { title: '页面不存在', noAuth: true }
  }
]

// 主布局路由
const layoutRoute = {
  path: '/',
  name: 'Layout',
  component: () => import('@/layout/index.vue'),
  redirect: '/dashboard',
  children: [
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '仪表盘' }
    }
  ]
}

let router = null

/**
 * 创建路由实例
 */
export function createAppRouter() {
  router = createRouter({
    history: createWebHistory(),
    routes: [...constantRoutes, layoutRoute],
    scrollBehavior: () => ({ y: 0 })
  })
  
  // 全局前置守卫
  router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = to.meta.title
    }
    
    // 不需要认证的路由直接放行
    if (to.meta.noAuth) {
      return next()
    }
    
    // 检查token
    const token = localStorage.getItem('token')
    if (!token) {
      return next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    }
    
    // 检查是否已加载动态路由
    const hasRoutes = router.hasRoute('UserManage') // 检查一个动态路由是否存在
    if (!hasRoutes) {
      try {
        await loadDynamicRoutes()
        // 重新导航到目标路由
        return next({ ...to, replace: true })
      } catch (error) {
        console.error('加载动态路由失败:', error)
        return next('/404')
      }
    }
    
    next()
  })
  
  return router
}

/**
 * 加载动态路由
 */
export async function loadDynamicRoutes() {
  try {
    // 从API获取用户菜单权限
    const menuData = await getUserMenus()
    const userPermissions = await getUserPermissions()
    
    // 根据权限过滤菜单
    const authorizedMenus = filterMenuByPermission(menuData, userPermissions)
    
    // 生成动态路由
    const dynamicRoutes = generateRoutes(authorizedMenus)
    
    // 将动态路由添加到布局路由的children中
    dynamicRoutes.forEach(route => {
      router.addRoute('Layout', route)
    })
    
    // 添加通配符路由，处理404
    router.addRoute({
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    })
    
    console.log('动态路由加载完成')
    
  } catch (error) {
    console.error('加载动态路由失败:', error)
    throw error
  }
}

/**
 * 模拟API：获取用户菜单数据
 */
async function getUserMenus() {
  // 实际项目中这里应该是API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: '系统管理',
          path: '/system',
          icon: 'setting',
          children: [
            {
              id: 11,
              name: '用户管理',
              path: '/system/user',
              component: 'system/UserManage'
            },
            {
              id: 12,
              name: '角色管理',
              path: '/system/role',
              component: 'system/RoleManage'
            }
          ]
        },
        {
          id: 2,
          name: '商品管理',
          path: '/product',
          icon: 'goods',
          children: [
            {
              id: 21,
              name: '商品列表',
              path: '/product/list',
              component: 'product/ProductList'
            },
            {
              id: 22,
              name: '分类管理',
              path: '/product/category',
              component: 'product/CategoryManage'
            }
          ]
        }
      ])
    }, 200)
  })
}

/**
 * 模拟API：获取用户权限
 */
async function getUserPermissions() {
  // 实际项目中这里应该是API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([1, 11, 12, 2, 21, 22]) // 用户拥有的菜单ID权限
    }, 100)
  })
}

/**
 * 重置路由
 */
export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: [...constantRoutes, layoutRoute]
  })
  router.matcher = newRouter.matcher
}

export default router
