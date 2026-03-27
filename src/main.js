import '@/styles/index.less'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/base.css'
import router from './router'
import store from './store'
const app = createApp(App)
app.use(ElementPlus);
app.use(Antd);
app.use(router)
app.use(store)
app.mount('#app')