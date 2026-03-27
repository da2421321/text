# React Router

## 什么是 React Router？

React Router 是 React 的标准路由库，用于在单页应用（SPA）中实现客户端路由。它允许你根据 URL 的变化来渲染不同的组件，而不需要重新加载页面。

## 安装

```bash
# 使用 npm
npm install react-router-dom

# 使用 yarn
yarn add react-router-dom
```

## 基本配置

### BrowserRouter

```jsx
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* 你的应用组件 */}
    </BrowserRouter>
  );
}
```

### HashRouter

```jsx
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      {/* 你的应用组件 */}
    </HashRouter>
  );
}
```

## 路由配置

### Routes 和 Route

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return <h1>首页</h1>;
}

function About() {
  return <h1>关于我们</h1>;
}

function Contact() {
  return <h1>联系我们</h1>;
}
```

### 嵌套路由

```jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="users" element={<Users />}>
            <Route path=":id" element={<UserDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
        <Link to="/contact">联系</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

## 导航组件

### Link

```jsx
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>
      <Link to="/contact">联系</Link>
    </nav>
  );
}
```

### NavLink

```jsx
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        首页
      </NavLink>
      <NavLink
        to="/about"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        关于
      </NavLink>
      <NavLink
        to="/contact"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        联系
      </NavLink>
    </nav>
  );
}
```

### useNavigate Hook

```jsx
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // 登录成功后跳转
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">登录</button>
    </form>
  );
}
```

## 路由参数

### 动态路由参数

```jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(id).then(data => setUser(data));
  }, [id]);

  return user ? <h1>{user.name}</h1> : <p>加载中...</p>;
}
```

### 查询参数

```jsx
import { useSearchParams } from 'react-router-dom';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const page = searchParams.get('page');

  useEffect(() => {
    searchResults(query, page).then(data => {
      // 处理搜索结果
    });
  }, [query, page]);

  return <h1>搜索结果: {query}</h1>;
}
```

## 编程式导航

### useNavigate

```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    // 导航到指定路径
    navigate('/about');

    // 替换当前历史记录
    navigate('/about', { replace: true });

    // 导航到上一页
    navigate(-1);

    // 导航到下一页
    navigate(1);

    // 传递状态
    navigate('/about', { state: { from: 'home' } });
  };

  return <button onClick={handleClick}>点击</button>;
}
```

## 路由守卫

### 私有路由

```jsx
function PrivateRoute({ children }) {
  const isAuthenticated = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 重定向

```jsx
import { Navigate } from 'react-router-dom';

function App() {
  const user = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <Home />}
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 404 页面

```jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return <h1>404 - 页面未找到</h1>;
}
```

## 滚动恢复

```jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* 你的路由 */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 实战示例：博客应用

```jsx
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './BlogApp.css';

function BlogApp() {
  const [posts, setPosts] = useState([
    { id: 1, title: 'React 入门', content: 'React 是一个用于构建用户界面的 JavaScript 库...' },
    { id: 2, title: 'Vue 入门', content: 'Vue 是一个渐进式 JavaScript 框架...' },
    { id: 3, title: 'Angular 入门', content: 'Angular 是一个平台和框架...' }
  ]);

  return (
    <BrowserRouter>
      <div className="blog-app">
        <nav className="blog-nav">
          <Link to="/">首页</Link>
          <Link to="/about">关于</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home posts={posts} />} />
          <Route path="/post/:id" element={<PostDetail posts={posts} />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home({ posts }) {
  return (
    <div className="home">
      <h1>博客首页</h1>
      <div className="post-list">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.content.substring(0, 100)}...</p>
            <Link to={`/post/${post.id}`}>阅读更多</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostDetail({ posts }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    return <NotFound />;
  }

  return (
    <div className="post-detail">
      <button onClick={() => navigate(-1)}>返回</button>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}

function About() {
  return (
    <div className="about">
      <h1>关于我们</h1>
      <p>这是一个使用 React Router 构建的博客应用。</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - 页面未找到</h1>
      <Link to="/">返回首页</Link>
    </div>
  );
}

export default BlogApp;
```

## 最佳实践

1. **使用 BrowserRouter**：在生产环境中使用 BrowserRouter
2. **合理组织路由**：将路由配置集中管理
3. **使用懒加载**：对于大型应用，使用懒加载优化性能
4. **处理 404**：始终提供 404 页面
5. **路由守卫**：保护需要认证的路由

## 下一步

掌握 React Router 后，继续学习：
- [Hooks 进阶](./08-Hooks进阶.md)
- [状态管理](./09-状态管理.md)
- [性能优化](./10-性能优化.md)
