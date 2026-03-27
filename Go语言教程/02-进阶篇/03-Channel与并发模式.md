# 进阶三：Channel 深入与并发模式

> **本章目标**
> - 理解 Channel 的工作原理和使用场景
> - 掌握有缓冲和无缓冲 Channel 的区别
> - 学会使用 select 进行多路复用
> - 掌握常用的并发模式（Worker Pool、Fan-out/Fan-in、Pipeline）
> - 学会使用 context 包控制并发
> - 了解并发安全的常用工具
> - 避免常见的并发陷阱

## 前置知识

在学习本章之前，你需要：
- 掌握 Goroutine 的基本使用
- 理解并发和并行的概念
- 熟悉 Go 的基本语法

---

## 1. Channel 是什么

### 生活类比

想象一下工厂的传送带：
- **传送带**就是 Channel，用来传递物品（数据）
- **工人 A** 把产品放到传送带上（发送数据）
- **工人 B** 从传送带上取走产品（接收数据）
- 如果传送带满了，工人 A 必须等待
- 如果传送带空了，工人 B 必须等待

这就是 Channel 的核心思想：**通过通信来共享内存，而不是通过共享内存来通信**。

### 为什么需要 Channel

```go
package main

import (
	"fmt"
	"time"
)

// 不使用 Channel 的问题示例
var result int

func calculate() {
	time.Sleep(time.Second)
	result = 42 // 直接修改共享变量，可能有并发问题
}

func main() {
	go calculate()
	time.Sleep(2 * time.Second) // 不优雅的等待方式
	fmt.Println(result)
}
```

使用 Channel 的优雅方式：

```go
package main

import (
	"fmt"
	"time"
)

func calculate(ch chan int) {
	time.Sleep(time.Second)
	ch <- 42 // 发送结果到 channel
}

func main() {
	ch := make(chan int)
	go calculate(ch)
	result := <-ch // 阻塞等待结果
	fmt.Println(result) // 输出: 42
}
```

---

## 2. 创建和使用 Channel

### 无缓冲 Channel

无缓冲 Channel 就像一个没有容量的传送带，必须有人接收才能发送。

```go
package main

import "fmt"

func main() {
	// 创建无缓冲 channel
	ch := make(chan string)

	// 启动接收者
	go func() {
		msg := <-ch // 接收数据
		fmt.Println("收到:", msg)
	}()

	// 发送数据
	ch <- "Hello" // 会阻塞，直到有人接收
	fmt.Println("发送完成")
}
```

### 发送和接收操作

```go
package main

import "fmt"

func main() {
	ch := make(chan int)

	// 发送者
	go func() {
		for i := 1; i <= 5; i++ {
			ch <- i // 发送数据
			fmt.Printf("发送: %d\n", i)
		}
		close(ch) // 关闭 channel
	}()

	// 接收者
	for num := range ch { // 循环接收，直到 channel 关闭
		fmt.Printf("接收: %d\n", num)
	}
}
```

### 死锁示例

```go
package main

func main() {
	ch := make(chan int)
	ch <- 1 // 死锁！没有接收者，发送会永久阻塞
	// fatal error: all goroutines are asleep - deadlock!
}
```

---

## 3. 有缓冲 Channel

### 什么是缓冲区

有缓冲 Channel 就像有容量的传送带，可以暂存数据。

```go
package main

import "fmt"

func main() {
	// 创建容量为 3 的缓冲 channel
	ch := make(chan int, 3)

	// 可以连续发送 3 个数据而不阻塞
	ch <- 1
	ch <- 2
	ch <- 3
	fmt.Println("发送了 3 个数据")

	// 接收数据
	fmt.Println(<-ch) // 1
	fmt.Println(<-ch) // 2
	fmt.Println(<-ch) // 3
}
```

### 缓冲区满了会怎样

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan int, 2) // 容量为 2

	ch <- 1
	ch <- 2
	fmt.Println("发送了 2 个数据")

	// 第 3 个会阻塞，直到有人接收
	go func() {
		time.Sleep(time.Second)
		fmt.Println("接收:", <-ch)
	}()

	ch <- 3 // 阻塞 1 秒
	fmt.Println("发送了第 3 个数据")
}
```

### 什么时候用有缓冲 Channel

```go
package main

import (
	"fmt"
	"time"
)

// 场景：生产者比消费者快
func producer(ch chan int) {
	for i := 1; i <= 10; i++ {
		ch <- i
		fmt.Printf("生产: %d\n", i)
	}
	close(ch)
}

func consumer(ch chan int) {
	for num := range ch {
		time.Sleep(500 * time.Millisecond) // 消费慢
		fmt.Printf("消费: %d\n", num)
	}
}

func main() {
	ch := make(chan int, 5) // 缓冲区可以平滑速度差异
	go producer(ch)
	consumer(ch)
}
```

---

## 4. Channel 方向

### 只读和只写 Channel

```go
package main

import "fmt"

// 只能发送的 channel
func send(ch chan<- int) {
	ch <- 42
	// num := <-ch // 编译错误：不能从只写 channel 接收
}

// 只能接收的 channel
func receive(ch <-chan int) {
	num := <-ch
	fmt.Println(num)
	// ch <- 1 // 编译错误：不能向只读 channel 发送
}

func main() {
	ch := make(chan int)
	go send(ch)
	receive(ch)
}
```

**输出**：
```
42
```

**执行流程**：
```
时间轴：
0ms   主 goroutine: ch := make(chan int)
      主 goroutine: go send(ch)  ← 启动 goroutine
      主 goroutine: receive(ch)  ← 执行接收函数
      
      receive 函数中：
      num := <-ch  ← 【阻塞】等待接收数据
      
      send goroutine 中：
      ch <- 42  ← 【握手】发送 42
      
1ms   【握手成功】
      send goroutine: 发送完成，函数结束
      receive 函数: 接收到 42
      fmt.Println(num)  ← 打印 42
      receive 函数结束
      
      主 goroutine 结束
```
```

### 实际应用

```go
package main

import "fmt"

func producer(out chan<- int) {
	for i := 1; i <= 5; i++ {
		out <- i
	}
	close(out)
}

func consumer(in <-chan int) {
	for num := range in {
		fmt.Println("处理:", num)
	}
}

func main() {
	ch := make(chan int)
	go producer(ch)
	consumer(ch)
}
```

---

## 5. select 多路复用

### 基本用法

select 就像一个多路开关，可以同时监听多个 channel。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)

	go func() {
		time.Sleep(1 * time.Second)
		ch1 <- "来自 ch1"
	}()

	go func() {
		time.Sleep(2 * time.Second)
		ch2 <- "来自 ch2"
	}()

	// 哪个 channel 先准备好就处理哪个
	for i := 0; i < 2; i++ {
		select {
		case msg1 := <-ch1:
			fmt.Println(msg1)
		case msg2 := <-ch2:
			fmt.Println(msg2)
		}
	}
}
```

### 超时控制

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan string)

	go func() {
		time.Sleep(2 * time.Second)
		ch <- "数据到了"
	}()

	select {
	case msg := <-ch:
		fmt.Println(msg)
	case <-time.After(1 * time.Second):
		fmt.Println("超时了！")
	}
}
```

### default 分支

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch := make(chan int, 1)

	// 非阻塞发送
	select {
	case ch <- 1:
		fmt.Println("发送成功")
	default:
		fmt.Println("channel 满了，不等待")
	}

	// 非阻塞接收
	select {
	case num := <-ch:
		fmt.Println("接收:", num)
	default:
		fmt.Println("channel 空了，不等待")
	}
}
```

### 实际应用：心跳检测

```go
package main

import (
	"fmt"
	"time"
)

func worker(done chan bool) {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			fmt.Println("工作中...")
		case <-done:
			fmt.Println("收到停止信号")
			return
		}
	}
}

func main() {
	done := make(chan bool)
	go worker(done)

	time.Sleep(2 * time.Second)
	done <- true
	time.Sleep(time.Second)
}
```

---

## 6. 常用并发模式

### Worker Pool（工作池）

多个 worker 并发处理任务队列。

```go
package main

import (
	"fmt"
	"time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
	for job := range jobs {
		fmt.Printf("Worker %d 开始处理任务 %d\n", id, job)
		time.Sleep(time.Second) // 模拟耗时操作
		results <- job * 2
	}
}

func main() {
	jobs := make(chan int, 10)
	results := make(chan int, 10)

	// 启动 3 个 worker
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}

	// 发送 5 个任务
	for j := 1; j <= 5; j++ {
		jobs <- j
	}
	close(jobs)

	// 收集结果
	for a := 1; a <= 5; a++ {
		fmt.Println("结果:", <-results)
	}
}
```

### Fan-out / Fan-in（扇出扇入）

一个输入分发给多个处理者，再汇总结果。

```go
package main

import (
	"fmt"
	"sync"
)

// 数据源
func generator(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}

// 处理器（Fan-out）
func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()
	return out
}

// 合并结果（Fan-in）
func merge(channels ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup

	for _, ch := range channels {
		wg.Add(1)
		go func(c <-chan int) {
			defer wg.Done()
			for n := range c {
				out <- n
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

func main() {
	in := generator(1, 2, 3, 4, 5)

	// Fan-out: 启动多个 worker
	c1 := square(in)
	c2 := square(in)

	// Fan-in: 合并结果
	for n := range merge(c1, c2) {
		fmt.Println(n)
	}
}
```

### Pipeline（流水线）

数据经过多个阶段处理。

```go
package main

import "fmt"

// 阶段 1：生成数字
func generate(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}

// 阶段 2：平方
func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()
	return out
}

// 阶段 3：过滤偶数
func filterEven(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			if n%2 == 0 {
				out <- n
			}
		}
		close(out)
	}()
	return out
}

func main() {
	// 构建流水线
	nums := generate(1, 2, 3, 4, 5)
	squared := square(nums)
	filtered := filterEven(squared)

	// 输出结果
	for n := range filtered {
		fmt.Println(n) // 4, 16
	}
}
```

---

## 7. context 包

### 为什么需要 context

context 用于在 goroutine 之间传递取消信号、超时控制和请求范围的数据。

### WithCancel：手动取消

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, name string) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("%s 收到取消信号: %v\n", name, ctx.Err())
			return
		default:
			fmt.Printf("%s 工作中...\n", name)
			time.Sleep(500 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	go worker(ctx, "Worker-1")
	go worker(ctx, "Worker-2")

	time.Sleep(2 * time.Second)
	fmt.Println("发送取消信号")
	cancel() // 取消所有 worker

	time.Sleep(time.Second)
}
```

### WithTimeout：超时控制

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func slowOperation(ctx context.Context) error {
	done := make(chan bool)

	go func() {
		time.Sleep(3 * time.Second) // 模拟耗时操作
		done <- true
	}()

	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := slowOperation(ctx)
	if err != nil {
		fmt.Println("操作失败:", err) // context deadline exceeded
	} else {
		fmt.Println("操作成功")
	}
}
```

### WithDeadline：截止时间

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	deadline := time.Now().Add(2 * time.Second)
	ctx, cancel := context.WithDeadline(context.Background(), deadline)
	defer cancel()

	select {
	case <-time.After(3 * time.Second):
		fmt.Println("任务完成")
	case <-ctx.Done():
		fmt.Println("超过截止时间:", ctx.Err())
	}
}
```

### WithValue：传递数据

```go
package main

import (
	"context"
	"fmt"
)

type key string

func process(ctx context.Context) {
	if userID, ok := ctx.Value(key("userID")).(int); ok {
		fmt.Printf("处理用户 %d 的请求\n", userID)
	}

	if requestID, ok := ctx.Value(key("requestID")).(string); ok {
		fmt.Printf("请求 ID: %s\n", requestID)
	}
}

func main() {
	ctx := context.Background()
	ctx = context.WithValue(ctx, key("userID"), 123)
	ctx = context.WithValue(ctx, key("requestID"), "abc-456")

	process(ctx)
}
```

### 实际应用：HTTP 请求超时

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func fetchData(ctx context.Context, url string) (string, error) {
	result := make(chan string)

	go func() {
		time.Sleep(2 * time.Second) // 模拟网络请求
		result <- "数据内容"
	}()

	select {
	case data := <-result:
		return data, nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	data, err := fetchData(ctx, "https://example.com")
	if err != nil {
		fmt.Println("请求失败:", err)
	} else {
		fmt.Println("获取数据:", data)
	}
}
```

---

## 8. 并发安全

### sync.Mutex：互斥锁

```go
package main

import (
	"fmt"
	"sync"
)

type Counter struct {
	mu    sync.Mutex
	value int
}

func (c *Counter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value++
}

func (c *Counter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}

func main() {
	counter := &Counter{}
	var wg sync.WaitGroup

	// 启动 1000 个 goroutine
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}

	wg.Wait()
	fmt.Println("最终值:", counter.Value()) // 1000
}
```

### sync.RWMutex：读写锁

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Cache struct {
	mu   sync.RWMutex
	data map[string]string
}

func (c *Cache) Get(key string) string {
	c.mu.RLock() // 读锁
	defer c.mu.RUnlock()
	return c.data[key]
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock() // 写锁
	defer c.mu.Unlock()
	c.data[key] = value
}

func main() {
	cache := &Cache{data: make(map[string]string)}
	var wg sync.WaitGroup

	// 10 个读者
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 5; j++ {
				fmt.Printf("读者 %d: %s\n", id, cache.Get("key"))
				time.Sleep(10 * time.Millisecond)
			}
		}(i)
	}

	// 1 个写者
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 5; i++ {
			cache.Set("key", fmt.Sprintf("value-%d", i))
			time.Sleep(50 * time.Millisecond)
		}
	}()

	wg.Wait()
}
```

### sync.Once：只执行一次

```go
package main

import (
	"fmt"
	"sync"
)

var (
	instance *Database
	once     sync.Once
)

type Database struct {
	name string
}

func GetInstance() *Database {
	once.Do(func() {
		fmt.Println("初始化数据库连接...")
		instance = &Database{name: "MySQL"}
	})
	return instance
}

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			db := GetInstance()
			fmt.Printf("Goroutine %d 获取实例: %s\n", id, db.name)
		}(i)
	}

	wg.Wait()
	// "初始化数据库连接..." 只会打印一次
}
```

### sync.Map：并发安全的 Map

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var sm sync.Map
	var wg sync.WaitGroup

	// 并发写入
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			sm.Store(id, id*10)
		}(i)
	}

	wg.Wait()

	// 读取
	sm.Range(func(key, value interface{}) bool {
		fmt.Printf("Key: %v, Value: %v\n", key, value)
		return true
	})

	// 加载
	if val, ok := sm.Load(5); ok {
		fmt.Println("Key 5 的值:", val)
	}

	// 删除
	sm.Delete(5)
}
```

---

## 9. 常见坑与最佳实践

### 死锁场景

#### 场景 1：忘记接收

```go
package main

func main() {
	ch := make(chan int)
	ch <- 1 // 死锁！没有接收者
}
```

**解决方案**：使用 goroutine 或有缓冲 channel

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 1) // 有缓冲
	ch <- 1
	fmt.Println(<-ch)
}
```

#### 场景 2：循环依赖

```go
package main

func main() {
	ch1 := make(chan int)
	ch2 := make(chan int)

	go func() {
		ch1 <- <-ch2 // 等待 ch2
	}()

	ch2 <- <-ch1 // 等待 ch1，死锁！
}
```

#### 场景 3：忘记关闭 channel

```go
package main

import "fmt"

func main() {
	ch := make(chan int)

	go func() {
		for i := 1; i <= 3; i++ {
			ch <- i
		}
		// 忘记 close(ch)
	}()

	for num := range ch { // 永远不会结束
		fmt.Println(num)
	}
}
```

**解决方案**：记得关闭 channel

```go
package main

import "fmt"

func main() {
	ch := make(chan int)

	go func() {
		for i := 1; i <= 3; i++ {
			ch <- i
		}
		close(ch) // 关闭 channel
	}()

	for num := range ch {
		fmt.Println(num)
	}
}
```

### Goroutine 泄漏

#### 场景：goroutine 永远阻塞

```go
package main

import (
	"fmt"
	"time"
)

func leak() {
	ch := make(chan int)

	go func() {
		val := <-ch // 永远阻塞，goroutine 泄漏
		fmt.Println(val)
	}()

	// 没有向 ch 发送数据
}

func main() {
	leak()
	time.Sleep(time.Second)
	fmt.Println("程序结束，但 goroutine 还在等待")
}
```

**解决方案**：使用 context 或超时

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func noLeak(ctx context.Context) {
	ch := make(chan int)

	go func() {
		select {
		case val := <-ch:
			fmt.Println(val)
		case <-ctx.Done():
			fmt.Println("goroutine 退出")
			return
		}
	}()
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	noLeak(ctx)
	time.Sleep(2 * time.Second)
}
```

### Channel 关闭原则

1. **不要在接收端关闭 channel**
2. **不要关闭已关闭的 channel**（会 panic）
3. **不要向已关闭的 channel 发送数据**（会 panic）

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	close(ch)

	// 可以继续接收
	fmt.Println(<-ch) // 1
	fmt.Println(<-ch) // 2
	fmt.Println(<-ch) // 0（零值）

	// 检查 channel 是否关闭
	val, ok := <-ch
	if !ok {
		fmt.Println("channel 已关闭")
	}
}
```

### 最佳实践

1. **谁创建 channel，谁负责关闭**
2. **使用 defer 确保资源释放**
3. **避免共享内存，使用 channel 通信**
4. **使用 context 控制 goroutine 生命周期**
5. **限制 goroutine 数量（使用 Worker Pool）**

```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// 优雅的并发模式
func process(ctx context.Context, data []int) <-chan int {
	out := make(chan int)

	go func() {
		defer close(out) // 确保关闭

		for _, num := range data {
			select {
			case <-ctx.Done():
				return // 响应取消
			case out <- num * 2:
			}
		}
	}()

	return out
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	data := []int{1, 2, 3, 4, 5}
	results := process(ctx, data)

	for result := range results {
		fmt.Println(result)
	}
}
```

---

## 10. 练习题

### 练习 1：并发下载器

实现一个并发下载器，同时下载多个文件，并显示进度。

**要求**：
- 使用 Worker Pool 模式
- 限制并发数为 3
- 模拟下载耗时（使用 time.Sleep）
- 统计总耗时

```go
package main

import (
	"fmt"
	"time"
)

// 提示：定义任务结构
type Task struct {
	ID  int
	URL string
}

// 提示：实现 worker 函数
func worker(id int, tasks <-chan Task, results chan<- string) {
	// 你的代码
}

func main() {
	// 你的代码
}
```

### 练习 2：超时重试

实现一个带超时和重试机制的函数。

**要求**：
- 最多重试 3 次
- 每次超时时间 1 秒
- 如果成功则立即返回
- 使用 context 控制超时

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// 模拟不稳定的操作
func unstableOperation() error {
	// 30% 概率成功
	if time.Now().Unix()%3 == 0 {
		return nil
	}
	return errors.New("操作失败")
}

// 实现重试逻辑
func retryWithTimeout(maxRetries int, timeout time.Duration) error {
	// 你的代码
	return nil
}

func main() {
	err := retryWithTimeout(3, time.Second)
	if err != nil {
		fmt.Println("最终失败:", err)
	} else {
		fmt.Println("操作成功")
	}
}
```

### 练习 3：生产者-消费者

实现一个生产者-消费者模型。

**要求**：
- 2 个生产者，每个生产 10 个数据
- 3 个消费者，处理数据（计算平方）
- 使用有缓冲 channel（容量 5）
- 所有数据处理完后程序退出

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func producer(id int, ch chan<- int, wg *sync.WaitGroup) {
	// 你的代码
}

func consumer(id int, ch <-chan int, wg *sync.WaitGroup) {
	// 你的代码
}

func main() {
	// 你的代码
}
```

### 练习 4：并发安全的计数器

实现一个线程安全的计数器，支持增加、减少和获取值。

**要求**：
- 使用 sync.Mutex 保证并发安全
- 实现 Increment、Decrement、Value 方法
- 启动 100 个 goroutine 测试

```go
package main

import (
	"fmt"
	"sync"
)

type SafeCounter struct {
	// 你的代码
}

func (c *SafeCounter) Increment() {
	// 你的代码
}

func (c *SafeCounter) Decrement() {
	// 你的代码
}

func (c *SafeCounter) Value() int {
	// 你的代码
	return 0
}

func main() {
	counter := &SafeCounter{}
	var wg sync.WaitGroup

	// 50 个增加
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}

	// 30 个减少
	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Decrement()
		}()
	}

	wg.Wait()
	fmt.Println("最终值:", counter.Value()) // 应该是 20
}
```

---

## 总结

本章我们学习了：

1. **Channel 基础**：无缓冲和有缓冲 channel 的区别
2. **select 多路复用**：同时监听多个 channel，实现超时控制
3. **并发模式**：Worker Pool、Fan-out/Fan-in、Pipeline
4. **context 包**：优雅地控制 goroutine 生命周期
5. **并发安全**：Mutex、RWMutex、Once、Map
6. **避免陷阱**：死锁、goroutine 泄漏、channel 关闭原则

记住 Go 的并发哲学：**不要通过共享内存来通信，而要通过通信来共享内存**。

下一章我们将学习 Go 的错误处理和测试。

