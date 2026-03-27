# Flutter 教程

> 专为有 Vue3 / UniApp 基础的开发者设计，通过类比加速学习。

---

## 学习路径

```
Vue3/UniApp 开发者
        ↓
  Dart 语法（1-2天）
        ↓
  Widget 基础（2-3天）
        ↓
  布局 + 状态管理（3-5天）
        ↓
  路由 + 网络请求（2-3天）
        ↓
  实战项目（1-2周）
```

---

## 目录

### 基础篇

| 章节 | 内容 | 类比 Vue/UniApp |
|------|------|----------------|
| [01 - 简介与环境搭建](./基础篇/01-简介与环境搭建.md) | Flutter 是什么、安装配置 | 类比 Vue CLI 环境搭建 |
| [02 - Dart 基础语法](./基础篇/02-Dart基础语法.md) | 变量、函数、类、异步 | 类比 TypeScript |
| [03 - Widget 基础](./基础篇/03-Widget基础.md) | StatelessWidget、StatefulWidget、生命周期 | 类比 Vue 组件 |
| [04 - 布局与样式](./基础篇/04-布局与样式.md) | Row、Column、Stack、Container | 类比 CSS Flexbox |
| [05 - 状态管理](./基础篇/05-状态管理入门.md) | setState、Provider、Riverpod | 类比 Pinia |

### 进阶篇

| 章节 | 内容 | 类比 Vue/UniApp |
|------|------|----------------|
| [06 - 路由与导航](./进阶篇/06-路由与导航.md) | Navigator、GoRouter、弹窗 | 类比 Vue Router |
| [07 - 网络请求](./进阶篇/07-网络请求与数据处理.md) | Dio、数据模型、拦截器 | 类比 axios |
| [08 - 常用组件与 UI](./进阶篇/08-常用组件与UI.md) | 表单、列表、动画、手势 | 类比 UniApp 组件 |
| [09 - 本地存储与原生能力](./进阶篇/09-本地存储与原生能力.md) | 存储、定位、相机、权限 | 类比 uni.* API |

### 实战项目

| 项目 | 技术点 |
|------|--------|
| [电商 App](./实战项目/README.md) | Provider + GoRouter + Dio + 完整项目结构 |

---

## 核心概念速查

### Vue3 → Flutter 对照表

```
Vue3                    Flutter
─────────────────────────────────────────────────
<template>          →   build() 方法
<script setup>      →   StatefulWidget + State
ref(0)              →   int _count = 0; + setState
computed            →   getter 方法
watch               →   didUpdateWidget / addListener
v-if                →   if (condition) widget : other
v-for               →   .map((item) => Widget).toList()
v-model             →   TextEditingController
@click              →   onTap / onPressed
:class              →   条件 style
defineProps         →   构造函数参数
defineEmits         →   回调函数参数
provide/inject      →   Provider / InheritedWidget
onMounted           →   initState()
onUnmounted         →   dispose()
<router-view>       →   GoRouter ShellRoute child
router.push()       →   context.go() / context.push()
useStore()          →   context.watch<Store>()
store.action()      →   context.read<Store>().method()
```

### UniApp → Flutter 对照表

```
UniApp                  Flutter
─────────────────────────────────────────────────
<view>              →   Container / Column / Row
<text>              →   Text
<image>             →   Image / CachedNetworkImage
<button>            →   ElevatedButton / TextButton
<input>             →   TextField
<scroll-view>       →   ListView / SingleChildScrollView
<swiper>            →   PageView
uni.setStorage      →   SharedPreferences
uni.getLocation     →   geolocator 包
uni.chooseImage     →   image_picker 包
uni.showToast       →   SnackBar / fluttertoast
uni.showModal       →   showDialog
uni.showActionSheet →   showModalBottomSheet
uni.authorize       →   permission_handler 包
uni.getSystemInfo   →   device_info_plus 包
onPullDownRefresh   →   RefreshIndicator
onReachBottom       →   ScrollController 监听
```

---

## 推荐依赖包

```yaml
dependencies:
  # 状态管理
  provider: ^6.1.0
  flutter_riverpod: ^2.4.0

  # 路由
  go_router: ^13.0.0

  # 网络请求
  dio: ^5.4.0

  # JSON 序列化
  json_annotation: ^4.8.0

  # 本地存储
  shared_preferences: ^2.2.0

  # 图片
  cached_network_image: ^3.3.0
  image_picker: ^1.0.0

  # 工具
  permission_handler: ^11.0.0
  connectivity_plus: ^5.0.0
  device_info_plus: ^9.1.0
  share_plus: ^7.2.0

  # UI 增强
  shimmer: ^3.0.0
  carousel_slider: ^4.2.0
  fluttertoast: ^8.2.0

dev_dependencies:
  json_serializable: ^6.7.0
  build_runner: ^2.4.0
```

---

## 学习建议

1. **先跑起来再理解**：先把 Hello World 跑起来，再深入理解原理
2. **类比学习**：遇到新概念先想"Vue 里对应什么"
3. **多看官方文档**：[flutter.dev](https://flutter.dev) 文档质量很高
4. **pub.dev 找包**：[pub.dev](https://pub.dev) 是 Flutter 的 npm
5. **善用 DevTools**：Flutter DevTools 类比 Vue DevTools，调试利器
6. **热重载**：运行时按 `r` 热重载，`R` 热重启，开发效率很高

---

## 常见问题

**Q: Flutter 和 UniApp 怎么选？**
- 国内小程序 + H5 + App：UniApp
- 高性能 App（无小程序需求）：Flutter
- 两者都学，互补使用

**Q: Dart 难学吗？**
- 有 JS/TS 基础，1-2 天能掌握基础语法
- 类型系统类似 TypeScript，面向对象类似 Java

**Q: Flutter 性能真的好吗？**
- 自绘引擎，不依赖原生组件，60/120fps 流畅
- 比 UniApp 的 WebView 渲染性能好很多

**Q: 热更新怎么办？**
- Flutter 不支持代码热更新（苹果政策限制）
- 可以用 Flutter + 动态化方案（如 Fair、MXFlutter）
- 或者接受发版更新（Android 可以绕过）
