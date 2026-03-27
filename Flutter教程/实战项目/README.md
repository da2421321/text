# 实战项目 - 电商 App

> 综合运用前面所有知识，构建一个完整的电商 App。

---

## 项目概述

**功能模块：**
- 首页（轮播图 + 商品列表）
- 商品详情
- 购物车
- 用户中心（登录/注册）
- 搜索

**技术栈：**
- 状态管理：Provider
- 路由：GoRouter
- 网络请求：Dio
- 本地存储：shared_preferences
- 图片缓存：cached_network_image

---

## 项目结构

```
lib/
├── main.dart                    # 入口
├── app.dart                     # App 根组件
├── router/
│   └── app_router.dart          # 路由配置
├── models/                      # 数据模型
│   ├── product.dart
│   ├── cart_item.dart
│   └── user.dart
├── services/                    # 服务层
│   ├── http_client.dart         # Dio 配置
│   ├── api_service.dart         # API 封装
│   └── storage_service.dart     # 本地存储
├── stores/                      # 状态管理
│   ├── user_store.dart
│   ├── cart_store.dart
│   └── product_store.dart
├── pages/                       # 页面
│   ├── home/
│   │   └── home_page.dart
│   ├── product/
│   │   └── product_detail_page.dart
│   ├── cart/
│   │   └── cart_page.dart
│   ├── auth/
│   │   ├── login_page.dart
│   │   └── register_page.dart
│   └── profile/
│       └── profile_page.dart
└── widgets/                     # 公共组件
    ├── product_card.dart
    ├── loading_widget.dart
    └── error_widget.dart
```

---

## 核心代码实现

### main.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/storage_service.dart';
import 'stores/user_store.dart';
import 'stores/cart_store.dart';
import 'stores/product_store.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserStore()..loadFromStorage()),
        ChangeNotifierProvider(create: (_) => CartStore()),
        ChangeNotifierProvider(create: (_) => ProductStore()),
      ],
      child: const MyApp(),
    ),
  );
}
```

### app.dart

```dart
import 'package:flutter/material.dart';
import 'router/app_router.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '电商 App',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
      ),
      routerConfig: appRouter,
    );
  }
}
```

### router/app_router.dart

```dart
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../stores/user_store.dart';
import '../pages/home/home_page.dart';
import '../pages/product/product_detail_page.dart';
import '../pages/cart/cart_page.dart';
import '../pages/auth/login_page.dart';
import '../pages/profile/profile_page.dart';

final appRouter = GoRouter(
  initialLocation: '/home',
  redirect: (context, state) {
    final userStore = context.read<UserStore>();
    final protectedRoutes = ['/cart', '/profile'];
    final isProtected = protectedRoutes.any(
      (route) => state.matchedLocation.startsWith(route),
    );

    if (isProtected && !userStore.isLoggedIn) {
      return '/login?redirect=${state.matchedLocation}';
    }
    return null;
  },
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainLayout(child: child),
      routes: [
        GoRoute(path: '/home', builder: (context, state) => const HomePage()),
        GoRoute(path: '/cart', builder: (context, state) => const CartPage()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
      ],
    ),
    GoRoute(
      path: '/product/:id',
      builder: (context, state) => ProductDetailPage(
        id: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => LoginPage(
        redirect: state.uri.queryParameters['redirect'],
      ),
    ),
  ],
);
```

### models/product.dart

```dart
class Product {
  final String id;
  final String name;
  final double price;
  final double? originalPrice;
  final String imageUrl;
  final List<String> images;
  final String description;
  final String category;
  final int stock;
  final double rating;
  final int reviewCount;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    required this.images,
    required this.description,
    required this.category,
    required this.stock,
    required this.rating,
    required this.reviewCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
    id: json['id'].toString(),
    name: json['name'] as String,
    price: (json['price'] as num).toDouble(),
    originalPrice: json['original_price'] != null
        ? (json['original_price'] as num).toDouble()
        : null,
    imageUrl: json['image_url'] as String,
    images: List<String>.from(json['images'] ?? []),
    description: json['description'] as String? ?? '',
    category: json['category'] as String? ?? '',
    stock: json['stock'] as int? ?? 0,
    rating: (json['rating'] as num?)?.toDouble() ?? 0,
    reviewCount: json['review_count'] as int? ?? 0,
  );

  bool get hasDiscount => originalPrice != null && originalPrice! > price;
  double get discountPercent => hasDiscount
      ? ((originalPrice! - price) / originalPrice! * 100).roundToDouble()
      : 0;
}
```

### stores/cart_store.dart

```dart
import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/storage_service.dart';

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  double get subtotal => product.price * quantity;
}

class CartStore extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get totalCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => _items.fold(0, (sum, item) => sum + item.subtotal);
  bool get isEmpty => _items.isEmpty;

  bool isInCart(String productId) =>
      _items.any((item) => item.product.id == productId);

  void addToCart(Product product, {int quantity = 1}) {
    final index = _items.indexWhere((item) => item.product.id == product.id);
    if (index >= 0) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    notifyListeners();
  }

  void removeFromCart(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      _items[index].quantity = quantity;
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
```

### pages/home/home_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../stores/product_store.dart';
import '../../widgets/product_card.dart';
import '../../widgets/banner_slider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductStore>().loadProducts(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('首页'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
        ],
      ),
      body: Consumer<ProductStore>(
        builder: (context, store, child) {
          if (store.isLoading && store.products.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () => store.loadProducts(refresh: true),
            child: CustomScrollView(
              slivers: [
                // 轮播图
                SliverToBoxAdapter(
                  child: BannerSlider(images: store.banners),
                ),

                // 分类导航
                SliverToBoxAdapter(
                  child: _buildCategories(),
                ),

                // 商品标题
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      '热门商品',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),

                // 商品网格
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 0.7,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index == store.products.length) {
                          return store.hasMore
                              ? const Center(child: CircularProgressIndicator())
                              : const Center(child: Text('没有更多了'));
                        }
                        return ProductCard(product: store.products[index]);
                      },
                      childCount: store.products.length + 1,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCategories() {
    final categories = ['全部', '手机', '电脑', '服装', '食品', '家居'];
    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: categories.length,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            children: [
              CircleAvatar(
                backgroundColor: Colors.orange[100],
                child: Icon(Icons.category, color: Colors.orange),
              ),
              const SizedBox(height: 4),
              Text(categories[index], style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
```

### widgets/product_card.dart

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../stores/cart_store.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/product/${product.id}', extra: product),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 商品图片
            Expanded(
              child: CachedNetworkImage(
                imageUrl: product.imageUrl,
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (context, url) => Container(
                  color: Colors.grey[200],
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) => Container(
                  color: Colors.grey[200],
                  child: const Icon(Icons.image_not_supported),
                ),
              ),
            ),

            // 商品信息
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '¥${product.price.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: Colors.red[600],
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      if (product.hasDiscount) ...[
                        const SizedBox(width: 4),
                        Text(
                          '¥${product.originalPrice!.toStringAsFixed(2)}',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 11,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  // 加入购物车按钮
                  SizedBox(
                    width: double.infinity,
                    height: 28,
                    child: Consumer<CartStore>(
                      builder: (context, cart, child) {
                        final inCart = cart.isInCart(product.id);
                        return ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.zero,
                            backgroundColor: inCart ? Colors.grey : Colors.orange,
                          ),
                          onPressed: () {
                            if (!inCart) {
                              cart.addToCart(product);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('已加入购物车'),
                                  duration: Duration(seconds: 1),
                                ),
                              );
                            }
                          },
                          child: Text(
                            inCart ? '已加入' : '加入购物车',
                            style: const TextStyle(fontSize: 11, color: Colors.white),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### pages/cart/cart_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../stores/cart_store.dart';

class CartPage extends StatelessWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('购物车')),
      body: Consumer<CartStore>(
        builder: (context, cart, child) {
          if (cart.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text('购物车是空的', style: TextStyle(color: Colors.grey[500])),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: cart.items.length,
                  itemBuilder: (context, index) {
                    final item = cart.items[index];
                    return Dismissible(
                      key: ValueKey(item.product.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        color: Colors.red,
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 16),
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (_) => cart.removeFromCart(item.product.id),
                      child: ListTile(
                        leading: Image.network(
                          item.product.imageUrl,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                        ),
                        title: Text(item.product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                          '¥${item.product.price.toStringAsFixed(2)}',
                          style: TextStyle(color: Colors.red[600]),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () => cart.updateQuantity(
                                item.product.id, item.quantity - 1,
                              ),
                            ),
                            Text('${item.quantity}'),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () => cart.updateQuantity(
                                item.product.id, item.quantity + 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // 结算栏
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('共 ${cart.totalCount} 件'),
                          Text(
                            '合计: ¥${cart.totalPrice.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: Colors.red[600],
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                      ),
                      onPressed: () {
                        // 跳转结算页
                      },
                      child: const Text('去结算', style: TextStyle(color: Colors.white, fontSize: 16)),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

---

## 运行项目

```bash
# 1. 创建项目
flutter create ecommerce_app
cd ecommerce_app

# 2. 添加依赖（pubspec.yaml）
flutter pub add provider go_router dio cached_network_image shared_preferences image_picker

# 3. 运行
flutter run

# 4. 构建 APK
flutter build apk --release
```

---

## 项目扩展方向

1. 接入真实后端 API
2. 添加支付功能（微信/支付宝 SDK）
3. 添加推送通知
4. 实现商品搜索和筛选
5. 添加订单管理
6. 实现用户评价功能
7. 接入地图选择收货地址
