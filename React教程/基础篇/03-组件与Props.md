# 组件与 Props

## 什么是组件？

组件是 React 的核心概念，它是构建用户界面的基本单元。组件可以将 UI 拆分成独立、可复用的部分，每个组件负责自己的逻辑和渲染。

## 组件类型

### 1. 函数组件（推荐）

函数组件是使用 JavaScript 函数定义的组件，是 React 16.8+ 推荐的组件写法。

```jsx
// 简单的函数组件
function Welcome() {
  return <h1>欢迎来到 React</h1>;
}

// 使用箭头函数
const Welcome = () => {
  return <h1>欢迎来到 React</h1>;
};

// 简化写法（隐式返回）
const Welcome = () => <h1>欢迎来到 React</h1>;
```

### 2. 类组件（传统写法）

类组件使用 ES6 类定义，需要继承自 `React.Component`。

```jsx
import React from 'react';

class Welcome extends React.Component {
  render() {
    return <h1>欢迎来到 React</h1>;
  }
}
```

### 函数组件 vs 类组件

| 特性 | 函数组件 | 类组件 |
|------|---------|--------|
| 语法 | 简洁 | 较复杂 |
| 状态管理 | 使用 Hooks | 使用 this.state |
| 生命周期 | 使用 Hooks | 使用生命周期方法 |
| 性能 | 更好 | 较差 |
| 推荐 | ✅ 推荐 | ⚠️ 传统写法 |

## Props（属性）

Props 是组件之间传递数据的方式，父组件通过 props 将数据传递给子组件。

### 基本用法

```jsx
// 父组件
function App() {
  return (
    <div>
      <Welcome name="张三" age={25} />
      <Welcome name="李四" age={30} />
    </div>
  );
}

// 子组件
function Welcome(props) {
  return (
    <div>
      <h1>欢迎, {props.name}!</h1>
      <p>年龄: {props.age}</p>
    </div>
  );
}
```

### 解构 Props

```jsx
// 方式一：在函数参数中解构
function Welcome({ name, age }) {
  return (
    <div>
      <h1>欢迎, {name}!</h1>
      <p>年龄: {age}</p>
    </div>
  );
}

// 方式二：在函数体内解构
function Welcome(props) {
  const { name, age } = props;
  return (
    <div>
      <h1>欢迎, {name}!</h1>
      <p>年龄: {age}</p>
    </div>
  );
}
```

### 默认 Props

```jsx
function Welcome({ name = '访客', age = 18 }) {
  return (
    <div>
      <h1>欢迎, {name}!</h1>
      <p>年龄: {age}</p>
    </div>
  );
}

// 使用 defaultProps（函数组件）
Welcome.defaultProps = {
  name: '访客',
  age: 18
};
```

### Props 类型检查

使用 PropTypes 进行类型检查：

```jsx
import PropTypes from 'prop-types';

function Welcome({ name, age, isAdmin }) {
  return (
    <div>
      <h1>欢迎, {name}!</h1>
      <p>年龄: {age}</p>
      {isAdmin && <p>管理员</p>}
    </div>
  );
}

Welcome.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  isAdmin: PropTypes.bool
};

Welcome.defaultProps = {
  age: 18,
  isAdmin: false
};
```

### 传递不同类型的 Props

```jsx
function App() {
  const user = {
    name: '张三',
    email: 'zhangsan@example.com'
  };

  const items = ['苹果', '香蕉', '橙子'];

  const handleClick = () => {
    console.log('按钮被点击');
  };

  return (
    <div>
      {/* 字符串 */}
      <Greeting message="你好" />

      {/* 数字 */}
      <Counter count={10} />

      {/* 布尔值 */}
      <Button disabled={false} />

      {/* 对象 */}
      <UserProfile user={user} />

      {/* 数组 */}
      <ItemList items={items} />

      {/* 函数 */}
      <Button onClick={handleClick} />

      {/* JSX 元素 */}
      <Card>
        <h2>标题</h2>
        <p>内容</p>
      </Card>
    </div>
  );
}
```

## 组件组合

### 子组件（Children）

```jsx
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Card title="个人信息">
      <p>姓名: 张三</p>
      <p>年龄: 25</p>
      <p>邮箱: zhangsan@example.com</p>
    </Card>
  );
}
```

### 多个 Slots

```jsx
function Layout({ header, sidebar, content, footer }) {
  return (
    <div className="layout">
      <header className="header">{header}</header>
      <div className="main">
        <aside className="sidebar">{sidebar}</aside>
        <main className="content">{content}</main>
      </div>
      <footer className="footer">{footer}</footer>
    </div>
  );
}

function App() {
  return (
    <Layout
      header={<h1>网站标题</h1>}
      sidebar={<nav>侧边栏</nav>}
      content={<p>主要内容</p>}
      footer={<p>页脚</p>}
    />
  );
}
```

## 组件通信

### 父子组件通信

```jsx
// 父组件
function Parent() {
  const [message, setMessage] = useState('来自父组件的消息');

  const handleMessageChange = (newMessage) => {
    setMessage(newMessage);
  };

  return (
    <div>
      <h1>父组件</h1>
      <p>消息: {message}</p>
      <Child
        message={message}
        onMessageChange={handleMessageChange}
      />
    </div>
  );
}

// 子组件
function Child({ message, onMessageChange }) {
  return (
    <div>
      <h2>子组件</h2>
      <p>接收到的消息: {message}</p>
      <button onClick={() => onMessageChange('来自子组件的新消息')}>
        更改消息
      </button>
    </div>
  );
}
```

### 兄弟组件通信

```jsx
// 共享父组件
function Parent() {
  const [sharedData, setSharedData] = useState('共享数据');

  return (
    <div>
      <SiblingA data={sharedData} />
      <SiblingB onDataChange={setSharedData} />
    </div>
  );
}

function SiblingA({ data }) {
  return <div>兄弟组件 A: {data}</div>;
}

function SiblingB({ onDataChange }) {
  return (
    <button onClick={() => onDataChange('来自兄弟组件 B 的数据')}>
      更新数据
    </button>
  );
}
```

## 实战示例：用户卡片组件

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import './UserCard.css';

function UserCard({ user, onEdit, onDelete }) {
  const { id, name, email, avatar, role } = user;

  return (
    <div className="user-card">
      <img src={avatar} alt={`${name}的头像`} className="user-avatar" />
      <div className="user-info">
        <h3 className="user-name">{name}</h3>
        <p className="user-email">{email}</p>
        <span className={`user-role ${role.toLowerCase()}`}>
          {role}
        </span>
      </div>
      <div className="user-actions">
        <button
          className="btn-edit"
          onClick={() => onEdit(id)}
        >
          编辑
        </button>
        <button
          className="btn-delete"
          onClick={() => onDelete(id)}
        >
          删除
        </button>
      </div>
    </div>
  );
}

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    role: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

UserCard.defaultProps = {
  user: {
    avatar: 'https://via.placeholder.com/150',
    role: '用户'
  }
};

function App() {
  const users = [
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      avatar: 'https://via.placeholder.com/150',
      role: '管理员'
    },
    {
      id: 2,
      name: '李四',
      email: 'lisi@example.com',
      avatar: 'https://via.placeholder.com/150',
      role: '用户'
    }
  ];

  const handleEdit = (id) => {
    console.log('编辑用户:', id);
  };

  const handleDelete = (id) => {
    console.log('删除用户:', id);
  };

  return (
    <div className="app">
      <h1>用户列表</h1>
      <div className="user-list">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
```

## 组件最佳实践

1. **单一职责**：每个组件只做一件事
2. **组件复用**：设计可复用的组件
3. **Props 命名**：使用有意义的 prop 名称
4. **类型检查**：使用 PropTypes 或 TypeScript
5. **默认值**：为 props 提供合理的默认值
6. **避免过度嵌套**：保持组件层级扁平

## 下一步

掌握组件与 Props 后，继续学习：
- [State 与生命周期](./04-State与生命周期.md)
- [事件处理](./05-事件处理.md)
- [表单处理](./06-表单处理.md)
