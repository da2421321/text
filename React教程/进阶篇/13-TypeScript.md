# TypeScript

## 为什么使用 TypeScript？

TypeScript 是 JavaScript 的超集，添加了静态类型检查。使用 TypeScript 可以：

1. 提前发现错误
2. 提高代码可维护性
3. 改善开发体验
4. 更好的 IDE 支持

## 安装和配置

### 安装 TypeScript

```bash
# 全局安装
npm install -g typescript

# 项目安装
npm install --save-dev typescript
```

### 初始化配置

```bash
# 生成 tsconfig.json
tsc --init
```

### tsconfig.json 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## 基本类型

### 原始类型

```typescript
let name: string = '张三';
let age: number = 25;
let isStudent: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;

// 数组
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];

// 元组
let tuple: [string, number] = ['hello', 10];

// 枚举
enum Color {
  Red,
  Green,
  Blue
}
let color: Color = Color.Red;

// Any
let anything: any = '可以是任何类型';

// Void
function log(message: string): void {
  console.log(message);
}

// Never
function error(message: string): never {
  throw new Error(message);
}
```

### 对象类型

```typescript
// 接口
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // 可选属性
  readonly createdAt: Date; // 只读属性
}

const user: User = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  createdAt: new Date()
};

// 类型别名
type ID = number | string;

type Status = 'pending' | 'success' | 'error';

type Product = {
  id: ID;
  name: string;
  price: number;
  status: Status;
};
```

## 函数类型

### 基本函数

```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b;
}

// 函数表达式
const multiply = (a: number, b: number): number => {
  return a * b;
};

// 可选参数
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting}, ${name}!` : `Hello, ${name}!`;
}

// 默认参数
function greetDefault(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

// 函数类型
type MathFunction = (a: number, b: number) => number;

const calculate: MathFunction = (a, b) => a + b;
```

## React 组件类型

### 函数组件

```tsx
import React from 'react';

// 基本组件
interface Props {
  title: string;
  count: number;
}

function Counter({ title, count }: Props) {
  return (
    <div>
      <h1>{title}</h1>
      <p>计数: {count}</p>
    </div>
  );
}

// 使用 React.FC
const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};

// 使用 children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### useState 类型

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState<number>(0);
  const [name, setName] = useState<string>('');

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

### useEffect 类型

```tsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUser(userId)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>加载中...</p>;
  if (!user) return <p>用户不存在</p>;

  return <h1>{user.name}</h1>;
}
```

### useRef 类型

```tsx
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

### 自定义 Hook 类型

```tsx
import { useState, useEffect, useCallback } from 'react';

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}
```

## 高级类型

### 联合类型

```typescript
type ID = number | string;

function printId(id: ID) {
  console.log(`ID: ${id}`);
}
```

### 交叉类型

```typescript
interface Person {
  name: string;
}

interface Employee {
  employeeId: number;
}

type PersonEmployee = Person & Employee;

const personEmployee: PersonEmployee = {
  name: '张三',
  employeeId: 123
};
```

### 类型守卫

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function printLength(value: unknown) {
  if (isString(value)) {
    console.log(value.length);
  }
}
```

### 泛型

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

const result1 = identity<string>('hello');
const result2 = identity<number>(123);

// 泛型接口
interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: 'hello' };
const numberBox: Box<number> = { value: 123 };

// 泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// 使用
interface User {
  id: number;
  name: string;
}

function UserList() {
  const users: User[] = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
  ];

  return (
    <List
      items={users}
      renderItem={(user) => <span>{user.name}</span>}
    />
  );
}
```

## 实战示例：完整的 TypeScript React 应用

```tsx
import { useState, useEffect, FormEvent } from 'react';

// 类型定义
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoFormProps {
  onAdd: (text: string) => void;
}

function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="添加新的待办事项"
      />
      <button type="submit">添加</button>
    </form>
  );
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none'
            }}
          >
            {todo.text}
          </span>
          <button onClick={() => onDelete(todo.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const activeCount = todos.filter((todo) => !todo.completed).length;

  return (
    <div>
      <h1>待办事项</h1>
      <TodoForm onAdd={addTodo} />
      <TodoList
        todos={todos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
      <p>剩余 {activeCount} 项未完成</p>
    </div>
  );
}

export default TodoApp;
```

## TypeScript 最佳实践

1. **启用严格模式**：在 tsconfig.json 中设置 `"strict": true`
2. **避免使用 any**：尽量使用具体类型
3. **使用接口定义组件 Props**：提高代码可读性
4. **使用泛型**：提高代码复用性
5. **类型守卫**：使用类型守卫确保类型安全
6. **使用类型别名**：简化复杂类型

## 下一步

掌握 TypeScript 后，你已经完成了 React 进阶篇的学习，继续学习：
- [实战项目](../实战项目/)
- [练习题](../练习题/)
