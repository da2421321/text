<template>
  <div class="home">
  

    <van-search
      v-model="searchValue"
      placeholder="搜索商品"
      shape="round"
      readonly
      @click="$router.push('/search')"
    />

    <van-swipe class="banner" :autoplay="3000">
      <van-swipe-item v-for="item in banners" :key="item.id">
        <img :src="item.image" @click="handleBannerClick(item)" />
      </van-swipe-item>
    </van-swipe>

    <van-grid :column-num="4">
      <van-grid-item
        v-for="item in categories"
        :key="item.id"
        :icon="item.icon"
        :text="item.name"
      />
    </van-grid>

    <div class="section-title">热门商品</div>
    <div class="product-list">
      <van-card
        v-for="item in products"
        :key="item.id"
        :price="item.price"
        :title="item.title"
        :thumb="item.image"
        @click="$router.push(`/detail/${item.id}`)"
      />
    </div>

    <selectmodal v-model="visible" />
    <TabBar />
    <div class="tagger"></div>
  </div>
  <iframe src="http://localhost:9527/order/index"></iframe>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import NavBar from "@/components/NavBar.vue";
import TabBar from "@/components/TabBar.vue";

const searchValue = ref("");

const banners = ref([
  {
    id: 1,
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg",
    link: "/detail/1",
  },
  {
    id: 2,
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg",
    link: "/detail/2",
  },
]);

const categories = ref([
  { id: 1, name: "手机", icon: "phone-o" },
  { id: 2, name: "电脑", icon: "laptop-o" },
  { id: 3, name: "配件", icon: "gem-o" },
  { id: 4, name: "家电", icon: "tv-o" },
]);
const sort = computed(() => {
  categories.value.sort((a, b) => {
    return a.id - b.id;
  });
  console.log("排序", categories.value);
  return categories.value;
});

const products = ref([
  {
    id: 1,
    title: "苹果 iPhone 14 Pro",
    price: "7999",
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg",
  },
  {
    id: 2,
    title: "小米 13 Ultra",
    price: "5999",
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg",
  },
  {
    id: 3,
    title: "华为 Mate 50 Pro",
    price: "6799",
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg",
  },
  {
    id: 4,
    title: "荣耀 Magic5 Pro",
    price: "5199",
    image: "https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg",
  },
]);

const handleBannerClick = (item) => {
  window.location.href = item.link;
};
onMounted(() => {
  console.log("mounted", categories.value, sort.value);
});
</script>

<style scoped>
.tagger {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 50px solid red;
}
.home {
  padding-bottom: 50px;
}

.banner {
  height: 160px;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-title {
  padding: 15px 10px 5px;
  font-size: 16px;
  font-weight: bold;
}

.product-list {
  padding: 10px;
}
</style>