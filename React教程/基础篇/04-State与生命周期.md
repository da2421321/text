# State 与生命周期

## 什么是 State？

State 是组件内部的数据状态，当 state 发生变化时，React 会重新渲染组件。State 是私有的，完全受控于当前组件。

## 使用 useState Hook

`useState` 是 React 提供的 Hook，用于在函数组件中添加 state。

### 基本语法

```jsx
import { useState } from 'react';

function Counter() {
  // 声明一个名为 count 的 state 变量，初始值为 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
      <button onClick={() => setCount(count - 1)}>
        减少
      </button>
    </div>
  );
}
```

### 多个 State

```jsx
function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(18);

  return (
    <form>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
        placeholder="年龄"
      />
    </form>
  );
}
```

### 对象 State

```jsx
function UserProfile() {
  const [user, setUser] = useState({
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com'
  });

  const updateName = (newName) => {
    setUser({ ...user, name: newName });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <p>年龄: {user.age}</p>
      <p>邮箱: {user.email}</p>
      <input
        type="text"
        value={user.name}
        onChange={(e) => updateName(e.target.value)}
      />
    </div>
  );
}
```

### 数组 State

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: '学习 React', completed: false },
    { id: 2, text: '完成项目', completed: false }
  ]);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none'
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 使用 useEffect Hook

`useEffect` 用于处理副作用，如数据获取、订阅、手动修改 DOM 等。

### 基本用法

```jsx
import { useState, useEffect } from 'react';

function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count => count + 1);
    }, 1000);

    // 清理函数
    return () => clearInterval(timer);
  }, []); // 空依赖数组表示只在组件挂载时执行一次

  return <p>计时器: {count} 秒</p>;
}
```

### 依赖数组

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(data => setUser(data));
  }, [userId]); // 当 userId 变化时重新执行

  return user ? <h1>{user.name}</h1> : <p>加载中...</p>;
}
```

### 多个 useEffect

```jsx
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 监听 count 变化
  useEffect(() => {
    console.log('count 变化了:', count);
  }, [count]);

  // 监听 name 变化
  useEffect(() => {
    console.log('name 变化了:', name);
  }, [name]);

  // 只在组件挂载时执行
  useEffect(() => {
    console.log('组件已挂载');
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
  );
}
```

## 其他常用 Hooks

### useReducer

`useReducer` 是 `useState` 的替代方案，适用于复杂的 state 逻辑。

```jsx
import { useReducer } from 'react';

const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>
        增加
      </button>
      <button onClick={() => dispatch({ type: 'decrement' })}>
        减少
      </button>
      <button onClick={() => dispatch({ type: 'reset' })}>
        重置
      </button>
    </div>
  );
}
```

### useContext

`useContext` 用于跨组件共享数据，避免 props 层层传递。

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff'
      }}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      切换主题
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

### useMemo

`useMemo` 用于缓存计算结果，避免不必要的重新计算。

```jsx
import { useState, useMemo } from 'react';

function ExpensiveCalculation({ numbers }) {
  const [count, setCount] = useState(0);

  const sum = useMemo(() => {
    console.log('计算中...');
    return numbers.reduce((a, b) => a + b, 0);
  }, [numbers]); // 只有 numbers 变化时才重新计算

  return (
    <div>
      <p>总和: {sum}</p>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

### useCallback

`useCallback` 用于缓存函数，避免子组件不必要的重新渲染。

```jsx
import { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('按钮被点击');
  }, []); // 空依赖数组，函数不会改变

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
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

### useRef

`useRef` 用于访问 DOM 元素或存储不触发重新渲染的值。

```jsx
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={() => inputRef.current.focus()}>
        聚焦输入框
      </button>
    </div>
  );
}
```

## 实战示例：待办事项应用

```jsx
import { useState, useEffect } from 'react';
import './TodoApp.css';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo = {
        id: Date.now(),
        text: inputValue,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter(todo => !todo.completed).length;

  return (
    <div className="todo-app">
      <h1>待办事项</h1>

      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新的待办事项"
        />
        <button onClick={addTodo}>添加</button>
      </div>

      <div className="todo-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          进行中
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          已完成
        </button>
      </div>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>

      <p className="todo-stats">
        剩余 {activeCount} 项未完成
      </p>
    </div>
  );
}

export default TodoApp;
```

## State 最佳实践

1. **最小化 State**：只存储必要的数据
2. **避免重复 State**：不要在多个地方存储相同的数据
3. **合理使用 Hooks**：根据场景选择合适的 Hook
4. **清理副作用**：在 useEffect 中返回清理函数
5. **使用 TypeScript**：为 state 添加类型检查

## 下一步

掌握 State 与生命周期后，继续学习：
- [事件处理](./05-事件处理.md)
- [表单处理](./06-表单处理.md)
- [路由](../进阶篇/07-React-Router.md)
