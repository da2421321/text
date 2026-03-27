# 在线商城项目

## 项目简介

这是一个完整的在线商城项目，使用 React + TypeScript + Redux Toolkit 构建，包含商品展示、购物车、订单管理等功能。

## 技术栈

- React 18
- TypeScript
- Redux Toolkit
- React Router
- Axios
- Tailwind CSS

## 项目结构

```
online-store/
├── public/
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   ├── CartItem.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   └── Checkout.tsx
│   ├── store/
│   │   ├── cartSlice.ts
│   │   ├── productsSlice.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

## 类型定义

```typescript
// src/types/index.ts

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  shippingAddress: Address;
}

export interface Address {
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}
```

## Redux Store

```typescript
// src/store/cartSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }

      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>
    ) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
```

```typescript
// src/store/productsSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Product } from '../types';
import { fetchProducts as fetchProductsApi } from '../utils/api';

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    return await fetchProductsApi();
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      });
  }
});

export default productsSlice.reducer;
```

```typescript
// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 组件

```typescript
// src/components/ProductCard.tsx

import React from 'react';
import { Product } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="price">¥{product.price}</p>
      <p className="description">{product.description}</p>
      <button onClick={handleAddToCart}>加入购物车</button>
    </div>
  );
};

export default ProductCard;
```

```typescript
// src/components/CartItem.tsx

import React from 'react';
import { CartItem } from '../types';
import { useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../store/cartSlice';

interface CartItemComponentProps {
  item: CartItem;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({ item }) => {
  const dispatch = useDispatch();

  const handleRemove = () => {
    dispatch(removeFromCart(item.id));
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id: item.id, quantity }));
    }
  };

  return (
    <div className="cart-item">
      <img src={item.image} alt={item.name} />
      <div className="item-info">
        <h4>{item.name}</h4>
        <p className="price">¥{item.price}</p>
      </div>
      <div className="item-quantity">
        <button onClick={() => handleQuantityChange(item.quantity - 1)}>
          -
        </button>
        <span>{item.quantity}</span>
        <button onClick={() => handleQuantityChange(item.quantity + 1)}>
          +
        </button>
      </div>
      <div className="item-total">
        <p>¥{item.price * item.quantity}</p>
        <button onClick={handleRemove}>删除</button>
      </div>
    </div>
  );
};

export default CartItemComponent;
```

## 页面

```typescript
// src/pages/Home.tsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="home">
      <header className="home-header">
        <h1>欢迎来到在线商城</h1>
        <Link to="/cart" className="cart-link">
          购物车
        </Link>
      </header>

      <div className="product-grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Home;
```

```typescript
// src/pages/Cart.tsx

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import CartItem from '../components/CartItem';
import { Link } from 'react-router-dom';

const Cart: React.FC = () => {
  const { items, total } = useSelector((state: RootState) => state.cart);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h1>购物车为空</h1>
        <Link to="/">去购物</Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <h1>购物车</h1>
      <div className="cart-items">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      <div className="cart-summary">
        <h2>总计: ¥{total}</h2>
        <Link to="/checkout">
          <button className="checkout-button">去结算</button>
        </Link>
      </div>
    </div>
  );
};

export default Cart;
```

```typescript
// src/pages/Checkout.tsx

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { clearCart } from '../store/cartSlice';
import { useNavigate } from 'react-router-dom';
import { Address } from '../types';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items, total } = useSelector((state: RootState) => state.cart);

  const [address, setAddress] = useState<Address>({
    name: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里应该调用 API 创建订单
    console.log('订单提交:', { items, total, address });
    dispatch(clearCart());
    navigate('/order-success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="checkout">
      <h1>结算</h1>

      <div className="checkout-container">
        <div className="checkout-form">
          <h2>收货地址</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="收货人姓名"
              value={address.name}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="联系电话"
              value={address.phone}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="详细地址"
              value={address.address}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="city"
              placeholder="城市"
              value={address.city}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="zipCode"
              placeholder="邮政编码"
              value={address.zipCode}
              onChange={handleChange}
              required
            />
            <button type="submit">提交订单</button>
          </form>
        </div>

        <div className="checkout-summary">
          <h2>订单摘要</h2>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.id} className="order-item">
                <span>{item.name} x {item.quantity}</span>
                <span>¥{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <h3>总计: ¥{total}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
```

## API 工具

```typescript
// src/utils/api.ts

import { Product } from '../types';

export const fetchProducts = async (): Promise<Product[]> => {
  // 模拟 API 调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: '商品 1',
          description: '这是商品 1 的描述',
          price: 99,
          image: '/images/product1.jpg',
          category: '电子产品',
          stock: 100,
          rating: 4.5
        },
        {
          id: 2,
          name: '商品 2',
          description: '这是商品 2 的描述',
          price: 199,
          image: '/images/product2.jpg',
          category: '电子产品',
          stock: 50,
          rating: 4.8
        },
        {
          id: 3,
          name: '商品 3',
          description: '这是商品 3 的描述',
          price: 299,
          image: '/images/product3.jpg',
          category: '服装',
          stock: 200,
          rating: 4.2
        }
      ]);
    }, 1000);
  });
};

export const createOrder = async (orderData: any) => {
  // 模拟 API 调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: Date.now(), ...orderData });
    }, 1000);
  });
};
```

## 应用入口

```typescript
// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import './App.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
```

## 运行项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目特点

1. **类型安全**：使用 TypeScript 确保类型安全
2. **状态管理**：使用 Redux Toolkit 管理应用状态
3. **路由管理**：使用 React Router 管理页面路由
4. **组件化**：组件化设计，提高代码复用性
5. **响应式设计**：使用 Tailwind CSS 实现响应式布局

## 扩展功能

1. 用户认证和授权
2. 订单历史记录
3. 商品搜索和筛选
4. 商品评价系统
5. 支付集成
6. 后台管理系统
