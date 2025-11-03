
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import User from '../views/User.vue'
import index from '../views/index.vue'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: Detail,
    meta: { title: '商品详情' }
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: { title: '个人中心' }
  },
  {
    path: '/index',
    name: 'index',
    component: index,
    meta: { title: '进度条' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router

// import { createRouter, createWebHistory } from 'vue-router';
// const childRoutes = [
//   {
//     path: '/',
//     name: 'indexs',
//     meta: {
//       title: '进度条'
//     },
//     component: () => import('@/views/index.vue')
//   },
//   {
//     path: '/login',
//     name: 'login',
//     meta: {
//       title: '登录'
//     },
//     component: () => import('@/views/login/login.vue')
//   }
// ];
// const routes = [
//   {
//     path: '/',
//     name: 'layout',
//     component: () => import('@/layout/index.vue'),
//     children: childRoutes
//   }
// ]
// const router = createRouter({
//   history: createWebHistory(),
//   routes
// });


// // 检查Token是否有效
// const checkTokenValid = (token) => {
//   try {
//     if (!token) return false

//     // 解码Token获取过期时间
//     const decoded = jwt_decode(token)
//     const currentTime = Date.now() / 1000

//     // 检查是否过期 (exp是JWT标准中的过期时间字段)
//     if (decoded.exp < currentTime) {
//       console.warn('Token已过期')
//       return false
//     }

//     return true
//   } catch (e) {
//     console.error('Token解析失败:', e)
//     return false
//   }
// }

// // router.beforeEach(async (to, from, next) => {
// //   // 设置页面标题
// //   if (to.meta.title) {
// //     document.title = to.meta.title
// //   }
// //   // 不需要认证的路由直接放行
// //   if (to.meta.noAuth) {
// //     return next()
// //   }
// //   // 获取Token
// //   const token = localStorage.getItem('token')
// //   // 检查Token有效性
// //   const isTokenValid = checkTokenValid(token)
// //   if (!isTokenValid) {
// //     // Token无效的处理
// //     localStorage.removeItem('token') // 清除无效Token
// //     if (to.name !== 'login') {
// //       // 添加redirect参数便于登录后跳转回原页面
// //       return next({
// //         name: 'login',
// //         query: { redirect: to.fullPath }
// //       })
// //     }
// //   }
// //   // Token有效的正常放行
// //   next()
// // })
// export default router;
