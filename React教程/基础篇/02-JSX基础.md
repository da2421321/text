# JSX 基础

## 什么是 JSX？

JSX 是 JavaScript 的语法扩展，允许我们在 JavaScript 代码中编写类似 HTML 的代码。它不是必需的，但使用 JSX 可以让 React 代码更加直观和易读。

```jsx
const element = <h1>Hello, world!</h1>;
```

## JSX 基本语法

### 1. JSX 元素

JSX 元素看起来像 HTML，但实际上是 JavaScript 对象：

```jsx
// JSX 写法
const element = <h1>Hello, world!</h1>;

// 编译后的 JavaScript
const element = React.createElement('h1', null, 'Hello, world!');
```

### 2. 嵌套元素

JSX 元素可以嵌套，但必须有一个根元素：

```jsx
// 正确 - 有一个根元素
function App() {
  return (
    <div>
      <h1>标题</h1>
      <p>段落</p>
    </div>
  );
}

// 正确 - 使用 Fragment（React 16+）
function App() {
  return (
    <>
      <h1>标题</h1>
      <p>段落</p>
    </>
  );
}

// 错误 - 没有根元素
function App() {
  return (
    <h1>标题</h1>
    <p>段落</p>
  );
}
```

### 3. JavaScript 表达式

在 JSX 中使用花括号 `{}` 来嵌入 JavaScript 表达式：

```jsx
function App() {
  const name = 'React';
  const age = 10;
  const isLoggedIn = true;

  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>年龄: {age}</p>
      <p>状态: {isLoggedIn ? '已登录' : '未登录'}</p>
      <p>计算结果: {2 + 3}</p>
    </div>
  );
}
```

### 4. 属性（Props）

JSX 中的属性使用驼峰命名法：

```jsx
// HTML 写法
<div class="container" onclick="handleClick()"></div>

// JSX 写法
<div className="container" onClick={handleClick}></div>
```

#### 常见属性转换

| HTML 属性 | JSX 属性 |
|-----------|----------|
| class | className |
| for | htmlFor |
| tabindex | tabIndex |
| readonly | readOnly |
| colspan | colSpan |
| rowspan | rowSpan |

#### 动态属性

```jsx
function App() {
  const className = 'active';
  const disabled = true;
  const style = { color: 'red', fontSize: '16px' };

  return (
    <div>
      <button className={className}>按钮</button>
      <button disabled={disabled}>禁用按钮</button>
      <div style={style}>样式</div>
    </div>
  );
}
```

### 5. 条件渲染

#### 使用三元运算符

```jsx
function App() {
  const isLoggedIn = true;

  return (
    <div>
      {isLoggedIn ? <p>欢迎回来</p> : <p>请登录</p>}
    </div>
  );
}
```

#### 使用逻辑与运算符

```jsx
function App() {
  const showMessage = true;

  return (
    <div>
      {showMessage && <p>这是一条消息</p>}
    </div>
  );
}
```

#### 使用变量

```jsx
function App() {
  const isLoggedIn = true;
  let content;

  if (isLoggedIn) {
    content = <p>欢迎回来</p>;
  } else {
    content = <p>请登录</p>;
  }

  return <div>{content}</div>;
}
```

### 6. 列表渲染

使用 `map()` 方法渲染列表：

```jsx
function App() {
  const items = ['苹果', '香蕉', '橙子'];

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
```

#### 渲染对象数组

```jsx
function App() {
  const users = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
    { id: 3, name: '王五', age: 28 }
  ];

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>姓名</th>
          <th>年龄</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 7. 样式

#### 内联样式

```jsx
function App() {
  const buttonStyle = {
    backgroundColor: 'blue',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px'
  };

  return <button style={buttonStyle}>点击我</button>;
}
```

#### CSS 类名

```jsx
import './App.css';

function App() {
  return <div className="container">内容</div>;
}
```

#### 动态类名

```jsx
function App() {
  const isActive = true;

  return (
    <div className={`container ${isActive ? 'active' : ''}`}>
      内容
    </div>
  );
}
```

### 8. 注释

在 JSX 中使用 `{/* */}` 来添加注释：

```jsx
function App() {
  return (
    <div>
      {/* 这是一个注释 */}
      <h1>标题</h1>
      {/* 
        多行注释
        可以写多行
      */}
      <p>内容</p>
    </div>
  );
}
```

### 9. 自闭合标签

在 JSX 中，自闭合标签必须使用 `/`：

```jsx
// 正确
<img src="logo.png" alt="Logo" />
<input type="text" />
<br />

// 错误
<img src="logo.png" alt="Logo">
<input type="text">
<br>
```

### 10. 事件处理

```jsx
function App() {
  const handleClick = () => {
    console.log('按钮被点击了');
  };

  const handleChange = (e) => {
    console.log('输入值:', e.target.value);
  };

  return (
    <div>
      <button onClick={handleClick}>点击我</button>
      <input type="text" onChange={handleChange} />
    </div>
  );
}
```

## JSX 规则总结

1. **必须有一个根元素**：所有 JSX 元素必须包裹在一个父元素中
2. **属性使用驼峰命名**：`className` 而不是 `class`
3. **自闭合标签必须加 `/`**：`<img />` 而不是 `<img>`
4. **使用 `{}` 嵌入表达式**：`{variable}` 而不是 `{{variable}}`
5. **不能使用 `if` 语句**：在 JSX 中使用三元运算符或逻辑与运算符
6. **`class` 和 `for` 是保留字**：使用 `className` 和 `htmlFor`

## 实战示例

```jsx
import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: 'React', completed: false },
    { id: 2, name: 'Vue', completed: true },
    { id: 3, name: 'Angular', completed: false }
  ]);

  const handleClick = () => {
    setCount(count + 1);
  };

  const toggleComplete = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="App">
      <header>
        <h1>JSX 实战示例</h1>
      </header>

      <main>
        <section>
          <h2>计数器</h2>
          <p>当前计数: {count}</p>
          <button onClick={handleClick}>
            {count === 0 ? '开始计数' : '增加计数'}
          </button>
        </section>

        <section>
          <h2>待办事项</h2>
          <ul>
            {items.map(item => (
              <li
                key={item.id}
                onClick={() => toggleComplete(item.id)}
                style={{
                  textDecoration: item.completed ? 'line-through' : 'none',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                {item.name} {item.completed && '✓'}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>条件渲染</h2>
          {count > 5 ? (
            <p style={{ color: 'green' }}>计数已超过 5</p>
          ) : (
            <p style={{ color: 'orange' }}>计数未超过 5</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
```

## 最佳实践

1. **保持 JSX 简洁**：复杂的逻辑提取到组件外
2. **使用 Fragment**：避免不必要的 DOM 节点
3. **合理使用 key**：列表渲染时提供稳定的 key
4. **避免内联函数**：在渲染时创建新函数会影响性能
5. **使用 PropTypes 或 TypeScript**：对 props 进行类型检查

## 下一步

掌握 JSX 基础后，继续学习：
- [组件与 Props](./03-组件与Props.md)
- [State 与生命周期](./04-State与生命周期.md)
- [事件处理](./05-事件处理.md)
