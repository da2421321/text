# 02 - 并发编程与JUC（零基础详解版）

> **本章目标**：理解多线程的概念，掌握线程池、锁、原子类、并发集合等核心工具  
> **预计耗时**：5~7 小时  
> **前置要求**：完成基础篇和异常处理

---

## 一、为什么后端必须懂并发？

### 1.1 生活类比

想象你开了一家火锅店：

```
单线程模式（只有1个服务员）：
  客人A点菜 → 服务员去厨房下单 → 等上菜 → 端给A → 才能接待客人B
  结果：客人B等了20分钟才被搭理，差评！

多线程模式（有5个服务员）：
  服务员1接待客人A → 同时 服务员2接待客人B → 同时 服务员3接待客人C
  结果：大家几乎同时被服务，好评！

线程池模式（固定5个服务员，排队叫号）：
  高峰期来了50个客人，5个服务员同时工作，其余客人排队等号
  不会因为客人太多而雇100个服务员（资源爆炸）
  也不会只有1个服务员（太慢）
```

### 1.2 后端服务的真实情况

当你的 Spring Boot 服务运行时：
- **每个 HTTP 请求** 都会分配一个线程来处理
- 如果同时有 100 个用户访问，就有 100 个线程在同时工作
- 如果线程之间共享数据（比如都在修改同一个库存数量），就会出问题

**不懂并发会导致什么？**
- 数据错乱：两个人同时买最后一件商品，库存变成 -1
- 程序卡死：死锁导致服务无响应
- 性能暴跌：线程创建太多，CPU 忙于切换线程而不是干活
- 内存爆炸：不用线程池，每个请求都创建新线程

---

## 二、线程基础

### 2.1 进程 vs 线程

```
进程（Process）：
├── 一个运行中的程序就是一个进程
├── 比如：Chrome 浏览器是一个进程，微信是另一个进程
└── 进程之间相互独立，内存不共享

线程（Thread）：
├── 一个进程内部可以有多个线程
├── 比如：Chrome 里每个标签页就是一个线程
├── 同一进程的线程之间共享内存（这就是并发问题的根源！）
└── 线程是 CPU 调度的最小单位
```

### 2.2 创建线程的三种方式

```java
// ========== 方式一：继承 Thread 类 ==========
class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " - " + i);
        }
    }
}

// ========== 方式二：实现 Runnable 接口（推荐）==========
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " - " + i);
        }
    }
}

// ========== 方式三：Lambda 表达式（最简洁）==========
public class ThreadDemo {
    public static void main(String[] args) {
        // 方式一
        MyThread t1 = new MyThread();
        t1.setName("线程A");
        t1.start(); // 注意是 start() 不是 run()！

        // 方式二
        Thread t2 = new Thread(new MyRunnable());
        t2.setName("线程B");
        t2.start();

        // 方式三（Lambda，最常用）
        Thread t3 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println(Thread.currentThread().getName() + " - " + i);
            }
        }, "线程C");
        t3.start();

        // 主线程也在运行
        System.out.println("主线程继续执行...");
    }
}
```

**常见坑**：
- 调用 `start()` 才会启动新线程！调用 `run()` 只是在当前线程执行方法，没有新线程
- 同一个 Thread 对象不能 `start()` 两次

### 2.3 线程的生命周期

```
新建(New) → start() → 就绪(Runnable) → 获得CPU → 运行(Running)
                           ↑                        │
                           │                        ↓
                           ← ← ← ← ← ← ← ← 阻塞(Blocked)
                                                    │ sleep/wait/IO
                                                    ↓
                                              等待(Waiting)
                                                    │
运行完毕 → 终止(Terminated)                          │ 被唤醒/超时
                                                    ↓
                                              就绪(Runnable)
```

---

## 三、并发的三大核心问题

### 3.1 可见性问题

```java
// 问题：一个线程修改了变量，另一个线程可能看不到最新值

public class VisibilityProblem {
    private static boolean running = true; // 没有 volatile

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            int count = 0;
            while (running) { // 可能永远看不到 running 变成 false！
                count++;
            }
            System.out.println("停止了，count = " + count);
        });

        worker.start();
        Thread.sleep(1000);
        running = false; // 主线程修改了 running
        System.out.println("已设置 running = false");
        // 但 worker 线程可能因为 CPU 缓存，一直读到的是 true
    }
}

/*
========== 详细解释：为什么 worker 线程看不到 running 变成 false？==========

1. 内存模型图解：
   ┌─────────────┐         ┌─────────────┐
   │  主线程      │         │ worker线程   │
   │             │         │             │
   │ CPU缓存A    │         │ CPU缓存B    │
   │ running=?   │         │ running=?   │
   └──────┬──────┘         └──────┬──────┘
          │                       │
          └───────┬───────────────┘
                  │
          ┌───────▼────────┐
          │   主内存        │
          │ running = true │
          └────────────────┘

2. 执行时间线：
   时刻1: 主内存中 running = true
   时刻2: worker线程启动，读取 running → 缓存到 CPU缓存B (值为 true)
   时刻3: worker线程在 while 循环中，一直读取 CPU缓存B 的值
          ⚠️ 关键：不再访问主内存！直接读缓存，速度快
   时刻4: 主线程执行 running = false → 先写入 CPU缓存A
   时刻5: 主线程的修改可能延迟一段时间才刷新到主内存
   时刻6: 即使刷新到主内存，worker线程的 CPU缓存B 也不会自动更新！
   
   结果：worker线程的 while(running) 一直读到的是缓存中的旧值 true

3. 为什么会这样？（CPU缓存机制）
   - 现代CPU为了提高性能，每个核心都有自己的缓存（L1/L2缓存）
   - 线程读取变量时，优先从自己的CPU缓存读取，而不是主内存
   - 这样速度快100倍以上！但会导致"缓存不一致"问题
   - 一个线程修改变量后，不会立即通知其他线程的缓存更新

4. 真实场景：
   - 单核CPU：问题可能不明显（因为只有一个缓存）
   - 多核CPU：这个问题几乎必现！（每个核心独立缓存）
   - JVM还可能做指令重排序优化，让问题更复杂

5. 实际运行结果：
   主线程输出：已设置 running = false
   worker线程：永远在循环，永远不会输出"停止了"
   程序：永远不会结束，必须强制终止（Ctrl+C）！

6. 类比生活场景：
   想象你和朋友各自在家看同一本书的复印件：
   - 主内存 = 图书馆的原书
   - CPU缓存 = 你们各自的复印件
   - 你在复印件上改了一个字 → 朋友的复印件不会自动更新
   - 除非你告诉图书馆更新原书，并通知朋友重新复印
   - volatile 就是这个"通知机制"！
*/
```

**解决方案**：用 `volatile` 关键字

```java
private static volatile boolean running = true; // 加上 volatile
// volatile 保证：一个线程修改后，其他线程立刻能看到最新值
```

### 3.2 原子性问题

```java
// 问题：i++ 不是原子操作！它实际上是三步：读 → 加1 → 写回

public class AtomicityProblem {
    private static int count = 0;

    public static void main(String[] args) throws InterruptedException {
        // 创建两个线程，各自给 count 加 10000 次
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) count++;
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) count++;
        });

        t1.start();
        t2.start();
        t1.join(); // 等待 t1 执行完
        t2.join(); // 等待 t2 执行完

        System.out.println("count = " + count);
        // 期望: 20000
        // 实际: 可能是 17325、18891 等随机值！
        // 因为两个线程同时读到同一个值，各自加1后写回，导致少加了
    }
}
```

### 3.3 有序性问题

编译器和 CPU 可能会对指令进行重排序以提高性能。在单线程中没问题，但在多线程中可能导致意想不到的结果。`volatile` 和 `synchronized` 都可以防止指令重排。

---

## 四、线程池（最最最重要！）

### 4.1 为什么用线程池？

```
❌ 不用线程池：
  每来一个请求就创建一个线程 → 请求结束就销毁
  问题：创建/销毁线程开销很大，1000个请求就创建1000个线程，系统崩溃

✅ 用线程池：
  提前创建固定数量的线程，放在"池子"里
  有任务来了 → 从池子里拿一个空闲线程去执行
  任务完成后 → 线程回到池子里等下一个任务
  好处：线程复用、数量可控、避免资源爆炸
```

### 4.2 Java 内置的线程池

```java
import java.util.concurrent.*;

public class ThreadPoolDemo {
    public static void main(String[] args) {
        // 创建一个固定大小为 3 的线程池
        ExecutorService pool = Executors.newFixedThreadPool(3);

        // 提交 10 个任务
        for (int i = 1; i <= 10; i++) {
            final int taskId = i;
            pool.submit(() -> {
                String threadName = Thread.currentThread().getName();
                System.out.printf("任务%d 开始，线程: %s%n", taskId, threadName);

                try {
                    Thread.sleep(1000); // 模拟耗时操作
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }

                System.out.printf("任务%d 完成，线程: %s%n", taskId, threadName);
            });
        }

        // 关闭线程池（不再接受新任务，等待已有任务完成）
        pool.shutdown();
    }
}

// 输出（3个线程轮流执行10个任务）：
// 任务1 开始，线程: pool-1-thread-1
// 任务2 开始，线程: pool-1-thread-2
// 任务3 开始，线程: pool-1-thread-3
// （1秒后）
// 任务1 完成，线程: pool-1-thread-1
// 任务4 开始，线程: pool-1-thread-1  ← 线程1空闲了，接手任务4
// ...
```

### 4.3 四种常用线程池

```java
// 1. 固定大小线程池 ⭐ 最常用
// 适用场景：处理已知并发量的任务
ExecutorService fixed = Executors.newFixedThreadPool(10);

// 2. 缓存线程池（线程数不固定，按需创建）
// 适用场景：大量短时间任务
// ⚠️ 小心：如果任务太多，会创建大量线程导致 OOM
ExecutorService cached = Executors.newCachedThreadPool();

// 3. 单线程池（只有1个线程，任务按顺序执行）
// 适用场景：需要保证任务按顺序执行
ExecutorService single = Executors.newSingleThreadExecutor();

// 4. 定时线程池（可以延迟或定期执行任务）
// 适用场景：定时任务、心跳检测
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(5);
// 延迟3秒执行
scheduled.schedule(() -> System.out.println("延迟执行"), 3, TimeUnit.SECONDS);
// 每5秒执行一次
scheduled.scheduleAtFixedRate(() -> System.out.println("定期执行"), 0, 5, TimeUnit.SECONDS);
```

### 4.4 手动创建线程池（生产推荐）

阿里巴巴 Java 开发规范要求：**不要用 Executors 快捷方法创建线程池**，而是手动 new ThreadPoolExecutor，这样可以明确每个参数。

```java
import java.util.concurrent.*;

// 手动创建线程池（生产环境推荐写法）
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5,                                   // 核心线程数：平时保持5个线程
    10,                                  // 最大线程数：高峰期最多10个线程
    60L,                                 // 空闲线程存活时间
    TimeUnit.SECONDS,                    // 时间单位
    new LinkedBlockingQueue<>(100),      // 等待队列：最多排队100个任务
    new ThreadFactory() {                // 线程工厂：给线程起名字（方便排查问题）
        private int count = 0;
        @Override
        public Thread newThread(Runnable r) {
            return new Thread(r, "order-pool-" + (++count));
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：队列满了怎么办
);
```

**线程池参数图解**：

```
任务进来
    │
    ▼
核心线程有空闲？ ──是──→ 核心线程处理
    │ 否
    ▼
等待队列没满？ ──是──→ 放入等待队列
    │ 否
    ▼
线程数 < 最大线程数？ ──是──→ 创建新线程处理
    │ 否
    ▼
执行拒绝策略（4种可选）：
├── AbortPolicy（默认）：直接抛异常
├── CallerRunsPolicy：调用者线程自己执行 ⭐ 推荐
├── DiscardPolicy：直接丢弃任务
└── DiscardOldestPolicy：丢弃队列中最老的任务
```

### 4.5 线程池参数估算

```
CPU 密集型任务（计算为主，如加密、排序）：
  核心线程数 = CPU 核数 + 1
  例：8核CPU → 核心线程数 = 9

IO 密集型任务（等待为主，如网络请求、数据库查询）：
  核心线程数 = CPU 核数 × 2
  例：8核CPU → 核心线程数 = 16

获取 CPU 核数：
  int cores = Runtime.getRuntime().availableProcessors();
```

---

## 五、synchronized 关键字

### 5.1 什么是 synchronized？

**synchronized = 给代码加锁**，同一时刻只有一个线程能执行被锁住的代码。

```
没有锁：
  线程A: 读余额(100) → 扣50 → 写回(50)
  线程B: 读余额(100) → 扣30 → 写回(70)  ← 线程A的操作被覆盖了！
  最终余额: 70（实际应该是 20）

有锁（synchronized）：
  线程A: 【获得锁】读余额(100) → 扣50 → 写回(50)【释放锁】
  线程B: 【等待锁...】→ 【获得锁】读余额(50) → 扣30 → 写回(20)【释放锁】
  最终余额: 20 ✅
```

### 5.2 使用方式

```java
public class BankAccount {
    private double balance;

    public BankAccount(double balance) {
        this.balance = balance;
    }

    // 方式一：同步方法（锁的是 this 对象）
    public synchronized void withdraw(double amount) {
        if (balance >= amount) {
            System.out.printf("%s: 余额 %.2f，取款 %.2f%n",
                Thread.currentThread().getName(), balance, amount);

            try { Thread.sleep(100); } catch (InterruptedException e) {}

            balance -= amount;
            System.out.printf("%s: 取款成功，剩余 %.2f%n",
                Thread.currentThread().getName(), balance);
        } else {
            System.out.printf("%s: 余额不足！当前 %.2f，需要 %.2f%n",
                Thread.currentThread().getName(), balance, amount);
        }
    }

    // 方式二：同步代码块（更细粒度的锁）
    public void deposit(double amount) {
        // 只锁住关键的代码段，而不是整个方法
        synchronized (this) {
            balance += amount;
            System.out.printf("%s: 存款 %.2f，余额 %.2f%n",
                Thread.currentThread().getName(), amount, balance);
        }
    }

    public double getBalance() {
        return balance;
    }
}
```

```java
// 测试并发取款
public class Main {
    public static void main(String[] args) throws InterruptedException {
        BankAccount account = new BankAccount(1000);

        Thread t1 = new Thread(() -> account.withdraw(600), "张三");
        Thread t2 = new Thread(() -> account.withdraw(600), "李四");

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        System.out.println("最终余额: " + account.getBalance());
        // 有 synchronized：张三取600成功，李四余额不足 → 最终400
        // 没 synchronized：可能两个人都取了600 → 最终-200（数据错乱！）
    }
}
```

---

## 六、ReentrantLock（更灵活的锁）

### 6.1 synchronized vs ReentrantLock

| 对比项 | synchronized | ReentrantLock |
|--------|-------------|---------------|
| 使用方式 | 关键字，自动释放锁 | API，手动获取/释放锁 |
| 可中断 | 不可以 | 可以（lockInterruptibly） |
| 超时等待 | 不可以 | 可以（tryLock） |
| 公平锁 | 不支持 | 支持 |
| 条件变量 | 只有一个（wait/notify） | 可以有多个 Condition |

### 6.2 使用示例

```java
import java.util.concurrent.locks.ReentrantLock;

public class TicketSeller {
    private int tickets = 100;
    private final ReentrantLock lock = new ReentrantLock();

    public void sell() {
        lock.lock(); // 手动加锁
        try {
            if (tickets > 0) {
                tickets--;
                System.out.printf("%s 卖出1张票，剩余 %d 张%n",
                    Thread.currentThread().getName(), tickets);
            } else {
                System.out.println("票已售罄！");
            }
        } finally {
            lock.unlock(); // 必须在 finally 中释放锁！否则出异常就死锁了
        }
    }

    // tryLock：尝试获取锁，获取不到就放弃（不会一直等）
    public void trySell() {
        if (lock.tryLock()) {  // 尝试获取锁
            try {
                if (tickets > 0) {
                    tickets--;
                    System.out.printf("%s 卖出1张票，剩余 %d 张%n",
                        Thread.currentThread().getName(), tickets);
                }
            } finally {
                lock.unlock();
            }
        } else {
            System.out.println(Thread.currentThread().getName() + " 没抢到锁，下次再试");
        }
    }
}
```

---

## 七、原子类（AtomicXxx）

### 7.1 无锁的线程安全

原子类通过 CAS（Compare-And-Swap）实现线程安全，性能比 synchronized 更好。

```java
import java.util.concurrent.atomic.*;

public class AtomicDemo {
    // AtomicInteger：线程安全的 int
    private static AtomicInteger count = new AtomicInteger(0);

    public static void main(String[] args) throws InterruptedException {
        // 创建 10 个线程，每个加 1000 次
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 1000; j++) {
                    count.incrementAndGet(); // 原子性的 i++
                }
            });
            threads[i].start();
        }

        // 等待所有线程完成
        for (Thread t : threads) t.join();

        System.out.println("最终结果: " + count.get());
        // 一定是 10000！不会出现数据丢失
    }
}
```

### 7.2 常用原子类

```java
// AtomicInteger 常用方法
AtomicInteger ai = new AtomicInteger(0);
ai.get();                    // 获取值: 0
ai.set(10);                  // 设置值
ai.incrementAndGet();        // ++i（先加后取）: 11
ai.getAndIncrement();        // i++（先取后加）: 11（返回11，值变为12）
ai.addAndGet(5);             // i += 5: 17
ai.compareAndSet(17, 20);    // 如果当前值是17，就设为20（CAS操作）

// AtomicLong - 线程安全的 long
AtomicLong al = new AtomicLong(0L);

// AtomicBoolean - 线程安全的 boolean
AtomicBoolean flag = new AtomicBoolean(false);
flag.compareAndSet(false, true); // CAS：如果是false就设为true

// AtomicReference - 线程安全的对象引用
AtomicReference<String> ref = new AtomicReference<>("hello");
ref.compareAndSet("hello", "world");
```

---

## 八、并发集合

### 8.1 为什么普通集合不安全？

```java
// ❌ ArrayList 不是线程安全的
List<String> list = new ArrayList<>();

// 多个线程同时往里面添加元素
// 可能导致：数据丢失、数组越界、ConcurrentModificationException
```

### 8.2 线程安全的集合

```java
import java.util.concurrent.*;

// ========== ConcurrentHashMap ⭐ 最常用 ==========
// 线程安全的 HashMap，性能远高于 Hashtable
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.put("a", 1);
map.get("a");
map.putIfAbsent("b", 2);      // 如果 key 不存在才放入
map.computeIfAbsent("c", k -> 3); // 如果 key 不存在，计算后放入

// ========== CopyOnWriteArrayList ==========
// 线程安全的 ArrayList，读多写少场景用
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
list.add("hello");

// ========== BlockingQueue（阻塞队列）==========
// 生产者-消费者模式的核心
BlockingQueue<String> queue = new LinkedBlockingQueue<>(100);
queue.put("任务1");     // 队列满时会阻塞等待
queue.take();           // 队列空时会阻塞等待

// ========== ConcurrentLinkedQueue ==========
// 非阻塞的线程安全队列
ConcurrentLinkedQueue<String> cQueue = new ConcurrentLinkedQueue<>();
cQueue.offer("item");
cQueue.poll();
```

---

## 九、Future 和 CompletableFuture

### 9.1 Future：获取异步执行的结果

```java
import java.util.concurrent.*;

public class FutureDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);

        // submit 返回 Future，可以获取任务的返回值
        Future<String> future = pool.submit(() -> {
            Thread.sleep(2000); // 模拟耗时操作
            return "任务执行完毕！";
        });

        System.out.println("主线程继续做其他事...");
        System.out.println("等待任务结果...");

        // get() 会阻塞，直到任务完成并返回结果
        String result = future.get(); // 最多等到任务完成
        // 也可以设置超时：future.get(3, TimeUnit.SECONDS);

        System.out.println("结果: " + result);

        pool.shutdown();
    }
}
```

### 9.2 CompletableFuture：更强大的异步编程

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureDemo {
    public static void main(String[] args) {

        // 异步执行一个任务
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("步骤1: 查询用户信息...");
            sleep(1000);
            return "用户张三";
        });

        // 链式处理（类似 JavaScript 的 Promise.then）
        CompletableFuture<String> result = future
            .thenApply(user -> {
                System.out.println("步骤2: 查询 " + user + " 的订单...");
                sleep(1000);
                return user + " 的订单: iPhone 15";
            })
            .thenApply(order -> {
                System.out.println("步骤3: 生成发货单...");
                sleep(500);
                return "发货单: " + order;
            });

        // 获取最终结果
        System.out.println("最终结果: " + result.join());
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
}

// 输出：
// 步骤1: 查询用户信息...
// 步骤2: 查询 用户张三 的订单...
// 步骤3: 生成发货单...
// 最终结果: 发货单: 用户张三 的订单: iPhone 15
```

### 9.3 并行执行多个任务

```java
// 场景：同时查询用户信息、订单信息、推荐商品（互不依赖）
public class ParallelDemo {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();

        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "用户: 张三";
        });

        CompletableFuture<String> orderFuture = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "订单: 3笔";
        });

        CompletableFuture<String> recommendFuture = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "推荐: iPhone, iPad";
        });

        // 等待所有任务完成
        CompletableFuture.allOf(userFuture, orderFuture, recommendFuture).join();

        // 获取结果
        System.out.println(userFuture.join());
        System.out.println(orderFuture.join());
        System.out.println(recommendFuture.join());

        long cost = System.currentTimeMillis() - start;
        System.out.println("总耗时: " + cost + "ms");
        // 串行执行需要 1000+1500+800 = 3300ms
        // 并行执行只需要约 1500ms（取最慢的那个）⭐
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) {}
    }
}
```

### 9.4 异常处理

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) throw new RuntimeException("出错了！");
    return "OK";
})
.exceptionally(ex -> {
    // 相当于 Promise 的 catch
    System.out.println("捕获异常: " + ex.getMessage());
    return "默认值";
})
.thenApply(result -> {
    System.out.println("继续处理: " + result);
    return result;
});

System.out.println(future.join()); // 默认值
```

---

## 十、CountDownLatch 和 Semaphore

### 10.1 CountDownLatch（倒计时器）

**场景**：等待多个线程都完成后，再执行后续操作。

```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchDemo {
    public static void main(String[] args) throws InterruptedException {
        // 想象一个赛跑：3个选手都准备好才能开始

        int playerCount = 3;
        CountDownLatch latch = new CountDownLatch(playerCount); // 计数器初始值为3

        for (int i = 1; i <= playerCount; i++) {
            final int playerId = i;
            new Thread(() -> {
                try {
                    int prepareTime = (int) (Math.random() * 3000);
                    Thread.sleep(prepareTime);
                    System.out.printf("选手%d 准备好了！(用时 %dms)%n", playerId, prepareTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    latch.countDown(); // 计数器减1
                }
            }).start();
        }

        System.out.println("等待所有选手准备...");
        latch.await(); // 阻塞，直到计数器变为0
        System.out.println("所有选手准备好了，比赛开始！🏁");
    }
}
```

### 10.2 Semaphore（信号量）

**场景**：限制同时访问某个资源的线程数量。

```java
import java.util.concurrent.Semaphore;

public class SemaphoreDemo {
    public static void main(String[] args) {
        // 停车场只有3个车位
        Semaphore parking = new Semaphore(3);

        // 10辆车想要停车
        for (int i = 1; i <= 10; i++) {
            final int carId = i;
            new Thread(() -> {
                try {
                    System.out.println("车" + carId + " 想要停车...");
                    parking.acquire(); // 获取一个许可（车位），没有就等着

                    System.out.println("车" + carId + " 停好了 ✅ (剩余车位: " +
                        parking.availablePermits() + ")");
                    Thread.sleep((long) (Math.random() * 3000)); // 停一会儿

                    System.out.println("车" + carId + " 开走了 🚗");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    parking.release(); // 释放一个许可（腾出车位）
                }
            }).start();
        }
    }
}
```

---

## 十一、Spring Boot 中的线程池配置

### 11.1 配置异步支持

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync // 开启异步支持
public class AsyncConfig {

    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);                // 核心线程数
        executor.setMaxPoolSize(10);                // 最大线程数
        executor.setQueueCapacity(200);             // 等待队列容量
        executor.setKeepAliveSeconds(60);           // 空闲线程存活时间
        executor.setThreadNamePrefix("async-");     // 线程名前缀
        executor.setRejectedExecutionHandler(       // 拒绝策略
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
        executor.setWaitForTasksToCompleteOnShutdown(true); // 优雅关闭
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
```

### 11.2 使用 @Async 注解

```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    // 加上 @Async，这个方法会在线程池中异步执行
    // 调用者不需要等待邮件发送完毕
    @Async("taskExecutor")
    public void sendEmail(String to, String subject, String content) {
        System.out.println("开始发送邮件给 " + to + "，线程: " +
            Thread.currentThread().getName());

        try {
            Thread.sleep(3000); // 模拟发送耗时
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("邮件发送成功: " + to);
    }

    // 有返回值的异步方法
    @Async("taskExecutor")
    public CompletableFuture<String> sendEmailWithResult(String to) {
        // ... 发送邮件
        return CompletableFuture.completedFuture("邮件已发送给 " + to);
    }
}
```

```java
// Controller 中使用
@RestController
public class UserController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public Result<String> register(@RequestBody UserDTO dto) {
        // 1. 保存用户（同步）
        userService.save(dto);

        // 2. 发送欢迎邮件（异步，不阻塞注册流程）
        emailService.sendEmail(dto.getEmail(), "欢迎注册", "...");

        // 3. 立即返回（不用等邮件发完）
        return Result.success("注册成功");
    }
}
```

---

## 十二、常见并发问题及解决方案

### 12.1 死锁

```java
// 死锁示例：两个线程互相等对方释放锁

Object lockA = new Object();
Object lockB = new Object();

// 线程1：先拿A，再拿B
new Thread(() -> {
    synchronized (lockA) {
        System.out.println("线程1: 拿到了锁A");
        try { Thread.sleep(100); } catch (Exception e) {}
        synchronized (lockB) {                    // 等线程2释放锁B
            System.out.println("线程1: 拿到了锁B");
        }
    }
}).start();

// 线程2：先拿B，再拿A
new Thread(() -> {
    synchronized (lockB) {
        System.out.println("线程2: 拿到了锁B");
        try { Thread.sleep(100); } catch (Exception e) {}
        synchronized (lockA) {                    // 等线程1释放锁A
            System.out.println("线程2: 拿到了锁A");
        }
    }
}).start();

// 结果：两个线程互相等待，永远卡住！💀
```

**避免死锁的方法**：
1. 统一加锁顺序：所有线程都先拿 A 再拿 B
2. 使用 `tryLock` 设置超时，获取不到就放弃
3. 尽量减少锁的范围和持有时间

### 12.2 快速参考表

| 场景 | 推荐方案 |
|------|---------|
| 简单计数器 | `AtomicInteger` / `AtomicLong` |
| 线程安全的 Map | `ConcurrentHashMap` |
| 保护一段代码 | `synchronized` 或 `ReentrantLock` |
| 异步执行任务 | 线程池 + `CompletableFuture` |
| 等待多个任务完成 | `CountDownLatch` |
| 限制并发数 | `Semaphore` |
| Spring 异步 | `@Async` + 线程池配置 |
| 生产者消费者 | `BlockingQueue` |

---

## 十三、练习题

### 练习1：模拟秒杀

100个线程同时抢购10件商品，用 `AtomicInteger` + 线程池实现，保证不会超卖。

### 练习2：并行数据聚合

模拟一个商品详情页，需要同时查询：商品信息（1秒）、评论（1.5秒）、推荐（0.8秒），用 `CompletableFuture` 并行查询，总耗时不超过2秒。

### 练习3：限流器

用 `Semaphore` 实现一个简单的限流器：同一时刻最多允许5个请求访问某个接口。

---

## 十四、本章总结

| 知识点 | 掌握程度 | 一句话总结 |
|--------|---------|-----------|
| 线程创建 | ⭐⭐ 了解 | 推荐 Lambda + Thread 或直接用线程池 |
| 线程池 | ⭐⭐⭐ 必须 | 永远不要手动 new Thread，用线程池 |
| synchronized | ⭐⭐⭐ 必须 | 最简单的锁，自动释放 |
| ReentrantLock | ⭐⭐ 重要 | 更灵活的锁，支持超时和中断 |
| AtomicInteger | ⭐⭐⭐ 必须 | 无锁计数器，性能好 |
| ConcurrentHashMap | ⭐⭐⭐ 必须 | 线程安全的 Map |
| CompletableFuture | ⭐⭐⭐ 必须 | 异步编程，并行执行任务 |
| CountDownLatch | ⭐⭐ 重要 | 等待多个线程完成 |
| Semaphore | ⭐⭐ 重要 | 限制并发数 |
| @Async | ⭐⭐⭐ 必须 | Spring Boot 异步方法 |

---

> 下一章：[01-SpringBoot框架搭建REST接口](../03-实战篇/01-SpringBoot框架搭建REST接口.md)
