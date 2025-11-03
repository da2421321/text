# 02 - JavaScript/TypeScript 规范（含示例）

## 基本风格
- 模块化：使用 ES Modules（`import`/`export`）。
- 变量：使用 `const`/`let`，禁止 `var`。
- 等值：优先使用 `===/!==`，避免隐式类型转换。
- 字符串：使用模板字符串；拼接路径使用 `URL`/`path` 工具。
- 控制流：优先早返回（Guard Clauses），减少嵌套。
- 命名：`camelCase`（变量/函数）、`PascalCase`（类/组件）、`UPPER_SNAKE_CASE`（常量）。

示例（JS）：
```js
export function getDiscountedPrice(price, rate) {
  if (typeof price !== 'number' || typeof rate !== 'number') return NaN;
  if (price <= 0 || rate < 0 || rate > 1) return NaN;
  const discount = price * rate;
  return Math.max(0, price - discount);
}
```

## TypeScript 指南
- 类型优先：避免 `any`；不确定的使用 `unknown` 并先做类型缩小。
- 对象类型：结构化优先，`interface` 描述对象形状，`type` 用于联合/映射/工具类型。
- 只读与可选：善用 `readonly` 与 `?` 标注，减少副作用。
- 函数签名显式标注输入输出；避免宽泛返回类型。

示例（TS）：
```ts
export interface User {
  readonly id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export type UserUpdate = Partial<Pick<User, 'name' | 'email' | 'isActive'>>;

export function updateUser(user: User, update: UserUpdate): User {
  return { ...user, ...update };
}

export async function fetchUser(userId: string): Promise<User> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  const data = (await res.json()) as unknown;
  // 运行时基本校验（轻量示例）
  if (
    typeof (data as any)?.id !== 'string' ||
    typeof (data as any)?.name !== 'string' ||
    typeof (data as any)?.email !== 'string' ||
    typeof (data as any)?.isActive !== 'boolean'
  ) {
    throw new Error('Invalid user payload');
  }
  return data as User;
}
```

## 异步与错误处理
- 使用 `async/await`；在边界处捕获并转化错误信息，避免吞错。
- 不在深层函数中 `try/catch` 一切，而是在调用方进行聚合处理。

示例：
```ts
export async function loadProfile(userId: string) {
  try {
    const user = await fetchUser(userId);
    return { ok: true as const, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false as const, message };
  }
}
```

## 代码组织
- 单一职责：文件与函数保持聚焦；公共逻辑抽到 `utils/`。
- 避免魔法数字：抽为具名常量；约定统一的时间、尺寸、阈值单位。
- 日志：开发用 `console` 在提交前清理或通过工具忽略；生产使用可控日志方案。

## 清单
- `const/let`、早返回、严格等值、模板字符串。
- TS：显式函数签名、避免 `any`、优先结构化类型。
- 异步边界捕获错误；公共逻辑可复用；移除死代码。

