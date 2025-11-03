# 01 - HTML/CSS 规范（含示例）

## HTML 基础
- 使用标准 Doctype：`<!doctype html>`，`<html lang="zh-CN">` 并设置 `<meta charset="utf-8">` 与 `<meta name="viewport">`。
- 语义化标签优先：`header`、`nav`、`main`、`section`、`article`、`aside`、`footer`。
- 无障碍（a11y）：为图片提供 `alt`，可交互元素提供 `aria-*` 与键盘焦点（`tabindex`）。
- 属性顺序建议：`id` → `class` → `data-*` → `aria-*` → `src|href` → `alt|title` → `type|role` → 交互/表单属性。
- 禁止内联样式与内联事件（如 `onclick`），使用外部样式与事件绑定。

示例：
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HTML/CSS 规范示例</title>
  </head>
  <body>
    <header class="site-header" role="banner">
      <nav class="site-header__nav" aria-label="主导航">
        <a class="site-header__link" href="#content">跳到内容</a>
      </nav>
    </header>

    <main id="content" class="layout" role="main">
      <article class="card card--primary" aria-labelledby="card-title-1">
        <h1 id="card-title-1" class="card__title">示例标题</h1>
        <p class="card__text">一段用于展示 BEM 与语义化的示例文本。</p>
        <button class="button button--primary" type="button" aria-label="提交表单">提交</button>
      </article>
    </main>

    <footer class="site-footer" role="contentinfo">
      <small>&copy; 2025 示例站点</small>
    </footer>
  </body>
</html>
```

## CSS 基础
- 命名采用 BEM：`block`、`block__element`、`block--modifier`。
- 使用 CSS 变量与响应式单位（`rem`）管理主题与尺寸，避免使用 `id` 作为样式钩子。
- 属性分组与顺序：布局 → 盒模型 → 排版 → 外观 → 动效 → 其他；避免过度嵌套。
- 媒体查询自下而上（Mobile First），优先使用 `min-width`。

示例：
```css
:root {
  --color-primary: #3b82f6;
  --color-text: #111827;
  --radius-md: 8px;
  --space-2: 0.5rem;
  --space-4: 1rem;
}

/* 布局容器 */
.layout {
  max-width: 72rem;
  margin-inline: auto;
  padding: var(--space-4);
}

/* 组件（BEM） */
.card {
  background: #fff;
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
.card--primary {
  border: 1px solid var(--color-primary);
}
.card__title {
  margin: 0 0 var(--space-2);
  font-size: 1.25rem;
  line-height: 1.6;
}
.card__text {
  margin: 0 0 var(--space-4);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}
.button--primary {
  background: var(--color-primary);
  color: #fff;
}
.button--primary:hover {
  filter: brightness(1.05);
}

/* 响应式 */
@media (min-width: 768px) {
  .card__title { font-size: 1.5rem; }
}
```

## 最佳实践清单
- 使用语义化标签与可访问性属性；图片必须有描述性的 `alt`。
- 统一采用 BEM；样式与结构分离，避免内联样式。
- 使用 CSS 变量与 `rem`；移动优先、渐进增强。
- 删除无用样式与死代码，组件内样式尽量局部化（如 `scoped`）。

