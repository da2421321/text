# Hooks 进阶

## 自定义 Hooks

自定义 Hooks 是一个函数，其名称以 "use" 开头，函数内部可以调用其他的 Hook。

### 基本语法

```jsx
function useCustomHook() {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // 副作用
  }, []);

  return { state, setState };
}
```

### 示例：useWindowSize

```jsx
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

function App() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>窗口宽度: {width}px</p>
      <p>窗口高度: {height}px</p>
    </div>
  );
}
```

### 示例：useLocalStorage

```jsx
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

function App() {
  const [name, setName] = useLocalStorage('name', '');

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="输入名字"
      />
      <p>你好, {name}!</p>
    </div>
  );
}
```

### 示例：useFetch

```jsx
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const data = await response.json();
        setData(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

function App() {
  const { data, loading, error } = useFetch('https://api.example.com/users');

  if (loading) return <p>加载中...</p>;
  if (error) return <p>错误: {error.message}</p>;

  return (
    <div>
      {data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 示例：useToggle

```jsx
import { useState, useCallback } from 'react';

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

function App() {
  const { value, toggle } = useToggle();

  return (
    <div>
      <p>状态: {value ? '开' : '关'}</p>
      <button onClick={toggle}>切换</button>
    </div>
  );
}
```

### 示例：useDebounce

```jsx
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // 执行搜索
      console.log('搜索:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

## Hooks 规则

### 1. 只在 React 函数中调用 Hooks

```jsx
// 正确
function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// 错误
function regularFunction() {
  const [count, setCount] = useState(0); // 错误！
}
```

### 2. 只在顶层调用 Hooks

```jsx
// 正确
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {}, []);
  return <div>{count}</div>;
}

// 错误
function App() {
  if (condition) {
    const [count, setCount] = useState(0); // 错误！
  }
  return <div>{count}</div>;
}
```

### 3. 自定义 Hook 必须以 "use" 开头

```jsx
// 正确
function useCustomHook() {
  const [state, setState] = useState(0);
  return [state, setState];
}

// 错误
function customHook() {
  const [state, setState] = useState(0); // 错误！
  return [state, setState];
}
```

## 高级 Hooks

### useTransition

用于标记非紧急的状态更新，让 React 优先处理更重要的更新。

```jsx
import { useState, useTransition } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState('');
  const [list, setList] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    startTransition(() => {
      // 这个更新会被标记为非紧急
      const filtered = largeList.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setList(filtered);
    });
  };

  return (
    <div>
      <input value={input} onChange={handleChange} />
      {isPending && <p>加载中...</p>}
      <ul>
        {list.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
```

### useDeferredValue

用于延迟更新某个值，直到更紧急的更新完成。

```jsx
import { useState, useDeferredValue } from 'react';

function App() {
  const [input, setInput] = useState('');
  const deferredInput = useDeferredValue(input);

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <SlowList query={deferredInput} />
    </div>
  );
}
```

### useId

用于生成唯一的 ID，特别适用于可访问性。

```jsx
import { useId } from 'react';

function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={`${id}-name`}>姓名:</label>
      <input id={`${id}-name`} type="text" />
      <label htmlFor={`${id}-email`}>邮箱:</label>
      <input id={`${id}-email`} type="email" />
    </div>
  );
}
```

### useSyncExternalStore

用于订阅外部数据源。

```jsx
import { useSyncExternalStore } from 'react';

function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true
  );
}

function App() {
  const isOnline = useOnlineStatus();

  return <p>{isOnline ? '在线' : '离线'}</p>;
}
```

## Hooks 性能优化

### useMemo

```jsx
import { useState, useMemo } from 'react';

function ExpensiveComponent({ items }) {
  const [count, setCount] = useState(0);

  const sortedItems = useMemo(() => {
    console.log('排序中...');
    return items.sort((a, b) => a.value - b.value);
  }, [items]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        计数: {count}
      </button>
      <ul>
        {sortedItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useCallback

```jsx
import { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('按钮被点击');
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        计数: {count}
      </button>
      <Child onClick={handleClick} />
    </div>
  );
}

function Child({ onClick }) {
  console.log('Child 渲染');
  return <button onClick={onClick}>子组件按钮</button>;
}
```

## 实战示例：自定义 Hook 组合

```jsx
import { useState, useEffect, useCallback } from 'react';

function useCounter(initialValue = 0, step = 1) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount(c => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);

  return [value, toggle];
}

function CounterWithToggle() {
  const { count, increment, decrement, reset } = useCounter(0, 1);
  const [isRunning, toggleRunning] = useToggle(false);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        increment();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, increment]);

  return (
    <div>
      <h1>计数器: {count}</h1>
      <button onClick={increment}>增加</button>
      <button onClick={decrement}>减少</button>
      <button onClick={reset}>重置</button>
      <button onClick={toggleRunning}>
        {isRunning ? '停止' : '开始'}
      </button>
    </div>
  );
}

export default CounterWithToggle;
```

## 最佳实践

1. **遵循 Hooks 规则**：只在顶层调用 Hooks
2. **合理使用自定义 Hooks**：提取可复用的逻辑
3. **性能优化**：使用 useMemo 和 useCallback 优化性能
4. **清理副作用**：在 useEffect 中返回清理函数
5. **使用 TypeScript**：为 Hooks 添加类型

## 下一步

掌握 Hooks 进阶后，继续学习：
- [状态管理](./09-状态管理.md)
- [性能优化](./10-性能优化.md)
- [测试](./11-测试.md)
