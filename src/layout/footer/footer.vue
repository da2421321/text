<template>
  <div class="footer">
    <el-button type="primary" @click="handleClick">登录</el-button>
    <div style="display: flex;flex-direction: column;"><img style="width: 20px;height: 20px" src="@/assets/images/index.png" alt="">朋友圈</div>
    <div>我的</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const handleClick = () => {
  router.push({
    path: "/login",
  });
};
</script>

<style>
.footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>