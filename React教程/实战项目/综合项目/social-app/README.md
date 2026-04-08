# 社交网络应用

## 项目简介

简化版的社交网络应用，包含动态发布、评论互动、点赞功能和用户关注系统。

## 技术栈

- React 18
- TypeScript
- Context API（状态管理）
- React Router 6
- Tailwind CSS

## 功能特性

- [x] 用户注册登录（简化版）
- [x] 发布动态
- [x] 浏览动态流
- [x] 点赞/取消点赞
- [x] 评论功能
- [x] 回复评论
- [x] 关注/取消关注用户
- [x] 用户主页
- [x] 消息通知
- [x] 个人资料编辑
- [x] 动态删除
- [ ] 私信功能
- [ ] 话题标签
- [ ] 分享功能
- [ ] 图片上传

## 项目结构

```
social-app/
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── SocialContext.tsx
│   ├── components/
│   │   ├── Post.tsx
│   │   ├── PostList.tsx
│   │   ├── Comment.tsx
│   │   ├── CreatePost.tsx
│   │   ├── UserCard.tsx
│   │   ├── Notification.tsx
│   │   └── Navigation.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Profile.tsx
│   │   ├── Notifications.tsx
│   │   └── Login.tsx
│   ├── types/
│   │   └── index.ts
│   ├── data/
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
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: string[];
  following: string[];
  postsCount: number;
}

interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  likes: string[]; // 用户 ID 数组
  comments: Comment[];
  shares: number;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  likes: string[];
  replies: Comment[];
  createdAt: string;
  parentId?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUser: User;
  post?: Post;
  message: string;
  read: boolean;
  createdAt: string;
}
```

## 运行项目

```bash
npm install
npm run dev
```

## 核心代码

### SocialContext.tsx

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Post, Comment, Notification } from '../types';
import { mockPosts, mockNotifications } from '../data/mockData';

interface SocialContextValue {
  posts: Post[];
  notifications: Notification[];
  createPost: (content: string, authorId: string) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string, userId: string) => void;
  addComment: (postId: string, userId: string, content: string, parentId?: string) => void;
  toggleFollow: (currentUserId: string, targetUserId: string) => void;
  markNotificationRead: (id: string) => void;
  getUserPosts: (userId: string) => Post[];
  getFeed: (userId: string) => Post[];
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const createPost = (content: string, authorId: string) => {
    const newPost: Post = {
      id: Date.now().toString(),
      author: { id: authorId } as any,
      content,
      likes: [],
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts([newPost, ...posts]);
  };

  const deletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const toggleLike = (postId: string, userId: string) => {
    setPosts(posts.map(post => {
      if (post.id !== postId) return post;
      const hasLiked = post.likes.includes(userId);
      return {
        ...post,
        likes: hasLiked
          ? post.likes.filter(id => id !== userId)
          : [...post.likes, userId],
      };
    }));
  };

  const addComment = (postId: string, userId: string, content: string, parentId?: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      author: { id: userId } as any,
      content,
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
      parentId,
    };

    setPosts(posts.map(post => {
      if (post.id !== postId) return post;
      if (parentId) {
        return {
          ...post,
          comments: post.comments.map(c =>
            c.id === parentId
              ? { ...c, replies: [...c.replies, newComment] }
              : c
          ),
        };
      }
      return { ...post, comments: [...post.comments, newComment] };
    }));
  };

  const toggleFollow = (currentUserId: string, targetUserId: string) => {
    // 简化实现，实际需要更新两个用户对象
    console.log(`User ${currentUserId} ${'followed'} ${targetUserId}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getUserPosts = (userId: string) =>
    posts.filter(p => p.author.id === userId);

  const getFeed = (userId: string) => posts;

  return (
    <SocialContext.Provider value={{
      posts, notifications, createPost, deletePost,
      toggleLike, addComment, toggleFollow,
      markNotificationRead, getUserPosts, getFeed,
    }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used within SocialProvider');
  return context;
}
```

### Post.tsx

```tsx
import { useState } from 'react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import Comment from './Comment';

function Post({ post }: { post: Post }) {
  const { toggleLike, addComment, deletePost } = useSocial();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLiked = user ? post.likes.includes(user.id) : false;
  const isOwner = user?.id === post.author.id;

  const handleLike = () => {
    if (user) toggleLike(post.id, user.id);
  };

  const handleComment = () => {
    if (user && commentText.trim()) {
      addComment(post.id, user.id, commentText.trim());
      setCommentText('');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="post">
      <div className="post-header">
        <img src={post.author.avatar} alt={post.author.displayName} className="avatar" />
        <div className="author-info">
          <h4>{post.author.displayName}</h4>
          <span className="username">@{post.author.username}</span>
          <span className="date">{formatDate(post.createdAt)}</span>
        </div>
        {isOwner && (
          <button className="btn-delete" onClick={() => deletePost(post.id)}>
            删除
          </button>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.images?.map((img, i) => (
          <img key={i} src={img} alt="" className="post-image" />
        ))}
      </div>

      <div className="post-actions">
        <button className={`action-btn like ${isLiked ? 'active' : ''}`} onClick={handleLike}>
          {isLiked ? '❤️' : '🤍'} {post.likes.length}
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          💬 {post.comments.length}
        </button>
        <button className="action-btn">
          🔗 {post.shares}
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="comment-input">
            <input
              type="text"
              placeholder="写下你的评论..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment}>发送</button>
          </div>
          {post.comments.map(comment => (
            <Comment key={comment.id} comment={comment} postId={post.id} />
          ))}
        </div>
      )}
    </div>
  );
}
```
