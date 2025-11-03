<template>
  <div class="layout">
    <Header class="header"></Header>
    <div class="content">
      <router-view></router-view>
    </div>
    <Footer class="footer"></Footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Header from "./header/header.vue";
import Footer from "./footer/footer.vue";
</script>

<style lang="less">
html,
body,

.layout {
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: rgb(247, 247, 247);
  .header {
    width: 100%;
    height: 60px;
    flex-shrink: 0;
  }
  .content {
    flex: 1;
    overflow-y: auto;
    background-repeat: no-repeat;
  }
  .footer {
    width: 100%;
    flex-shrink: 0;
  }
}
</style>