import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 创建 Pinia 实例
const pinia = createPinia();

// 使用持久化插件
pinia.use(piniaPluginPersistedstate);

// 导出 Pinia 实例
export default pinia;
export * from './user/index'