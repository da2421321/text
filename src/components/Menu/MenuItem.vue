<template>
  <!-- 有子菜单的情况 -->
  <el-sub-menu
    v-if="menu.children && menu.children.length > 0"
    :index="menu.path"
  >
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="menu.icon" />
      </el-icon>
      <span>{{ menu.name }}</span>
    </template>
    
    <menu-item
      v-for="child in menu.children"
      :key="child.id"
      :menu="child"
    />
  </el-sub-menu>
  
  <!-- 没有子菜单的情况 -->
  <el-menu-item
    v-else
    :index="menu.path"
  >
    <el-icon v-if="menu.icon">
      <component :is="menu.icon" />
    </el-icon>
    <span>{{ menu.name }}</span>
  </el-menu-item>
</template>

<script setup>
defineProps({
  menu: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.el-menu-item,
.el-sub-menu {
  user-select: none;
}
</style>
