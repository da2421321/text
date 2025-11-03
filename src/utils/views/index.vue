<template>
  <a-input placeholder="请输入用户名" v-model="username" />
  <a-button type="primary" @click="join">加入</a-button>
</template>

<script setup>
import { ref } from 'vue';
const username = ref('');
const join = () => {
    socket.emit('join', username.value);
}
</script>

<style>
</style>