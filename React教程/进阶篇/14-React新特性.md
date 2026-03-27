# React 18/19 新特性

## 概述

React 18 和 React 19 引入了许多重要的新特性，本章将详细介绍这些新特性的使用方法和最佳实践。

---

## React 18 新特性

### 1. 并发渲染 (Concurrent Rendering)

并发渲染是 React 18 最重要的更新，它允许 React 中断、暂停和恢复渲染工作。

#### 启用并发模式

```tsx
// React 18 之前
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// React 18
import ReactDOM from 'react-dom/client';
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

### 2. 自动批处理 (Automatic Batching)

React 18 自动将多个状态更新合并为一次重渲染。

```tsx
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // React 18 之前：在 setTimeout 中会触发两次渲染
  // React 18：自动批处理，只触发一次渲染
  const handleClick = () => {
    setTimeout(() => {
      setCount(c => c + 1);  // 不会立即渲染
      setFlag(f => !f);       // 两个更新一起批处理
    }, 0);
  };

  return <button onClick={handleClick}>点击</button>;
}
```

#### 退出自动批处理

```tsx
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1);
  });
  // DOM 已更新
  
  flushSync(() => {
    setFlag(f => !f);
  });
  // DOM 再次更新
}
```

### 3. Transitions (过渡)

用于区分紧急更新和非紧急更新。

#### useTransition

```tsx
import { useState, useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 紧急更新：立即更新输入框
    setQuery(e.target.value);

    // 非紧急更新：可以被中断
    startTransition(() => {
      setResults(filterResults(e.target.value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {results.map(item => <li key={item.id}>{item.name}</li>)}
        </ul>
      )}
    </div>
  );
}
```

#### useDeferredValue

```tsx
import { useState, useDeferredValue } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // 使用延迟值进行搜索，不会阻塞输入
  const results = useMemo(
    () => filterResults(deferredQuery),
    [deferredQuery]
  );

  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      <div style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
        <ResultsList results={results} />
      </div>
    </div>
  );
}
```

### 4. Suspense 改进

#### 用于数据获取

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

// 使用支持 Suspense 的库（如 React Query、SWR、Relay）
function UserProfile() {
  const user = useUser(); // 这个 hook 会在数据加载时 suspend
  return <div>{user.name}</div>;
}
```

#### 嵌套 Suspense

```tsx
function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Header />
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </Suspense>
    </Suspense>
  );
}
```

### 5. useId Hook

生成在服务端和客户端保持一致的唯一 ID。

```tsx
import { useId } from 'react';

function FormField({ label }: { label: string }) {
  const id = useId();
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  );
}

// 生成多个相关 ID
function PasswordField() {
  const id = useId();
  
  return (
    <>
      <label htmlFor={`${id}-password`}>密码</label>
      <input id={`${id}-password`} type="password" />
      <p id={`${id}-hint`}>密码提示信息</p>
    </>
  );
}
```

---

## React 19 新特性

### 1. Actions

简化表单处理和异步操作。

```tsx
// 使用 action 处理表单
function AddToCart({ productId }: { productId: string }) {
  async function addToCartAction(formData: FormData) {
    'use server';
    await addToCart(productId);
  }

  return (
    <form action={addToCartAction}>
      <button type="submit">加入购物车</button>
    </form>
  );
}
```

### 2. useFormStatus

获取父表单的提交状态。

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

function Form() {
  async function handleSubmit(formData: FormData) {
    await submitForm(formData);
  }

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" />
      <SubmitButton />
    </form>
  );
}
```

### 3. useOptimistic

实现乐观更新。

```tsx
import { useOptimistic } from 'react';

function Messages({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );

  async function sendMessage(formData: FormData) {
    const message = formData.get('message') as string;
    
    // 乐观更新：立即显示消息
    addOptimisticMessage({
      id: Date.now(),
      text: message,
      sending: true
    });
    
    // 实际发送
    await submitMessage(message);
  }

  return (
    <div>
      {optimisticMessages.map(msg => (
        <div key={msg.id} style={{ opacity: msg.sending ? 0.5 : 1 }}>
          {msg.text}
        </div>
      ))}
      <form action={sendMessage}>
        <input name="message" />
        <button type="submit">发送</button>
      </form>
    </div>
  );
}
```

### 4. use Hook

在组件中读取 Promise 或 Context。

```tsx
import { use, Suspense } from 'react';

function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  // use 可以在条件语句中使用
  const comments = use(commentsPromise);
  
  return (
    <ul>
      {comments.map(comment => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

function Page() {
  const commentsPromise = fetchComments();
  
  return (
    <Suspense fallback={<Loading />}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

### 5. ref 作为 prop

不再需要 forwardRef。

```tsx
// React 19 之前
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19
function Input({ ref, ...props }: InputProps & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### 6. Document Metadata

在组件中直接渲染 `<title>` 和 `<meta>`。

```tsx
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <title>{post.title} - 我的博客</title>
      <meta name="description" content={post.excerpt} />
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

---

## 最佳实践

### 1. 升级策略

```bash
# 升级到 React 18
npm install react@18 react-dom@18

# 升级到 React 19
npm install react@19 react-dom@19
```

### 2. 性能优化

```tsx
// 使用 Transition 处理大列表过滤
function FilterableList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(
    () => items.filter(item => item.name.includes(filter)),
    [items, filter]
  );

  return (
    <div>
      <input
        value={filter}
        onChange={e => {
          startTransition(() => {
            setFilter(e.target.value);
          });
        }}
      />
      {isPending && <Spinner />}
      <List items={filteredItems} />
    </div>
  );
}
```

### 3. 错误边界配合 Suspense

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Loading />}>
        <AsyncComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 下一步

- [Next.js 详解](./15-Next.js详解.md)
- [错误处理](./16-错误处理.md)
