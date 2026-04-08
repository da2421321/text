# 任务管理系统

## 项目简介

功能完整的任务管理应用，支持任务的创建、编辑、删除、状态管理和优先级排序。

## 技术栈

- React 18
- TypeScript
- Redux Toolkit（状态管理）
- React Router 6
- Tailwind CSS

## 功能特性

- [x] 任务列表展示
- [x] 创建新任务
- [x] 编辑任务
- [x] 删除任务
- [x] 任务状态管理（待办/进行中/已完成）
- [x] 任务优先级（高/中/低）
- [x] 截止日期设置
- [x] 任务筛选（按状态、优先级）
- [x] 任务排序（按日期、优先级）
- [x] 搜索任务
- [x] 数据持久化（localStorage）

## 项目结构

```
task-manager/
├── src/
│   ├── store/           # Redux Store
│   │   ├── index.ts
│   │   └── taskSlice.ts
│   ├── components/      # 组件
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskFilters.tsx
│   │   └── TaskStats.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── storage.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 类型定义

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
```

## 运行项目

```bash
npm install
npm run dev
```

## 核心代码

### taskSlice.ts

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../types';

interface TaskState {
  tasks: Task[];
  filter: {
    status: string;
    priority: string;
    search: string;
  };
  sortBy: 'dueDate' | 'priority' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

const initialState: TaskState = {
  tasks: [],
  filter: { status: 'all', priority: 'all', search: '' },
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      state.tasks.unshift({
        ...action.payload,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      });
    },
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        Object.assign(task, updates, { updatedAt: new Date().toISOString() });
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.status = task.status === 'done' ? 'todo' : 'done';
        task.updatedAt = new Date().toISOString();
      }
    },
    setFilter: (state, action: PayloadAction<Partial<TaskState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSort: (state, action: PayloadAction<{ sortBy: TaskState['sortBy']; sortOrder: TaskState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    loadTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
  },
});

export const { addTask, updateTask, deleteTask, toggleTaskStatus, setFilter, setSort, loadTasks } = taskSlice.actions;
export default taskSlice.reducer;
```

### TaskItem.tsx

```tsx
import { useDispatch } from 'react-redux';
import { updateTask, deleteTask, toggleTaskStatus } from '../store/taskSlice';
import { Task } from '../types';

function TaskItem({ task }: { task: Task }) {
  const dispatch = useDispatch();

  const priorityColors = {
    low: '#50c878',
    medium: '#f39c12',
    high: '#e74c3c',
  };

  const statusLabels = {
    todo: '待办',
    'in-progress': '进行中',
    done: '已完成',
  };

  const handleToggle = () => dispatch(toggleTaskStatus(task.id));
  const handleDelete = () => dispatch(deleteTask(task.id));

  return (
    <div className={`task-item ${task.status}`}>
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={handleToggle}
      />
      <div className="task-content">
        <h3 className={task.status === 'done' ? 'done' : ''}>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        <div className="task-meta">
          <span className="priority" style={{ color: priorityColors[task.priority] }}>
            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
          </span>
          <span className="status">{statusLabels[task.status]}</span>
          {task.dueDate && (
            <span className="due-date">截止: {new Date(task.dueDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <button className="btn-delete" onClick={handleDelete}>删除</button>
    </div>
  );
}
```
