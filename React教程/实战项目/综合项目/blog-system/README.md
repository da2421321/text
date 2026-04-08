# 博客系统

## 项目简介

一个功能完整的博客应用，包含文章发布、分类、搜索和评论功能。

## 技术栈

- React 18
- TypeScript
- React Router 6
- Context API（状态管理）
- CSS Modules / Tailwind CSS

## 功能特性

- [x] 文章列表展示
- [x] 文章详情页
- [x] 文章分类筛选
- [x] 文章搜索功能
- [x] 评论系统
- [x] 用户认证（简化版）
- [ ] 文章编辑和删除
- [ ] 富文本编辑器
- [ ] 用户个人主页

## 项目结构

```
blog-system/
├── src/
│   ├── components/      # 通用组件
│   │   ├── Header.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── Comment.tsx
│   │   └── SearchBar.tsx
│   ├── pages/           # 页面组件
│   │   ├── Home.tsx
│   │   ├── ArticleDetail.tsx
│   │   ├── Category.tsx
│   │   └── Write.tsx
│   ├── context/          # Context
│   │   ├── AuthContext.tsx
│   │   └── ArticleContext.tsx
│   ├── hooks/           # 自定义 Hooks
│   │   └── useArticles.ts
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── data/             # 模拟数据
│   │   └── mockData.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 类型定义

```typescript
interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: User;
  publishedAt: string;
  views: number;
  likes: number;
}

interface Comment {
  id: string;
  articleId: string;
  author: User;
  content: string;
  createdAt: string;
  parentId?: string;
}
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

## 核心代码

### App.tsx

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ArticleProvider } from './context/ArticleContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Category from './pages/Category';
import Write from './pages/Write';

function App() {
  return (
    <AuthProvider>
      <ArticleProvider>
        <BrowserRouter>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/category/:categoryName" element={<Category />} />
              <Route path="/write" element={<Write />} />
            </Routes>
          </main>
        </BrowserRouter>
      </ArticleProvider>
    </AuthProvider>
  );
}

export default App;
```

### ArticleContext.tsx

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Article, Comment } from '../types';
import { mockArticles, mockComments } from '../data/mockData';

interface ArticleContextValue {
  articles: Article[];
  comments: Comment[];
  getArticleById: (id: string) => Article | undefined;
  getCommentsByArticleId: (articleId: string) => Comment[];
  addArticle: (article: Omit<Article, 'id'>) => void;
  addComment: (comment: Omit<Comment, 'id'>) => void;
  searchArticles: (keyword: string) => Article[];
  filterByCategory: (category: string) => Article[];
}

const ArticleContext = createContext<ArticleContextValue | null>(null);

export function ArticleProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const getArticleById = (id: string) =>
    articles.find(a => a.id === id);

  const getCommentsByArticleId = (articleId: string) =>
    comments.filter(c => c.articleId === articleId && !c.parentId);

  const addArticle = (article: Omit<Article, 'id'>) => {
    const newArticle: Article = {
      ...article,
      id: Date.now().toString(),
    };
    setArticles([newArticle, ...articles]);
  };

  const addComment = (comment: Omit<Comment, 'id'>) => {
    setComments([...comments, { ...comment, id: Date.now().toString() }]);
  };

  const searchArticles = (keyword: string) => {
    const lower = keyword.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(lower) ||
      a.content.toLowerCase().includes(lower)
    );
  };

  const filterByCategory = (category: string) =>
    articles.filter(a => a.category === category);

  return (
    <ArticleContext.Provider value={{
      articles, comments, getArticleById, getCommentsByArticleId,
      addArticle, addComment, searchArticles, filterByCategory
    }}>
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (!context) throw new Error('useArticles must be used within ArticleProvider');
  return context;
}
```
