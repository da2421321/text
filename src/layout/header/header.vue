<template>
  <div class="header">
    <a-page-header
      :title="navTitle"
      :left-arrow="route.name !== 'index'"
      @click-left="router.back()"
      @click-right="router.push('/login')"
    >
      <template #right>
        <van-icon name="ellipsis" />
      </template>
    </a-page-header>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, watchEffect } from "vue";
const router = useRouter();
const route = useRoute();
const navTitle = ref("");

watchEffect(() => {
  navTitle.value = String(route.meta?.title || "");
});
</script>

<style lang="less" scoped>
.header {
  --van-nav-bar-icon-color: #181818;
  .van-nav-bar {
    background-color: #ededed;
  }
}
</style>
