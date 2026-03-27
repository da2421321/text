# Next.js 详解

## 概述

Next.js 是一个功能完整的 React 框架，提供服务端渲染（SSR）、静态站点生成（SSG）、API 路由等功能。本章将详细介绍 Next.js 的核心概念和最佳实践。

---

## 快速开始

### 创建项目

```bash
# 使用 create-next-app
npx create-next-app@latest my-app

# 使用 TypeScript
npx create-next-app@latest my-app --typescript

# 使用 App Router（推荐）
npx create-next-app@latest my-app --app
```

### 项目结构 (App Router)

```
my-app/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   ├── globals.css         # 全局样式
│   ├── about/
│   │   └── page.tsx        # /about 页面
│   └── blog/
│       ├── page.tsx        # /blog 页面
│       └── [slug]/
│           └── page.tsx    # /blog/:slug 动态路由
├── components/             # 共享组件
├── public/                 # 静态资源
├── next.config.js          # Next.js 配置
└── package.json
```

---

## App Router (Next.js 13+)

### 1. 路由基础

#### 页面定义

```tsx
// app/page.tsx - 首页 (/)
export default function Home() {
  return <h1>首页</h1>;
}

// app/about/page.tsx - 关于页面 (/about)
export default function About() {
  return <h1>关于我们</h1>;
}
```

#### 动态路由

```tsx
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string };
}

export default function BlogPost({ params }: PageProps) {
  return <h1>文章: {params.slug}</h1>;
}

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

#### 路由组

```
app/
├── (marketing)/
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
└── (shop)/
    ├── products/
    │   └── page.tsx
    └── cart/
        └── page.tsx
```

### 2. 布局 (Layout)

```tsx
// app/layout.tsx - 根布局
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '我的应用',
  description: 'Next.js 应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <header>导航栏</header>
        <main>{children}</main>
        <footer>页脚</footer>
      </body>
    </html>
  );
}

// app/blog/layout.tsx - 嵌套布局
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-container">
      <aside>博客侧边栏</aside>
      <article>{children}</article>
    </div>
  );
}
```

### 3. 加载和错误处理

```tsx
// app/blog/loading.tsx - 加载状态
export default function Loading() {
  return <div className="skeleton">加载中...</div>;
}

// app/blog/error.tsx - 错误处理
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
}

// app/not-found.tsx - 404 页面
export default function NotFound() {
  return (
    <div>
      <h2>页面未找到</h2>
      <a href="/">返回首页</a>
    </div>
  );
}
```

---

## 数据获取

### 1. 服务端组件 (默认)

```tsx
// 服务端组件中直接获取数据
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 禁用缓存，每次请求新数据
  });
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 2. 缓存策略

```tsx
// 静态数据（默认缓存）
fetch('https://api.example.com/data');

// 动态数据（不缓存）
fetch('https://api.example.com/data', { cache: 'no-store' });

// 重新验证（ISR）
fetch('https://api.example.com/data', { 
  next: { revalidate: 3600 } // 每小时重新验证
});
```

### 3. 客户端组件

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then(res => res.json())
      .then(setComments);
  }, [postId]);

  return (
    <ul>
      {comments.map(comment => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}
```

---

## API 路由

### Route Handlers (App Router)

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET 请求
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  const posts = await getPosts(Number(page));
  return NextResponse.json(posts);
}

// POST 请求
export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await createPost(body);
  return NextResponse.json(post, { status: 201 });
}

// app/api/posts/[id]/route.ts - 动态路由
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await getPost(params.id);
  if (!post) {
    return NextResponse.json({ error: '未找到' }, { status: 404 });
  }
  return NextResponse.json(post);
}
```

---

## Server Actions

### 表单处理

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  await db.post.create({ data: { title, content } });
  revalidatePath('/blog');
}

// app/blog/new/page.tsx
import { createPost } from '../actions';

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">发布</button>
    </form>
  );
}
```

### 带状态的 Server Actions

```tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPost } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '发布中...' : '发布'}
    </button>
  );
}

export default function NewPost() {
  const [state, formAction] = useFormState(createPost, { error: null });

  return (
    <form action={formAction}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      {state.error && <p className="error">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
```

---

## 中间件

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查认证
  const token = request.cookies.get('token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 添加自定义头
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'hello');
  
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## 性能优化

### 1. 图片优化

```tsx
import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="头像"
      width={100}
      height={100}
      priority // 优先加载
      placeholder="blur"
      blurDataURL="data:image/..."
    />
  );
}
```

### 2. 字体优化

```tsx
import { Inter, Noto_Sans_SC } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const notoSansSC = Noto_Sans_SC({ 
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Layout({ children }) {
  return (
    <html className={`${inter.className} ${notoSansSC.className}`}>
      <body>{children}</body>
    </html>
  );
}
```

### 3. 动态导入

```tsx
import dynamic from 'next/dynamic';

// 动态导入组件
const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>加载中...</p>,
  ssr: false, // 禁用服务端渲染
});

export default function Dashboard() {
  return <DynamicChart data={data} />;
}
```

---

## 部署

### Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 下一步

- [错误处理](./16-错误处理.md)
- [React 新特性](./14-React新特性.md)
