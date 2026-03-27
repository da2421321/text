# Vue2 中的 this 上下文详解

## 目录

1. [基本概念](#1-基本概念)
2. [data、methods、computed、watch 中的 this](#2-datamethodscomputedwatch-中的-this)
3. [生命周期钩子中的 this](#3-生命周期钩子中的-this)
4. [箭头函数导致 this 丢失](#4-箭头函数导致-this-丢失)
5. [事件处理中的 this](#5-事件处理中的-this)
6. [异步操作中保存 this](#6-异步操作中保存-this)
7. [常见错误与解决方案](#7-常见错误与解决方案)

---

## 1. 基本概念

### Vue2 如何绑定 this

在 Vue2 中，当你创建一个组件实例时，Vue 会通过 `Object.defineProperty` 将 `data`、`methods`、`computed`、`props` 等选项代理到组件实例上。这意味着在组件的选项对象中，**普通函数**里的 `this` 始终指向当前 Vue 组件实例。

```js
const vm = new Vue({
  data() {
    return { message: 'Hello' }
  },
  methods: {
    greet() {
      // this 指向 Vue 实例 vm
      console.log(this.message) // 'Hello'
    }
  }
})

vm.greet() // 'Hello'
console.log(vm.message) // 'Hello'
```

Vue 实例上可以直接访问的内容：

| 来源 | 访问方式 | 示例 |
|------|----------|------|
| data | `this.xxx` | `this.message` |
| methods | `this.xxx()` | `this.greet()` |
| computed | `this.xxx` | `this.fullName` |
| props | `this.xxx` | `this.title` |
| $data | `this.$data` | `this.$data.message` |
| $el | `this.$el` | DOM 根元素 |
| $route | `this.$route` | 当前路由（需 vue-router）|
| $store | `this.$store` | Vuex store（需 vuex）|

---

## 2. data、methods、computed、watch 中的 this

### 2.1 data 中的 this

`data` 必须是一个**函数**（组件中），函数内部的 `this` 指向组件实例，可以访问 `props`。

```js
export default {
  props: ['userId'],
  data() {
    // this 指向组件实例，可以读取 props
    console.log(this.userId) // 可以访问 props
    return {
      userName: '',
      prefix: 'user_' + this.userId
    }
  }
}
```

> 注意：`data` 函数执行时，`methods` 和 `computed` 尚未完全初始化，不建议在 `data` 中调用 `methods`。

### 2.2 methods 中的 this

`methods` 中的每个函数，Vue 会自动将其 `this` 绑定到组件实例。

```js
export default {
  data() {
    return {
      count: 0,
      name: 'Vue'
    }
  },
  methods: {
    increment() {
      // this 指向组件实例
      this.count++
    },
    reset() {
      this.count = 0
    },
    getInfo() {
      // 可以调用其他 method
      this.increment()
      // 可以访问 data
      return `${this.name}: ${this.count}`
    }
  }
}
```

### 2.3 computed 中的 this

计算属性的 getter 和 setter 中，`this` 同样指向组件实例。

```js
export default {
  data() {
    return {
      firstName: '三',
      lastName: '张',
      age: 18
    }
  },
  computed: {
    // getter 中的 this
    fullName() {
      return this.lastName + this.firstName
    },

    // 带 setter 的计算属性
    displayName: {
      get() {
        // this 指向组件实例
        return `${this.fullName}（${this.age}岁）`
      },
      set(newValue) {
        // this 指向组件实例
        const parts = newValue.split('（')
        this.lastName = parts[0].charAt(0)
        this.firstName = parts[0].slice(1)
      }
    }
  }
}
```

### 2.4 watch 中的 this

`watch` 的回调函数中，`this` 指向组件实例。

```js
export default {
  data() {
    return {
      keyword: '',
      results: [],
      userInfo: {
        name: '',
        age: 0
      }
    }
  },
  watch: {
    // 普通监听
    keyword(newVal, oldVal) {
      // this 指向组件实例
      console.log(`关键词从 "${oldVal}" 变为 "${newVal}"`)
      this.search(newVal)
    },

    // 深度监听对象
    userInfo: {
      handler(newVal) {
        // this 指向组件实例
        console.log('用户信息变化', newVal)
        this.saveUser()
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    search(keyword) { /* ... */ },
    saveUser() { /* ... */ }
  }
}
```

---

## 3. 生命周期钩子中的 this

所有生命周期钩子中的 `this` 都指向当前组件实例，但不同阶段可访问的内容不同。

```js
export default {
  data() {
    return { message: 'Hello' }
  },

  beforeCreate() {
    // 最早的钩子，data 和 methods 尚未初始化
    console.log(this.message) // undefined
    console.log(this.$el)     // undefined
  },

  created() {
    // data、methods、computed、watch 已初始化
    // DOM 尚未挂载
    console.log(this.message) // 'Hello'  ✓
    console.log(this.$el)     // undefined
    // 适合：发起网络请求、初始化数据
    this.fetchData()
  },

  beforeMount() {
    // 模板编译完成，即将挂载 DOM
    console.log(this.$el)     // 虚拟 DOM，尚未真实挂载
  },

  mounted() {
    // DOM 已挂载完成
    console.log(this.$el)     // 真实 DOM 元素  ✓
    // 适合：操作 DOM、初始化第三方库
    this.$el.querySelector('input').focus()
  },

  beforeUpdate() {
    // 数据变化，DOM 更新前
    console.log('更新前:', this.message)
  },

  updated() {
    // DOM 已更新完成
    console.log('更新后:', this.message)
    // 注意：不要在这里修改响应式数据，会导致无限循环
  },

  beforeDestroy() {
    // 组件即将销毁，实例仍然完整
    // 适合：清除定时器、取消订阅、移除事件监听
    clearInterval(this.timer)
    this.socket.disconnect()
  },

  destroyed() {
    // 组件已销毁，所有子组件也已销毁
    console.log('组件已销毁')
  },

  methods: {
    fetchData() {
      // this 正常指向实例
      console.log(this.message)
    }
  }
}
```

### 生命周期 this 可用性一览

| 钩子 | data/methods | $el（DOM）| 说明 |
|------|-------------|-----------|------|
| beforeCreate | ✗ | ✗ | 实例刚创建 |
| created | ✓ | ✗ | 数据已就绪，无 DOM |
| beforeMount | ✓ | ✗（虚拟）| 即将挂载 |
| mounted | ✓ | ✓ | DOM 已就绪 |
| beforeUpdate | ✓ | ✓（旧）| 数据变，DOM 未更新 |
| updated | ✓ | ✓（新）| DOM 已更新 |
| beforeDestroy | ✓ | ✓ | 清理资源的最佳时机 |
| destroyed | ✗ | ✗ | 已销毁 |

---

## 4. 箭头函数导致 this 丢失

这是 Vue2 中最常见的错误之一。箭头函数没有自己的 `this`，它会捕获定义时所在作用域的 `this`，而不是 Vue 实例。

### 4.1 methods 中使用箭头函数（错误）

```js
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    // 错误：箭头函数，this 不是 Vue 实例
    increment: () => {
      console.log(this) // undefined 或 window（严格模式下为 undefined）
      this.count++      // 报错！
    },

    // 正确：普通函数
    increment() {
      console.log(this) // Vue 实例
      this.count++      // 正常工作
    }
  }
}
```

### 4.2 computed 中使用箭头函数（错误）

```js
export default {
  data() {
    return { firstName: '三', lastName: '张' }
  },
  computed: {
    // 错误
    fullName: () => {
      return this.lastName + this.firstName // this 不是 Vue 实例
    },

    // 正确
    fullName() {
      return this.lastName + this.firstName
    }
  }
}
```

### 4.3 watch 中使用箭头函数（错误）

```js
export default {
  data() {
    return { keyword: '' }
  },
  watch: {
    // 错误
    keyword: (newVal) => {
      this.search(newVal) // this 不是 Vue 实例，报错
    },

    // 正确
    keyword(newVal) {
      this.search(newVal)
    }
  }
}
```

### 4.4 生命周期钩子中使用箭头函数（错误）

```js
export default {
  // 错误：生命周期钩子不能用箭头函数
  created: () => {
    console.log(this) // undefined
    this.fetchData()  // 报错
  },

  // 正确
  created() {
    console.log(this) // Vue 实例
    this.fetchData()
  }
}
```

### 4.5 箭头函数的正确使用场景

箭头函数在 Vue2 中并非完全禁止，在 methods 内部的回调中反而很有用：

```js
export default {
  data() {
    return { items: [1, 2, 3], result: [] }
  },
  methods: {
    processItems() {
      // 这里的 this 是 Vue 实例（普通函数）
      // 内部的箭头函数可以正确捕获外层的 this
      this.result = this.items
        .filter(item => item > 1)       // 箭头函数，this 来自外层
        .map(item => item * 2)          // 箭头函数，this 来自外层

      // 等价于：
      const self = this
      this.result = this.items
        .filter(function(item) {
          return item > self.someThreshold // 需要用 self
        })
    },

    fetchData() {
      // Promise 链中使用箭头函数，this 正确指向 Vue 实例
      fetch('/api/data')
        .then(res => res.json())
        .then(data => {
          this.items = data // 正确，this 来自 fetchData 的作用域
        })
        .catch(err => {
          this.error = err.message // 正确
        })
    }
  }
}
```

---

## 5. 事件处理中的 this

### 5.1 模板内联事件

```html
<template>
  <div>
    <!-- 内联语句：this 指向组件实例 -->
    <button @click="count++">直接修改</button>

    <!-- 调用方法：Vue 自动绑定 this -->
    <button @click="increment">调用方法</button>

    <!-- 传参：使用箭头函数包裹，this 指向组件实例 -->
    <button @click="(e) => handleClick(e, 'extra')">传额外参数</button>

    <!-- 传参：使用 $event 获取原生事件对象 -->
    <button @click="handleClick($event, 'extra')">使用 $event</button>
  </div>
</template>

<script>
export default {
  d {
    return { count: 0 }
  },
  methods: {
    increment() {
      // this 正确指向组件实例
      this.count++
    },
    handleClick(event, extra) {
      // this 正确指向组件实例
      console.log(this.count, event, extra)
    }
  }
}
</script>
```

### 5.2 原生 DOM 事件监听中的 this

在 `mounted` 中手动添加原生事件监听时，需要注意 `this` 的绑定：

```js
export default {
  data() {
    return { scrollY: 0 }
  },
  mounted() {
    // 错误：普通函数，this 指向 window（非严格模式）
    window.addEventListener('scroll', function() {
      this.scrollY = window.scrollY // this 不是 Vue 实例！
    })

    // 正确方式一：箭头函数（推荐）
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY // this 来自 mounted 的作用域，是 Vue 实例
    })

    // 正确方式二：bind 绑定
    this.handleScroll = function() {
      this.scrollY = window.scrollY
    }.bind(this)
    window.addEventListener('scroll', this.handleScroll)

    // 正确方式三：保存引用（为了在 beforeDestroy 中移除）
    this._scrollHandler = () => {
      this.scrollY = window.scrollY
    }
    window.addEventListener('scroll', this._scrollHandler)
  },
  beforeDestroy() {
    // 记得移除事件监听，防止内存泄漏
    window.removeEventListener('scroll', this._scrollHandler)
  }
}
```

### 5.3 子组件事件中的 this

```html
<template>
  <child-component @custom-event="handleChildEvent" />
</template>

<script>
export default {
  methods: {
    handleChildEvent(payload) {
      // this 正确指向父组件实例
      console.log(this.$data)
      this.processPayload(payload)
    }
  }
}
</script>
```

---

## 6. 异步操作中保存 this

### 6.1 使用箭头函数（最推荐）

```js
export default {
  data() {
    return { users: [], loading: false, error: null }
  },
  methods: {
    // Promise + 箭头函数
    fetchUsers() {
      this.loading = true
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          this.users = data   // this 正确
          this.loading = false
        })
        .catch(err => {
          this.error = err.message // this 正确
          this.loading = false
        })
    },

    // async/await（推荐，最简洁）
    async fetchUsersAsync() {
      this.loading = true
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        this.users = data   // this 正确，async 函数内 this 绑定不变
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    }
  }
}
```

### 6.2 使用 self/that 保存 this（旧方式，了解即可）

```js
export default {
  data() {
    return { users: [] }
  },
  methods: {
    fetchUsers() {
      const self = this // 保存 this 引用

      // 在普通函数回调中使用 self
      fetch('/api/users')
        .then(function(res) {
          return res.json()
        })
        .then(function(data) {
          self.users = data // 使用 self 而非 this
        })
    }
  }
}
```

### 6.3 定时器中的 this

```js
export default {
  data() {
    return { count: 0, timer: null }
  },
  mounted() {
    // 错误：普通函数，this 不是 Vue 实例
    this.timer = setInterval(function() {
      this.count++ // 报错！this 是 window 或 undefined
    }, 1000)

    // 正确：箭头函数
    this.timer = setInterval(() => {
      this.count++ // this 正确指向 Vue 实例
    }, 1000)

    // 正确：bind
    this.timer = setInterval(function() {
      this.count++
    }.bind(this), 1000)
  },
  beforeDestroy() {
    // 必须清除定时器
    clearInterval(this.timer)
  }
}
```

### 6.4 axios 请求中的 this

```js
import axios from 'axios'

export default {
  data() {
    return { list: [], total: 0 }
  },
  methods: {
    async getList(page = 1) {
      try {
        const { data } = await axios.get('/api/list', {
          params: { page }
        })
        // async/await 中 this 始终正确
        this.list = data.items
        this.total = data.total
      } catch (error) {
        console.error(error)
      }
    },

    // 使用拦截器时注意：拦截器中的 this 不是组件实例
    setupInterceptor() {
      // 如果需要在拦截器中访问组件数据，需要提前保存引用
      const vm = this
      axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response.status === 401) {
            vm.$router.push('/login') // 使用 vm 而非 this
          }
          return Promise.reject(error)
        }
      )
    }
  }
}
```

---

## 7. 常见错误与解决方案

### 错误一：在 options 对象顶层使用箭头函数

```js
// 错误
export default {
  methods: {
    fetchData: async () => {
      // this 是 undefined，不是 Vue 实例
      const res = await fetch('/api/data')
      this.data = await res.json() // TypeError: Cannot set property 'data' of undefined
    }
  }
}

// 正确
export default {
  methods: {
    async fetchData() {
      const res = await fetch('/api/data')
      this.data = await res.json() // 正常工作
    }
  }
}
```

### 错误二：将方法赋值给变量后调用

```js
export default {
  data() {
    return { name: 'Vue' }
  },
  methods: {
    greet() {
      console.log(this.name)
    }
  },
  mounted() {
    // 错误：解构后 this 丢失
    const { greet } = this
    greet() // this.name 报错，this 不是 Vue 实例

    // 正确方式一：直接调用
    this.greet() // 正常

    // 正确方式二：bind
    const greetBound = this.greet.bind(this)
    greetBound() // 正常

    // 正确方式三：箭头函数包裹
    const greetArrow = () => this.greet()
    greetArrow() // 正常
  }
}
```

### 错误三：在 created 中操作 DOM

```js
export default {
  created() {
    // 错误：created 时 DOM 还未挂载
    const el = this.$el // undefined
    el.style.color = 'red' // TypeError: Cannot read property 'style' of undefined
  },

  mounted() {
    // 正确：mounted 时 DOM 已就绪
    this.$el.style.color = 'red' // 正常工作
    // 或者使用 $refs
    this.$refs.myDiv.style.color = 'red'
  }
}
```

### 错误四：在 updated 中修改响应式数据

```js
export default {
  data() {
    return { count: 0 }
  },
  updated() {
    // 错误：会导致无限循环更新
    this.count++ // 触发更新 -> updated -> count++ -> 触发更新 -> ...
  },

  // 正确：使用 watch 监听特定数据变化
  watch: {
    count(newVal) {
      if (newVal > 10) {
        // 有条件地修改，避免无限循环
        this.count = 0
      }
    }
  }
}
```

### 错误五：忘记在 beforeDestroy 中清理副作用

```js
// 错误：没有清理，导致内存泄漏和报错
export default {
  mounted() {
    this.timer = setInterval(() => {
      this.fetchData() // 组件销毁后仍然执行，可能报错
    }, 5000)

    window.addEventListener('resize', this.handleResize)
    this.$bus.$on('event', this.handleEvent)
  }
  // 没有 beforeDestroy 清理
}

// 正确
export default {
  mounted() {
    this.timer = setInterval(() => {
      this.fetchData()
    }, 5000)

    window.addEventListener('resize', this.handleResize)
    this.$bus.$on('event', this.handleEvent)
  },
  beforeDestroy() {
    clearInterval(this.timer)
    window.removeEventListener('resize', this.handleResize)
    this.$bus.$off('event', this.handleEvent)
  }
}
```

### 错误六：混淆组件实例和组件定义对象

```js
// 组件定义对象（options 对象）
const MyComponent = {
  data() { return { count: 0 } },
  methods: {
    increment() { this.count++ }
  }
}

// 组件实例（new Vue() 或 Vue.extend() 后的结果）
const vm = new Vue(MyComponent).$mount('#app')

// this 在 options 中指向实例（vm），不是定义对象（MyComponent）
// MyComponent.methods.increment() // 错误，this 不对
vm.increment() // 正确，this 是 vm
```

---

## 总结

| 场景 | this 指向 | 注意事项 |
|------|-----------|----------|
| data 函数 | Vue 实例 | 可访问 props，不建议调用 methods |
| methods 普通函数 | Vue 实例 | 不能用箭头函数定义 |
| computed getter/setter | Vue 实例 | 不能用箭头函数定义 |
| watch handler | Vue 实例 | 不能用箭头函数定义 |
| 生命周期钩子 | Vue 实例 | 不能用箭头函数定义 |
| 模板事件处理 | Vue 实例 | Vue 自动绑定 |
| 原生 DOM 回调（普通函数）| window/undefined | 需用箭头函数或 bind |
| setTimeout/setInterval（普通函数）| window/undefined | 需用箭头函数或 bind |
| Promise/async-await | 继承外层 this | 推荐 async/await |
| methods 内部的箭头函数 | 继承外层 this | 正确用法，可访问实例 |

**核心原则：**
- Vue2 options 对象的顶层属性（methods、computed、watch、生命周期）必须使用**普通函数**
- 在普通函数内部的回调中，优先使用**箭头函数**来保持 `this` 指向
- 遇到 `this` 相关报错，首先检查是否误用了箭头函数
