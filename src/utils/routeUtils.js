/**
 * 根据菜单配置生成动态路由
 * @param {Array} menuData - 菜单数据
 * @returns {Array} - 路由配置数组
 */
export function generateRoutes(menuData) {
  const routes = []
  
  function processMenu(menus, parentPath = '') {
    menus.forEach(menu => {
      const route = {
        path: menu.path,
        name: menu.name,
        meta: {
          title: menu.name,
          icon: menu.icon,
          id: menu.id
        }
      }
      
      // 如果有组件配置，动态导入组件
      if (menu.component) {
        route.component = () => import(`@/views/${menu.component}.vue`)
      }
      
      // 如果有子菜单，递归处理
      if (menu.children && menu.children.length > 0) {
        route.children = []
        processMenu(menu.children, menu.path)
        
        // 为父级路由添加子路由
        menu.children.forEach(child => {
          const childRoute = {
            path: child.path,
            name: child.name,
            component: () => import(`@/views/${child.component}.vue`),
            meta: {
              title: child.name,
              parentId: menu.id,
              id: child.id
            }
          }
          route.children.push(childRoute)
        })
      }
      
      routes.push(route)
    })
  }
  
  processMenu(menuData)
  return routes
}

/**
 * 扁平化路由配置，用于权限控制
 * @param {Array} routes - 路由配置
 * @returns {Array} - 扁平化的路由数组
 */
export function flattenRoutes(routes) {
  const result = []
  
  function flatten(routeList) {
    routeList.forEach(route => {
      result.push({
        path: route.path,
        name: route.name,
        meta: route.meta
      })
      
      if (route.children && route.children.length > 0) {
        flatten(route.children)
      }
    })
  }
  
  flatten(routes)
  return result
}

/**
 * 根据用户权限过滤菜单
 * @param {Array} menuData - 完整菜单数据
 * @param {Array} userPermissions - 用户权限列表
 * @returns {Array} - 过滤后的菜单数据
 */
export function filterMenuByPermission(menuData, userPermissions) {
  return menuData.filter(menu => {
    // 检查当前菜单权限
    if (!userPermissions.includes(menu.id)) {
      return false
    }
    
    // 如果有子菜单，递归过滤
    if (menu.children && menu.children.length > 0) {
      menu.children = filterMenuByPermission(menu.children, userPermissions)
    }
    
    return true
  })
}
