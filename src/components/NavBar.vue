<template>
  <div class="navbar">
    <div class="navbar-left" @click="handleBack" v-if="showBack">
      <van-icon name="arrow-left" />
      <span>返回</span>
    </div>
    <div class="navbar-title">{{ title }}</div>
    <div class="navbar-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: String,
  showBack: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.navbar {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.navbar-left,
.navbar-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 12px;
}

.navbar-left {
  left: 0;
  display: flex;
  align-items: center;
}

.navbar-right {
  right: 0;
}

.navbar-title {
  font-size: 16px;
  font-weight: 500;
}
</style>