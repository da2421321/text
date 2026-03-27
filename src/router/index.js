import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import User from '../views/User.vue'
import Index from '../views/index.vue'
import SnakeGame from '../views/SnakeGame.vue'

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
    name: 'Index',
    component: Index,
    meta: { title: '进度条' }
  },
  {
    path: '/snake',
    name: 'SnakeGame',
    component: SnakeGame,
    meta: { title: 'Snake' }
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
