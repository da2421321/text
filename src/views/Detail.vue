<template>
  <div class="detail">
    <NavBar title="商品详情" />
    
    <van-swipe class="detail-swipe" @change="onSwipeChange">
      <van-swipe-item v-for="image in images" :key="image">
        <img :src="image" @click="previewImage(image)" />
      </van-swipe-item>
    </van-swipe>
    
    <div class="product-info">
      <div class="price">
        <span class="current">¥{{ product.price }}</span>
        <span class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
      </div>
      <div class="title">{{ product.title }}</div>
      <div class="desc">{{ product.desc }}</div>
    </div>
    
    <van-cell-group>
      <van-cell title="商品参数" is-link />
      <van-cell title="配送方式" value="快递包邮" />
    </van-cell-group>
    
    <div class="detail-footer">
      <van-button round plain type="primary" @click="addToCart">
        <van-icon name="shopping-cart-o" /> 加入购物车
      </van-button>
      <van-button round type="danger" @click="buyNow">立即购买</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
const productId = route.params.id

const images = ref([
  'https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg'
])

const product = ref({
  id: 1,
  title: '苹果 iPhone 14 Pro',
  price: '7999',
  originalPrice: '8999',
  desc: 'A16 仿生芯片，4800 万像素主摄，灵动岛设计'
})

const currentImageIndex = ref(0)

const onSwipeChange = (index) => {
  currentImageIndex.value = index
}

const previewImage = (image) => {
  if (window.wx) {
    window.wx.previewImage({
      current: image,
      urls: images.value
    })
  } else {
    alert(`图片预览: ${image}`)
  }
}

const addToCart = () => {
  alert('已加入购物车')
}

const buyNow = () => {
  alert('立即购买')
}

onMounted(() => {
  // 模拟从路由获取商品ID
  console.log('商品ID:', productId)
  
  // 模拟微信分享
  if (window.wx) {
    window.wx.ready(() => {
      window.wx.updateAppMessageShareData({
        title: product.value.title,
        desc: product.value.desc,
        link: window.location.href,
        imgUrl: images.value[0]
      })
    })
  }
})
</script>

<style scoped>
.detail {
  padding-bottom: 70px;
}

.detail-swipe {
  height: 375px;
}

.detail-swipe img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 15px;
}

.price {
  margin-bottom: 8px;
}

.price .current {
  font-size: 24px;
  color: #f44;
  font-weight: bold;
}

.price .original {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.title {
  font-size: 16px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.desc {
  font-size: 14px;
  color: #666;
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 10px;
  background: #fff;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
}

.detail-footer .van-button {
  flex: 1;
  margin: 0 5px;
}
</style>