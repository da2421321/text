<template>
  <div class="dynamic-menu">
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :unique-opened="true"
      mode="vertical"
      @select="handleMenuSelect"
    >
      <menu-item
        v-for="menu in menuList"
        :key="menu.id"
        :menu="menu"
      />
    </el-menu>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MenuItem from './MenuItem.vue'

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()

const menuList = ref([])

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

/**
 * 处理菜单选择
 */
const handleMenuSelect = (menuPath) => {
  router.push(menuPath)
}

/**
 * 获取菜单数据
 */
const getMenuData = async () => {
  try {
    // 从store或API获取菜单数据
    // 这里模拟菜单数据
    menuList.value = [
      {
        id: 1,
        name: '系统管理',
        path: '/system',
        icon: 'Setting',
        children: [
          {
            id: 11,
            name: '用户管理',
            path: '/system/user',
            icon: 'User'
          },
          {
            id: 12,
            name: '角色管理',
            path: '/system/role',
            icon: 'UserFilled'
          }
        ]
      },
      {
        id: 2,
        name: '商品管理',
        path: '/product',
        icon: 'Goods',
        children: [
          {
            id: 21,
            name: '商品列表',
            path: '/product/list',
            icon: 'List'
          },
          {
            id: 22,
            name: '分类管理',
            path: '/product/category',
            icon: 'Menu'
          }
        ]
      }
    ]
  } catch (error) {
    console.error('获取菜单数据失败:', error)
  }
}

onMounted(() => {
  getMenuData()
})
</script>

<style scoped>
.dynamic-menu {
  height: 100%;
}

.el-menu {
  border-right: none;
}
</style>
