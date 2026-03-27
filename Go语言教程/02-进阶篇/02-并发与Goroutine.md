# 进阶二：并发编程与 Goroutine

> 本章目标：掌握 Go 的并发编程核心——goroutine 和 channel，理解并发控制的常用模式。

## 前置知识

学习本章前，你需要掌握：
- 函数（基础篇第四章）
- 错误处理（基础篇第九章）
- 指针（进阶篇第一章）

## 1. 什么是并发？

### 生活中的并发

想象你在做早餐：
- **串行做法**：先烧水（3分钟）→ 再煎蛋（2分钟）→ 再烤面包（2分钟）= **7 分钟**
- **并发做法**：同时烧水、煎蛋、烤面包 = **3 分钟**

这就是并发的价值——**同时做多件事，节省总时间**。

### 程序中的并发

一个 Web 服务器需要同时处理成百上千个用户请求，如果排队一个一个处理，用户会等到崩溃。并发让程序能"同时"处理多个任务。

```
串行：  请求1 ████████  请求2 ████████  请求3 ████████
并发：  请求1 ████████
        请求2 ████████
        请求3 ████████
```

## 2. Goroutine：轻量级的"线程"

Go 中启动并发任务极其简单，只需要在函数调用前加一个 `go` 关键字：

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(name string) {
    for i := 0; i < 3; i++ {
        fmt.Printf("%s: 第 %d 次打招呼\n", name, i+1)
        time.Sleep(500 * time.Millisecond)
    }
}

func main() {
    // 启动两个 goroutine
    go sayHello("张三")
    go sayHello("李四")

    // 主 goroutine 等待一会（后面会学更好的等待方式）
    time.Sleep(2 * time.Second)
    fmt.Println("程序结束")
}
```

可能的输出（顺序可能不同）：
```
张三: 第 1 次打招呼
李四: 第 1 次打招呼
张三: 第 2 次打招呼
李四: 第 2 次打招呼
张三: 第 3 次打招呼
李四: 第 3 次打招呼
程序结束
```

### Goroutine 的特点

- **极其轻量**：一个 goroutine 只需约 2KB 内存（操作系统线程需要约 1MB）
- **启动极快**：创建百万个 goroutine 都没问题
- **由 Go 运行时调度**：不需要你手动管理

### 重要警告：主 goroutine 结束 = 程序结束

```go
func main() {
    go fmt.Println("你好")  // 可能来不及执行
    // main 立即结束，整个程序退出
}
```

`main()` 函数就是"主 goroutine"。它一旦返回，所有其他 goroutine 都会被强制终止。所以我们需要一种方式来"等待" goroutine 完成。

## 3. WaitGroup：等待所有 goroutine 完成

`sync.WaitGroup` 是最常用的等待方式：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()  // 完成时通知 WaitGroup（计数器减 1）

    fmt.Printf("Worker %d 开始工作\n", id)
    time.Sleep(time.Duration(id) * 500 * time.Millisecond)
    fmt.Printf("Worker %d 完成工作\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)           // 每启动一个 goroutine，计数器加 1
        go worker(i, &wg)   // 注意：必须传指针！
    }

    wg.Wait()  // 阻塞，直到计数器归零
    fmt.Println("所有 Worker 都完成了！")
}
```

WaitGroup 的三个方法：
- `Add(n)` — 计数器加 n（启动 goroutine 前调用）
- `Done()` — 计数器减 1（goroutine 完成时调用，通常用 defer）
- `Wait()` — 阻塞等待，直到计数器变为 0

### 常见错误

```go
// 错误 1：传值而不是传指针
go worker(i, wg)    // 错！wg 被复制了，Done() 减的是副本的计数器
go worker(i, &wg)   // 对！传指针

// 错误 2：Add 放在 go 语句后面
go func() {
    wg.Add(1)  // 错！可能 Wait() 已经检查过了
    defer wg.Done()
    // ...
}()
// 正确做法：Add 放在 go 之前
wg.Add(1)
go func() {
    defer wg.Done()
    // ...
}()
```

## 4. Channel：goroutine 之间的通信

goroutine 之间怎么传递数据？用 **channel（通道）**。

Go 的并发哲学：

> **不要通过共享内存来通信，而应该通过通信来共享内存。**

### 创建和使用 channel

```go
// 创建一个传递 string 类型的 channel
ch := make(chan string)

// 发送数据到 channel（用 <-）
ch <- "hello"

// 从 channel 接收数据
msg := <-ch
```

### 完整示例

```go
package main

import "fmt"

func greet(ch chan string) {
    ch <- "你好，我是 goroutine！"  // 发送消息
}

func main() {
    ch := make(chan string)  // 创建通道

    go greet(ch)             // 启动 goroutine

    msg := <-ch              // 接收消息（会阻塞，直到有数据）
    fmt.Println(msg)         // 你好，我是 goroutine！
}
```

### channel 的阻塞特性

无缓冲 channel 有一个重要特性：**发送和接收必须配对**。

- 发送方会阻塞，直到有人接收
- 接收方会阻塞，直到有人发送

```go
ch := make(chan int)

// 这会死锁！因为没人接收
// ch <- 1  // 永远阻塞

// 正确：在另一个 goroutine 中发送
go func() {
    ch <- 42
}()
value := <-ch  // 等待并接收
fmt.Println(value) // 42
```

### 实际应用：并发请求

```go
package main

import (
    "fmt"
    "time"
)

func fetchURL(url string, ch chan string) {
    time.Sleep(1 * time.Second) // 模拟网络请求
    ch <- fmt.Sprintf("[%s] 数据加载完成", url)
}

func main() {
    ch := make(chan string)
    urls := []string{"api/users", "api/products", "api/orders"}

    start := time.Now()

    for _, url := range urls {
        go fetchURL(url, ch)
    }

    // 接收所有结果
    for range urls {
        fmt.Println(<-ch)
    }

    fmt.Printf("总耗时：%v\n", time.Since(start))
    // 约 1 秒（并发执行），而不是 3 秒（串行执行）
}
```

**实际输出：**
```
[api/users] 数据加载完成
[api/orders] 数据加载完成
[api/products] 数据加载完成
总耗时：1.0008419s
```

> 注意：由于并发执行，三个 URL 的输出顺序可能每次都不同，但总耗时始终约为 1 秒。

## 5. 带缓冲的 Channel

无缓冲 channel 要求发送和接收同时就绪。带缓冲 channel 允许"暂存"一些数据：

```go
// 创建容量为 3 的带缓冲 channel
ch := make(chan int, 3)

// 可以连续发送 3 个值，不会阻塞
ch <- 1
ch <- 2
ch <- 3
// ch <- 4  // 这会阻塞！缓冲区已满

fmt.Println(<-ch) // 1
fmt.Println(<-ch) // 2
fmt.Println(<-ch) // 3
```

类比：
- 无缓冲 channel = 面对面交接（双方必须同时在场）
- 带缓冲 channel = 快递柜（可以先放进去，对方稍后取）

### 使用场景

```go
// 用带缓冲 channel 作为任务队列
jobs := make(chan int, 10)

// 生产者：放入任务
go func() {
    for i := 1; i <= 20; i++ {
        jobs <- i
        fmt.Println("放入任务：", i)
    }
    close(jobs) // 关闭通道，告诉消费者没有更多任务了
}()

// 消费者：处理任务
for job := range jobs {  // range 会在通道关闭后自动退出
    fmt.Println("处理任务：", job)
}
```

### close 和 range

- `close(ch)` — 关闭通道（只有发送方才应该关闭）
- `for v := range ch` — 持续接收直到通道关闭

```go
ch := make(chan int, 5)

go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)  // 发送完毕，关闭通道
}()

// range 自动接收直到通道关闭
for v := range ch {
    fmt.Println(v)
}
// 输出：0 1 2 3 4
```

## 6. select：多通道监听

`select` 可以同时等待多个 channel，哪个先有数据就处理哪个：

```go
select {
case msg := <-ch1:
    fmt.Println("从 ch1 收到：", msg)
case msg := <-ch2:
    fmt.Println("从 ch2 收到：", msg)
case ch3 <- "hello":
    fmt.Println("向 ch3 发送了消息")
default:
    fmt.Println("没有任何 channel 就绪")
}
```

### 超时控制

避免永远等待某个 channel：

```go
ch := make(chan string)

go func() {
    time.Sleep(3 * time.Second)
    ch <- "完成"
}()

select {
case result := <-ch:
    fmt.Println("收到结果：", result)
case <-time.After(2 * time.Second):
    fmt.Println("超时了！等了 2 秒没有结果")
}
// 输出：超时了！等了 2 秒没有结果
```

### 非阻塞发送/接收

用 `default` 分支实现非阻塞操作：

```go
ch := make(chan int, 1)

// 非阻塞发送
select {
case ch <- 42:
    fmt.Println("发送成功")
default:
    fmt.Println("通道已满，放弃发送")
}

// 非阻塞接收
select {
case v := <-ch:
    fmt.Println("收到：", v)
default:
    fmt.Println("通道为空，没有数据")
}
```

## 7. Context：取消和超时控制

在实际的企业级代码中，用 `context` 来控制 goroutine 的取消和超时：

### 超时 context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func slowOperation(ctx context.Context) (string, error) {
    select {
    case <-time.After(3 * time.Second):
        return "操作完成", nil
    case <-ctx.Done():
        return "", ctx.Err() // 返回取消原因
    }
}

func main() {
    // 创建 1 秒超时的 context
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()  // 确保资源释放

    result, err := slowOperation(ctx)
    if err != nil {
        fmt.Println("失败：", err) // 失败：context deadline exceeded
    } else {
        fmt.Println("成功：", result)
    }
}
```

### 手动取消 context

```go
ctx, cancel := context.WithCancel(context.Background())

go func() {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("收到取消信号，退出")
            return
        default:
            fmt.Println("工作中...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}()

time.Sleep(2 * time.Second)
cancel()  // 发送取消信号
time.Sleep(1 * time.Second)
```

### context 的传递链

在实际项目中，context 从 HTTP 请求处理器一层层往下传递：

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()  // 从请求中获取 context
    result, err := queryDatabase(ctx)
    // ...
}

func queryDatabase(ctx context.Context) (string, error) {
    // 如果请求被取消，数据库查询也会终止
    select {
    case <-ctx.Done():
        return "", ctx.Err()
    case result := <-doQuery():
        return result, nil
    }
}
```

## 8. 数据竞争与互斥锁（Mutex）

当多个 goroutine 同时读写同一个变量时，会产生**数据竞争**：

### 问题演示

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++  // 多个 goroutine 同时修改 counter
        }()
    }

    wg.Wait()
    fmt.Println("最终值：", counter) // 不一定是 1000！可能是 987、995 等
}
```

为什么？因为 `counter++` 不是"原子操作"，它实际上是：
1. 读取 counter 的值
2. 加 1
3. 写回 counter

两个 goroutine 可能同时读到旧值，然后各自加 1 写回，导致只增加了 1 而不是 2。

### 解决方案 1：Mutex（互斥锁）

```go
var (
    counter int
    mu      sync.Mutex
    wg      sync.WaitGroup
)

func increment() {
    defer wg.Done()
    mu.Lock()    // 加锁：同一时间只有一个 goroutine 能进入
    counter++
    mu.Unlock()  // 解锁：其他 goroutine 可以进入了
}

func main() {
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go increment()
    }
    wg.Wait()
    fmt.Println("最终值：", counter) // 一定是 1000
}
```

### 解决方案 2：RWMutex（读写锁）

当"读多写少"时，用 `RWMutex` 性能更好：

```go
var (
    data   map[string]string
    rwLock sync.RWMutex
)

func read(key string) string {
    rwLock.RLock()         // 读锁（多个 goroutine 可以同时读）
    defer rwLock.RUnlock()
    return data[key]
}

func write(key, value string) {
    rwLock.Lock()          // 写锁（独占，其他读写都要等）
    defer rwLock.Unlock()
    data[key] = value
}
```

### 解决方案 3：用 channel 代替锁

```go
func main() {
    counter := 0
    ch := make(chan int, 1000)

    for i := 0; i < 1000; i++ {
        go func() {
            ch <- 1
        }()
    }

    for i := 0; i < 1000; i++ {
        counter += <-ch
    }
    fmt.Println("最终值：", counter) // 1000
}
```

### 检测数据竞争

Go 提供了内置的竞态检测工具：

```bash
go run -race main.go
go test -race ./...
```

加 `-race` 后，如果有数据竞争，会打印详细警告。**建议测试时始终加上 `-race`**。

## 9. 并发模式：Worker Pool

处理大量任务时，常用 Worker Pool 模式：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- string, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        time.Sleep(500 * time.Millisecond) // 模拟处理
        results <- fmt.Sprintf("Worker %d 处理了任务 %d", id, job)
    }
}

func main() {
    const numWorkers = 3
    const numJobs = 10

    jobs := make(chan int, numJobs)
    results := make(chan string, numJobs)

    var wg sync.WaitGroup

    // 启动 Worker
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // 发送任务
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // 等待所有 Worker 完成后关闭结果通道
    go func() {
        wg.Wait()
        close(results)
    }()

    // 收集结果
    for result := range results {
        fmt.Println(result)
    }
}
```

这个模式在实际项目中非常常用，比如并发处理数据库查询、文件处理、API 调用等。

## 10. 本章小结

| 概念 | 说明 | 示例 |
|------|------|------|
| goroutine | 轻量级并发单元 | `go func() { ... }()` |
| WaitGroup | 等待多个 goroutine 完成 | `wg.Add(1)`, `wg.Done()`, `wg.Wait()` |
| channel | goroutine 间的通信管道 | `ch := make(chan int)` |
| 带缓冲 channel | 可暂存数据的通道 | `ch := make(chan int, 10)` |
| select | 多通道监听 | `select { case <-ch1: ... }` |
| context | 超时和取消控制 | `ctx, cancel := context.WithTimeout(...)` |
| Mutex | 互斥锁，防止数据竞争 | `mu.Lock()`, `mu.Unlock()` |
| `-race` 标志 | 检测数据竞争 | `go run -race main.go` |

### 并发编程的核心原则

1. **启动 goroutine 时就要想好它怎么结束**
2. **用 WaitGroup 管收尾，channel 管通信，context 管超时取消**
3. **有共享可变状态就要考虑锁或用 channel 代替**
4. **测试时加 `-race` 检测竞态**

## 11. 练习题

1. **并发下载**：模拟 5 个文件并发下载（用 Sleep 模拟耗时），用 WaitGroup 等待全部完成，打印总耗时
2. **生产者消费者**：用 channel 实现生产者-消费者模式——一个 goroutine 生产 1-20 的数字，另一个计算它们的平方并打印
3. **超时控制**：写一个函数模拟数据库查询（Sleep 3秒），用 context 设置 1 秒超时，观察超时后的行为
4. **安全计数器**：用 Mutex 实现一个线程安全的计数器结构体，支持 `Increment()`、`Decrement()` 和 `Value()` 方法
5. **Worker Pool**：实现一个 Worker Pool，用 3 个 Worker 并发处理 20 个任务，每个任务是计算一个数的阶乘

---

## 12. 练习题答案

### 练习1：并发下载

模拟 5 个文件并发下载，用 WaitGroup 等待全部完成，打印总耗时。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func downloadFile(filename string, wg *sync.WaitGroup) {
	defer wg.Done()
	
	fmt.Printf("开始下载：%s\n", filename)
	// 模拟下载耗时（随机 1-3 秒）
	time.Sleep(time.Duration(1+len(filename)%3) * time.Second)
	fmt.Printf("下载完成：%s\n", filename)
}

func main() {
	files := []string{"file1.zip", "file2.pdf", "file3.mp4", "file4.jpg", "file5.txt"}
	var wg sync.WaitGroup
	
	start := time.Now()
	
	for _, file := range files {
		wg.Add(1)
		go downloadFile(file, &wg)
	}
	
	wg.Wait()
	
	fmt.Printf("\n所有文件下载完成！总耗时：%v\n", time.Since(start))
}
```

**输出示例：**
```
开始下载：file1.zip
开始下载：file2.pdf
开始下载：file3.mp4
开始下载：file4.jpg
开始下载：file5.txt
下载完成：file1.zip
下载完成：file4.jpg
下载完成：file2.pdf
下载完成：file5.txt
下载完成：file3.mp4

所有文件下载完成！总耗时：3.0012345s
```

---

### 练习2：生产者消费者

用 channel 实现生产者-消费者模式——一个 goroutine 生产 1-20 的数字，另一个计算它们的平方并打印。

```go
package main

import (
	"fmt"
	"time"
)

// 生产者：生成 1-20 的数字
func producer(ch chan<- int) {
	for i := 1; i <= 20; i++ {
		fmt.Printf("生产：%d\n", i)
		ch <- i
		time.Sleep(100 * time.Millisecond) // 模拟生产耗时
	}
	close(ch) // 生产完毕，关闭通道
}

// 消费者：计算平方并打印
func consumer(ch <-chan int) {
	for num := range ch { // range 会在通道关闭后自动退出
		square := num * num
		fmt.Printf("  消费：%d，平方 = %d\n", num, square)
		time.Sleep(150 * time.Millisecond) // 模拟消费耗时
	}
	fmt.Println("消费者完成工作")
}

func main() {
	ch := make(chan int, 5) // 带缓冲，避免生产者阻塞太久
	
	go producer(ch)
	consumer(ch) // 主 goroutine 作为消费者
	
	fmt.Println("程序结束")
}
```

**输出示例：**
```
生产：1
生产：2
  消费：1，平方 = 1
生产：3
生产：4
  消费：2，平方 = 4
生产：5
  消费：3，平方 = 9
...
生产：20
  消费：20，平方 = 400
消费者完成工作
程序结束
```

---

### 练习3：超时控制

写一个函数模拟数据库查询（Sleep 3秒），用 context 设置 1 秒超时，观察超时后的行为。

```go
package main

import (
	"context"
	"fmt"
	"time"
)

// 模拟数据库查询
func queryDatabase(ctx context.Context, query string) (string, error) {
	// 创建一个结果通道
	resultCh := make(chan string, 1)
	
	// 启动查询 goroutine
	go func() {
		fmt.Println("开始执行查询...")
		time.Sleep(3 * time.Second) // 模拟慢查询
		resultCh <- "查询结果：100 条记录"
	}()
	
	// 等待结果或超时
	select {
	case result := <-resultCh:
		return result, nil
	case <-ctx.Done():
		return "", ctx.Err() // 返回超时错误
	}
}

func main() {
	// 场景1：1秒超时（会超时）
	fmt.Println("=== 场景1：1秒超时 ===")
	ctx1, cancel1 := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel1()
	
	start1 := time.Now()
	result1, err1 := queryDatabase(ctx1, "SELECT * FROM users")
	if err1 != nil {
		fmt.Printf("查询失败：%v（耗时：%v）\n", err1, time.Since(start1))
	} else {
		fmt.Printf("查询成功：%s\n", result1)
	}
	
	time.Sleep(3 * time.Second) // 等待后台 goroutine 完成
	
	// 场景2：5秒超时（不会超时）
	fmt.Println("\n=== 场景2：5秒超时 ===")
	ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel2()
	
	start2 := time.Now()
	result2, err2 := queryDatabase(ctx2, "SELECT * FROM users")
	if err2 != nil {
		fmt.Printf("查询失败：%v\n", err2)
	} else {
		fmt.Printf("查询成功：%s（耗时：%v）\n", result2, time.Since(start2))
	}
}
```

**输出示例：**
```
=== 场景1：1秒超时 ===
开始执行查询...
查询失败：context deadline exceeded（耗时：1.0005s）

=== 场景2：5秒超时 ===
开始执行查询...
查询成功：查询结果：100 条记录（耗时：3.0008s）
```

---

### 练习4：安全计数器

用 Mutex 实现一个线程安全的计数器结构体，支持 `Increment()`、`Decrement()` 和 `Value()` 方法。

```go
package main

import (
	"fmt"
	"sync"
)

// SafeCounter 线程安全的计数器
type SafeCounter struct {
	mu    sync.Mutex
	value int
}

// Increment 增加计数
func (c *SafeCounter) Increment() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value++
}

// Decrement 减少计数
func (c *SafeCounter) Decrement() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.value--
}

// Value 获取当前值
func (c *SafeCounter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.value
}

func main() {
	counter := &SafeCounter{}
	var wg sync.WaitGroup
	
	// 启动 100 个 goroutine，每个增加 10 次
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 10; j++ {
				counter.Increment()
			}
		}()
	}
	
	// 启动 50 个 goroutine，每个减少 10 次
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 10; j++ {
				counter.Decrement()
			}
		}()
	}
	
	wg.Wait()
	
	// 预期结果：100*10 - 50*10 = 500
	fmt.Printf("最终计数：%d（预期：500）\n", counter.Value())
}
```

**输出示例：**
```
最终计数：500（预期：500）
```

**不使用 Mutex 的错误示例：**
```go
// 错误：没有锁保护
type UnsafeCounter struct {
	value int
}

func (c *UnsafeCounter) Increment() {
	c.value++ // 数据竞争！
}

// 运行 go run -race main.go 会报错
```

---

### 练习5：Worker Pool

实现一个 Worker Pool，用 3 个 Worker 并发处理 20 个任务，每个任务是计算一个数的阶乘。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// 计算阶乘
func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result
}

// Worker 函数
func worker(id int, jobs <-chan int, results chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	
	for job := range jobs {
		fmt.Printf("Worker %d 开始处理任务 %d\n", id, job)
		time.Sleep(500 * time.Millisecond) // 模拟计算耗时
		
		result := factorial(job)
		output := fmt.Sprintf("Worker %d: %d! = %d", id, job, result)
		results <- output
	}
	
	fmt.Printf("Worker %d 完成所有任务\n", id)
}

func main() {
	const numWorkers = 3
	const numJobs = 20
	
	jobs := make(chan int, numJobs)
	results := make(chan string, numJobs)
	var wg sync.WaitGroup
	
	start := time.Now()
	
	// 启动 Worker Pool
	fmt.Println("启动 Worker Pool...")
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}
	
	// 发送任务
	fmt.Println("发送任务...")
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs) // 所有任务发送完毕
	
	// 等待所有 Worker 完成后关闭结果通道
	go func() {
		wg.Wait()
		close(results)
	}()
	
	// 收集并打印结果
	fmt.Println("\n=== 处理结果 ===")
	for result := range results {
		fmt.Println(result)
	}
	
	fmt.Printf("\n总耗时：%v\n", time.Since(start))
	fmt.Printf("如果串行执行需要：%v\n", time.Duration(numJobs)*500*time.Millisecond)
}
```

**输出示例：**
```
启动 Worker Pool...
发送任务...
Worker 1 开始处理任务 1
Worker 2 开始处理任务 2
Worker 3 开始处理任务 3
Worker 1 开始处理任务 4
Worker 2 开始处理任务 5
...

=== 处理结果 ===
Worker 1: 1! = 1
Worker 2: 2! = 2
Worker 3: 3! = 6
Worker 1: 4! = 24
Worker 2: 5! = 120
...
Worker 3: 20! = 2432902008176640000
Worker 1 完成所有任务
Worker 2 完成所有任务
Worker 3 完成所有任务

总耗时：3.5s
如果串行执行需要：10s
```

---

### 练习知识点总结

| 练习 | 核心知识点 | 关键代码 |
|------|-----------|---------|
| 1. 并发下载 | WaitGroup | `wg.Add(1)`, `wg.Done()`, `wg.Wait()` |
| 2. 生产者消费者 | Channel, close, range | `close(ch)`, `for v := range ch` |
| 3. 超时控制 | Context, select | `context.WithTimeout()`, `ctx.Done()` |
| 4. 安全计数器 | Mutex | `mu.Lock()`, `defer mu.Unlock()` |
| 5. Worker Pool | 综合应用 | Channel + WaitGroup + Goroutine |

### 运行建议

```bash
# 检测数据竞争
go run -race main.go

# 查看 goroutine 调度
GODEBUG=schedtrace=1000 go run main.go
```

> 恭喜你完成了进阶篇！接下来请进入 [实战篇 — Gin 框架搭建 REST 接口](../03-实战篇/01-Gin框架搭建REST接口.md)
