<template>
  <router-view />
</template>

<script setup>
import { useRouter } from "vue-router";
import router from "./router";

// 模拟微信环境
if (import.meta.env.DEV) {
  const script = document.createElement("script");
  script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
  document.body.appendChild(script);

  // 模拟微信SDK初始化
  setTimeout(() => {
    window.wx = {
      config: (config) => {
        console.log("微信配置:", config);
        setTimeout(() => {
          if (typeof config.success === "function") {
            config.success();
          }
        }, 500);
      },
      ready: (callback) => {
        console.log("微信SDK准备就绪");
        callback();
      },
      error: (callback) => {
        // 模拟错误
        // callback({ errMsg: 'config:fail' })
      },
      previewImage: (options) => {
        alert(`模拟微信图片预览: ${options.current}`);
      },
      updateAppMessageShareData: (options) => {
        console.log("设置分享信息:", options);
      },
    };
  }, 1000);
}
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
}
</style>