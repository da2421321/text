import { createApp } from 'vue'
import App from './App.vue'
// import './assets/main.css'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import '@/styles/index.less';
const app = createApp(App)
app.use(ElementPlus);
app.use(Antd);
app.use(router)
app.use(store)
app.mount('#app')