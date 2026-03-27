# 03 - Widget 基础

> Flutter 的核心：一切皆 Widget。类比 Vue 的一切皆组件。

---

## 1. Widget 是什么？

Flutter 中，**Widget 就是 UI 的描述**，类似 Vue 的组件。但有一个关键区别：

- Vue 组件：有状态，可以修改自身
- Flutter Widget：**不可变（Immutable）**，状态变化时会重建新的 Widget

```
Vue 思维：组件 → 修改数据 → 组件更新
Flutter 思维：Widget → 状态变化 → 重建新 Widget → 渲染
```

---

## 2. StatelessWidget vs StatefulWidget

### StatelessWidget（无状态组件）

类比 Vue 的纯展示组件（没有 ref/reactive 的组件）：

```dart
// Flutter
class MyButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const MyButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

// 使用
MyButton(
  label: '点击我',
  onPressed: () => print('clicked'),
)
```

```vue
<!-- Vue3 等价 -->
<template>
  <button @click="onPressed">{{ label }}</button>
</template>
<script setup>
defineProps(['label', 'onPressed'])
</script>
```

### StatefulWidget（有状态组件）

类比 Vue 的有 ref/reactive 数据的组件：

```dart
// Flutter
class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;  // 类比 Vue 的 ref(0)

  void _increment() {
    setState(() {   // 类比 Vue 的响应式自动更新
      _count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: $_count'),
        ElevatedButton(
          onPressed: _increment,
          child: const Text('+1'),
        ),
      ],
    );
  }
}
```

```vue
<!-- Vue3 等价 -->
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

---

## 3. 生命周期

### StatelessWidget 生命周期

```dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 每次重建都会调用，类比 Vue 的 render
    return Text('Hello');
  }
}
```

### StatefulWidget 生命周期

```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {

  @override
  void initState() {
    super.initState();
    // 组件初始化，只调用一次
    // 类比 Vue 的 onMounted（但在 build 之前）
    // 适合：初始化数据、启动定时器、订阅事件
    print('initState - 类比 onMounted');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 依赖（InheritedWidget）变化时调用
    // 类比 Vue 的 watchEffect（监听注入的数据）
  }

  @override
  void didUpdateWidget(MyWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 父组件重建导致当前组件 props 变化时调用
    // 类比 Vue 的 watch props
  }

  @override
  void dispose() {
    // 组件销毁，类比 Vue 的 onUnmounted
    // 必须在这里：取消定时器、关闭流、释放控制器
    print('dispose - 类比 onUnmounted');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 每次 setState 都会调用
    // 类比 Vue 的模板重新渲染
    return Text('Hello');
  }
}
```

### 生命周期对比表

| Vue3 | Flutter | 说明 |
|------|---------|------|
| `setup()` | `createState()` | 初始化 |
| `onMounted` | `initState()` | 挂载后 |
| `onUpdated` | `didUpdateWidget()` | 更新后 |
| `onUnmounted` | `dispose()` | 销毁 |
| `watchEffect` | `didChangeDependencies()` | 依赖变化 |
| `template render` | `build()` | 渲染 |

---

## 4. 常用基础 Widget

### Text（文本）

```dart
// 基本文本
Text('Hello Flutter')

// 带样式
Text(
  'Hello Flutter',
  style: TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.blue,
    letterSpacing: 1.5,
    decoration: TextDecoration.underline,
  ),
  textAlign: TextAlign.center,
  maxLines: 2,
  overflow: TextOverflow.ellipsis,  // 超出省略号
)

// 富文本（类比 HTML 的 <span> 混排）
RichText(
  text: TextSpan(
    text: '普通文字 ',
    style: TextStyle(color: Colors.black),
    children: [
      TextSpan(
        text: '红色文字',
        style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
      ),
      TextSpan(text: ' 继续普通文字'),
    ],
  ),
)
```

### Image（图片）

```dart
// 网络图片（类比 <img src="http://...">）
Image.network(
  'https://example.com/image.jpg',
  width: 200,
  height: 150,
  fit: BoxFit.cover,  // 类比 CSS object-fit: cover
)

// 本地资源图片（需在 pubspec.yaml 中声明）
Image.asset(
  'assets/images/logo.png',
  width: 100,
)

// 带占位符和错误处理
Image.network(
  url,
  loadingBuilder: (context, child, progress) {
    if (progress == null) return child;
    return CircularProgressIndicator();  // 加载中
  },
  errorBuilder: (context, error, stackTrace) {
    return Icon(Icons.error);  // 加载失败
  },
)
```

### Icon（图标）

```dart
// Material 图标
Icon(Icons.home)
Icon(Icons.favorite, color: Colors.red, size: 32)

// 常用图标
Icons.home          // 首页
Icons.search        // 搜索
Icons.person        // 用户
Icons.settings      // 设置
Icons.arrow_back    // 返回
Icons.add           // 添加
Icons.delete        // 删除
Icons.edit          // 编辑
Icons.share         // 分享
Icons.favorite      // 收藏
```

### Button（按钮）

```dart
// 填充按钮（主要操作）
ElevatedButton(
  onPressed: () => print('clicked'),
  child: Text('确认'),
)

// 文字按钮（次要操作）
TextButton(
  onPressed: () {},
  child: Text('取消'),
)

// 边框按钮
OutlinedButton(
  onPressed: () {},
  child: Text('边框按钮'),
)

// 图标按钮
IconButton(
  icon: Icon(Icons.favorite),
  onPressed: () {},
)

// 带图标的按钮
ElevatedButton.icon(
  icon: Icon(Icons.send),
  label: Text('发送'),
  onPressed: () {},
)

// 自定义样式
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.red,
    foregroundColor: Colors.white,
    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),
  onPressed: () {},
  child: Text('自定义按钮'),
)
```

### TextField（输入框）

```dart
// 基本输入框（类比 <input>）
TextField(
  decoration: InputDecoration(
    labelText: '用户名',
    hintText: '请输入用户名',
    prefixIcon: Icon(Icons.person),
    border: OutlineInputBorder(),
  ),
  onChanged: (value) => print(value),
)

// 使用 Controller 获取值（类比 Vue 的 v-model）
class LoginForm extends StatefulWidget {
  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  // TextEditingController 类比 Vue 的 ref('')
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    // 必须释放 Controller！
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _usernameController,
          decoration: InputDecoration(labelText: '用户名'),
        ),
        TextField(
          controller: _passwordController,
          obscureText: true,  // 密码模式
          decoration: InputDecoration(labelText: '密码'),
        ),
        ElevatedButton(
          onPressed: () {
            print('用户名: ${_usernameController.text}');
            print('密码: ${_passwordController.text}');
          },
          child: Text('登录'),
        ),
      ],
    );
  }
}
```

---

## 5. 容器 Widget

### Container（万能容器）

类比 CSS 的 `<div>` + 内联样式：

```dart
Container(
  width: 200,
  height: 100,
  margin: EdgeInsets.all(16),           // 外边距
  padding: EdgeInsets.symmetric(        // 内边距
    horizontal: 16,
    vertical: 8,
  ),
  decoration: BoxDecoration(
    color: Colors.blue,                 // 背景色
    borderRadius: BorderRadius.circular(8),  // 圆角
    border: Border.all(                 // 边框
      color: Colors.black,
      width: 1,
    ),
    boxShadow: [                        // 阴影
      BoxShadow(
        color: Colors.grey.withOpacity(0.5),
        blurRadius: 8,
        offset: Offset(0, 4),
      ),
    ],
    gradient: LinearGradient(           // 渐变
      colors: [Colors.blue, Colors.purple],
    ),
  ),
  child: Text('Hello'),
)
```

### SizedBox（尺寸盒子）

```dart
// 固定尺寸
SizedBox(width: 100, height: 50, child: Text('hello'))

// 常用作间距（类比 CSS margin）
SizedBox(height: 16)  // 垂直间距
SizedBox(width: 8)    // 水平间距

// 撑满父容器
SizedBox.expand(child: Text('撑满'))
```

### Padding（内边距）

```dart
Padding(
  padding: EdgeInsets.all(16),
  child: Text('有内边距的文字'),
)

// EdgeInsets 用法
EdgeInsets.all(16)                    // 四周 16
EdgeInsets.symmetric(horizontal: 16, vertical: 8)  // 水平/垂直
EdgeInsets.only(left: 16, top: 8)    // 单独设置
EdgeInsets.fromLTRB(16, 8, 16, 8)   // 左上右下
```

---

## 6. 组件通信

### 父传子（Props）

```dart
// 子组件定义 props（通过构造函数参数）
class UserCard extends StatelessWidget {
  final String name;
  final int age;
  final String? avatar;
  final VoidCallback? onTap;

  const UserCard({
    super.key,
    required this.name,
    required this.age,
    this.avatar,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: ListTile(
          leading: avatar != null
              ? Image.network(avatar!)
              : Icon(Icons.person),
          title: Text(name),
          subtitle: Text('$age 岁'),
        ),
      ),
    );
  }
}

// 父组件使用
UserCard(
  name: 'Alice',
  age: 25,
  avatar: 'https://example.com/avatar.jpg',
  onTap: () => print('点击了用户卡片'),
)
```

### 子传父（Emit）

Flutter 没有 emit，通过回调函数实现：

```dart
// 子组件
class SearchBar extends StatelessWidget {
  final ValueChanged<String> onSearch;  // 类比 Vue 的 emit('search', value)

  const SearchBar({super.key, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return TextField(
      onSubmitted: onSearch,  // 用户提交时调用回调
      decoration: InputDecoration(
        hintText: '搜索...',
        suffixIcon: Icon(Icons.search),
      ),
    );
  }
}

// 父组件
SearchBar(
  onSearch: (keyword) {
    print('搜索关键词: $keyword');
    // 处理搜索逻辑
  },
)
```

```vue
<!-- Vue3 等价 -->
<!-- 子组件 -->
<template>
  <input @keyup.enter="$emit('search', $event.target.value)" />
</template>
<script setup>
defineEmits(['search'])
</script>

<!-- 父组件 -->
<SearchBar @search="keyword => console.log(keyword)" />
```

---

## 7. InheritedWidget（跨层级传递）

类比 Vue 的 `provide/inject`：

```dart
// 定义（类比 provide）
class ThemeData extends InheritedWidget {
  final Color primaryColor;

  const ThemeData({
    super.key,
    required this.primaryColor,
    required super.child,
  });

  // 获取最近的 ThemeData（类比 inject）
  static ThemeData of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ThemeData>()!;
  }

  @override
  bool updateShouldNotify(ThemeData oldWidget) {
    return primaryColor != oldWidget.primaryColor;
  }
}

// 在根部提供
ThemeData(
  primaryColor: Colors.blue,
  child: MyApp(),
)

// 在任意子组件中获取
class MyButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = ThemeData.of(context);  // 类比 inject
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: theme.primaryColor,
      ),
      onPressed: () {},
      child: Text('按钮'),
    );
  }
}
```

> 实际开发中，通常用 Provider 包来代替手写 InheritedWidget，见第 05 章。

---

## 8. Key 的作用

类比 Vue 列表渲染中的 `:key`：

```dart
// 列表中必须使用 key，帮助 Flutter 识别 Widget
ListView(
  children: items.map((item) =>
    ListTile(
      key: ValueKey(item.id),  // 类比 Vue 的 :key="item.id"
      title: Text(item.name),
    )
  ).toList(),
)

// Key 的类型
ValueKey('unique_string')   // 用值作为 key
ObjectKey(someObject)       // 用对象作为 key
UniqueKey()                 // 每次都不同（慎用）
GlobalKey()                 // 全局唯一，可访问 State
```

---

## 9. 小结

| 概念 | Vue3 | Flutter |
|------|------|---------|
| 基础单元 | 组件 | Widget |
| 无状态 | 纯展示组件 | StatelessWidget |
| 有状态 | `<script setup>` + ref | StatefulWidget + State |
| 更新 UI | 响应式自动 | `setState()` |
| Props | `defineProps` | 构造函数参数 |
| Emit | `defineEmits` | 回调函数参数 |
| Provide/Inject | `provide/inject` | InheritedWidget / Provider |
| 列表 key | `:key="item.id"` | `ValueKey(item.id)` |
| 销毁清理 | `onUnmounted` | `dispose()` |

---

**上一章：** [02 - Dart 基础语法](./02-Dart基础语法.md)
**下一章：** [04 - 布局与样式](./04-布局与样式.md)
