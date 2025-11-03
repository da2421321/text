<template>
 <div v-infinite-scroll="load">
    <div v-for="item in list" :key="item">{{ item }}</div>
 </div>
</template>

<script setup>
import { ref } from 'vue';
const  list = ref(0);
const load = () => {
  list.value++;
  console.log('load');
};
</script>

<style>
</style>