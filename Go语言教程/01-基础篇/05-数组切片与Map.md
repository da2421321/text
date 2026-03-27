# 第五章：数组、切片与 Map

> 本章目标：学会使用 Go 中的三种核心数据集合——数组（固定长度）、切片（动态长度）和 Map（键值对）。

## 5.1 为什么需要集合类型？

假设你要存储一个班级 50 个学生的成绩，不可能定义 50 个变量。这时候需要一种能存储**多个同类型数据**的"容器"。

Go 提供了三种主要的集合类型：

| 类型 | 特点 | 类比 |
|------|------|------|
| 数组 `[5]int` | 长度固定，不能增减 | 固定大小的格子 |
| 切片 `[]int` | 长度可变，能增删 | 可伸缩的列表 |
| Map `map[string]int` | 键值对 | 字典、通讯录 |

## 5.2 数组

### 声明和初始化

```go
// 声明一个长度为 5 的 int 数组（所有元素初始值为 0）
var scores [5]int
fmt.Println(scores) // [0 0 0 0 0]

// 声明并初始化
var names [3]string = [3]string{"张三", "李四", "王五"}

// 简写
colors := [3]string{"红", "绿", "蓝"}

// 让编译器自动计算长度
fruits := [...]string{"苹果", "香蕉", "橙子", "葡萄"}
fmt.Println(len(fruits)) // 4
```

### 访问和修改元素

数组的下标从 **0** 开始（不是从 1 开始）：

```go
fruits := [4]string{"苹果", "香蕉", "橙子", "葡萄"}

// 访问元素
fmt.Println(fruits[0]) // 苹果（第一个元素）
fmt.Println(fruits[1]) // 香蕉（第二个元素）
fmt.Println(fruits[3]) // 葡萄（第四个元素，也就是最后一个）

// 修改元素
fruits[1] = "芒果"
fmt.Println(fruits) // [苹果 芒果 橙子 葡萄]

// 越界访问会报错
// fmt.Println(fruits[4]) // panic: 数组只有 4 个元素，下标最大是 3
```

```
下标：  0      1      2      3
      ┌──────┬──────┬──────┬──────┐
      │ 苹果 │ 香蕉 │ 橙子 │ 葡萄 │
      └──────┴──────┴──────┴──────┘
```

### 遍历数组

```go
scores := [5]int{90, 85, 78, 92, 88}

// 方式一：普通 for 循环
for i := 0; i < len(scores); i++ {
    fmt.Printf("第 %d 个成绩：%d\n", i+1, scores[i])
}

// 方式二：for range（推荐）
for index, value := range scores {
    fmt.Printf("下标 %d：%d\n", index, value)
}

// 只需要值，不需要下标
for _, value := range scores {
    fmt.Println(value)
}
```

### 数组的局限性

数组长度**在声明时就固定了**，不能增减：

```go
arr := [3]int{1, 2, 3}
// arr = append(arr, 4) // 报错！数组不支持 append
```

而且，`[3]int` 和 `[5]int` 是**不同的类型**：

```go
var a [3]int
var b [5]int
// a = b // 报错！类型不同
```

这就是为什么我们更多使用**切片**。

## 5.3 切片（Slice）—— 最常用的集合类型

切片是 Go 中使用频率最高的数据结构。它像一个"可伸缩的数组"。

### 声明和初始化

```go
// 方式一：直接声明（推荐）
nums := []int{1, 2, 3, 4, 5}

// 方式二：声明空切片
var names []string                 // nil 切片
scores := []int{}                  // 空切片
cities := make([]string, 0)       // 用 make 创建空切片
teachers := make([]string, 3)     // 长度为 3 的切片（值为零值""）
students := make([]string, 0, 10) // 长度 0，但预留 10 个位置（容量）
```

切片和数组的区别：**切片声明时不写长度**。

```go
[5]int    // 这是数组（长度固定为 5）
[]int     // 这是切片（长度可变）
```

### 添加元素：append

```go
fruits := []string{"苹果", "香蕉"}
fmt.Println(fruits) // [苹果 香蕉]
fmt.Println(len(fruits)) // 2

// 添加一个元素
fruits = append(fruits, "橙子")
fmt.Println(fruits) // [苹果 香蕉 橙子]

// 一次添加多个元素
fruits = append(fruits, "葡萄", "西瓜")
fmt.Println(fruits) // [苹果 香蕉 橙子 葡萄 西瓜]
fmt.Println(len(fruits)) // 5
```

> **重要**：`append` 会返回一个新的切片，必须用变量接收：`fruits = append(fruits, "新元素")`

### 切片截取

可以从一个切片中"截取"一部分，生成新的切片：

```go
nums := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

a := nums[2:5]   // 从下标 2 到下标 4（不包括 5）
fmt.Println(a)    // [2 3 4]

b := nums[:3]    // 从开头到下标 2
fmt.Println(b)    // [0 1 2]

c := nums[7:]    // 从下标 7 到结尾
fmt.Println(c)    // [7 8 9]

d := nums[:]     // 完整复制
fmt.Println(d)    // [0 1 2 3 4 5 6 7 8 9]
```

记忆方法：`nums[起始:结束]`，**包含起始，不包含结束**。

### 删除元素

Go 没有直接的"删除"函数，但可以用切片拼接实现：

```go
nums := []int{1, 2, 3, 4, 5}

// 删除下标为 2 的元素（值为 3）
nums = append(nums[:2], nums[3:]...)
fmt.Println(nums) // [1 2 4 5]
```

原理：把下标 2 之前的部分 `[1, 2]` 和下标 2 之后的部分 `[4, 5]` 拼接起来。

### 遍历切片

和数组完全一样：

```go
fruits := []string{"苹果", "香蕉", "橙子"}

for index, value := range fruits {
    fmt.Printf("%d: %s\n", index, value)
}
// 0: 苹果
// 1: 香蕉
// 2: 橙子
```

### 长度和容量

- `len(s)` — 切片当前有多少个元素
- `cap(s)` — 切片底层数组能容纳多少个元素

```go
s := make([]int, 3, 10)
fmt.Println(len(s)) // 3（当前元素数）
fmt.Println(cap(s)) // 10（底层容量）

s = append(s, 1)
fmt.Println(len(s)) // 4
fmt.Println(cap(s)) // 10（还够用，容量不变）
```

日常开发中一般只关心 `len`，`cap` 在性能优化时才需要考虑。

### 切片是引用类型

修改切片的元素会影响到原始数据：

```go
original := []int{1, 2, 3, 4, 5}
sub := original[1:4]  // [2 3 4]

sub[0] = 999
fmt.Println(original) // [1 999 3 4 5]  ← 原始切片也被改了！
```

如果想要独立的副本，使用 `copy`：

```go
original := []int{1, 2, 3, 4, 5}
copySlice := make([]int, len(original))
copy(copySlice, original)

copySlice[0] = 999
fmt.Println(original)  // [1 2 3 4 5]  ← 不受影响
fmt.Println(copySlice) // [999 2 3 4 5]
```

## 5.4 Map（字典/映射）

Map 是**键值对**的集合。就像一本字典：通过"词条"（键）查找"释义"（值）。

### 声明和初始化

```go
// 方式一：直接初始化（推荐）
student := map[string]int{
    "语文": 90,
    "数学": 85,
    "英语": 92,
}

// 方式二：用 make 创建空 map
scores := make(map[string]int)

// 方式三：声明（nil map，不能直接写入）
var m map[string]int  // m 是 nil，不能直接赋值
```

格式：`map[键类型]值类型`

### 基本操作

```go
// 创建
user := map[string]string{
    "name": "张三",
    "city": "北京",
}

// 读取
fmt.Println(user["name"]) // 张三

// 添加/修改
user["age"] = "25"         // 添加新的键值对
user["city"] = "上海"      // 修改已有的值

// 删除
delete(user, "age")

// 获取长度
fmt.Println(len(user)) // 2
```

### 判断键是否存在

访问不存在的键不会报错，而是返回零值。这可能导致歧义：

```go
scores := map[string]int{
    "张三": 90,
    "李四": 0,  // 李四的分数确实是 0
}

fmt.Println(scores["张三"]) // 90
fmt.Println(scores["王五"]) // 0（王五不存在，返回 int 零值 0）
fmt.Println(scores["李四"]) // 0（李四存在，分数就是 0）
```

如何区分"值是0"和"键不存在"？用双返回值：

```go
value, exists := scores["王五"]
if exists {
    fmt.Println("王五的分数：", value)
} else {
    fmt.Println("王五不存在")
}

// 简写（最常用的模式）
if score, ok := scores["张三"]; ok {
    fmt.Println("张三的分数：", score)
}
```

### 遍历 Map

```go
user := map[string]string{
    "name": "张三",
    "city": "北京",
    "job":  "程序员",
}

for key, value := range user {
    fmt.Printf("%s: %s\n", key, value)
}
```

> **注意**：Map 的遍历顺序是**不确定的**！每次运行结果可能顺序不同。如果需要有序遍历，要先对键排序。

### Map 的值可以是任何类型

```go
// 值是切片
hobbies := map[string][]string{
    "张三": {"读书", "游泳", "编程"},
    "李四": {"跑步", "音乐"},
}
fmt.Println(hobbies["张三"]) // [读书 游泳 编程]

// 值是 map（嵌套 map）
students := map[string]map[string]int{
    "张三": {"语文": 90, "数学": 85},
    "李四": {"语文": 78, "数学": 92},
}
fmt.Println(students["张三"]["数学"]) // 85
```

## 5.5 综合实战：学生成绩管理

```go
package main

import "fmt"

func main() {
    // 用 map + 切片存储多个学生的多门成绩
    classScores := map[string][]int{
        "张三": {90, 85, 92},
        "李四": {78, 82, 88},
        "王五": {95, 91, 87},
    }
    subjects := []string{"语文", "数学", "英语"}

    fmt.Println("===== 成绩单 =====")

    for name, scores := range classScores {
        fmt.Printf("\n%s 的成绩：\n", name)
        total := 0
        for i, score := range scores {
            fmt.Printf("  %s：%d\n", subjects[i], score)
            total += score
        }
        avg := float64(total) / float64(len(scores))
        fmt.Printf("  总分：%d，平均分：%.1f\n", total, avg)
    }

    // 找出每科最高分
    fmt.Println("\n===== 各科最高分 =====")
    for i, subject := range subjects {
        maxScore := 0
        topStudent := ""
        for name, scores := range classScores {
            if scores[i] > maxScore {
                maxScore = scores[i]
                topStudent = name
            }
        }
        fmt.Printf("%s最高分：%s（%d 分）\n", subject, topStudent, maxScore)
    }
}
```

## 5.6 本章小结

| 类型 | 声明 | 特点 |
|------|------|------|
| 数组 | `[5]int{1,2,3,4,5}` | 长度固定，不同长度是不同类型 |
| 切片 | `[]int{1,2,3,4,5}` | 长度可变，用 `append` 添加元素 |
| Map | `map[string]int{"a":1}` | 键值对，键唯一，遍历顺序不确定 |

常用操作速查：

| 操作 | 切片 | Map |
|------|------|-----|
| 创建 | `make([]int, 0)` | `make(map[string]int)` |
| 添加 | `s = append(s, 1)` | `m["key"] = value` |
| 删除 | `append(s[:i], s[i+1:]...)` | `delete(m, "key")` |
| 长度 | `len(s)` | `len(m)` |
| 遍历 | `for i, v := range s` | `for k, v := range m` |
| 判断存在 | - | `v, ok := m["key"]` |

## 5.7 练习题

1. **数组练习**：创建一个包含 7 天温度的数组，计算平均温度，找出最高和最低温度
2. **切片操作**：创建一个字符串切片存储 5 个城市名，然后：添加一个新城市、删除第 3 个城市、打印最终结果
3. **Map 练习**：创建一个 map 存储 5 个商品的名称和价格，实现：查询某商品价格、添加新商品、删除商品、遍历打印所有商品
4. **单词计数**：给定字符串 `"go is great go is simple go is fast"`，用 Map 统计每个单词出现的次数
5. **综合题**：模拟一个简单的购物车——用切片存储商品名称，用 map 存储商品价格，计算总价

> 上一章：[函数详解](./04-函数详解.md)
> 下一章：[字符串与格式化输出](./06-字符串与格式化输出.md)
