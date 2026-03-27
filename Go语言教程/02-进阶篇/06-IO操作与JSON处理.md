# 进阶六：IO 操作与 JSON 处理

> **本章目标**
> - 理解 IO 操作的基本概念
> - 掌握文件的读取和写入方法
> - 学会 JSON 数据的序列化和反序列化
> - 了解 CSV、XML 等常见数据格式的处理
> - 理解 io.Reader 和 io.Writer 接口

## 前置知识

- Go 基础语法（变量、函数、控制结构）
- 结构体的定义和使用
- 错误处理机制
- 接口的基本概念

---

## 1. IO 是什么

**生活类比：读书写字**

想象你在图书馆：
- **读书（Input）**：从书本上获取信息到你的大脑
- **写字（Output）**：把你脑中的想法写到纸上

在编程中，IO（Input/Output）就是程序与外部世界交换数据的过程：
- **Input**：从文件、网络、键盘等读取数据
- **Output**：把数据写入文件、网络、屏幕等

---

## 2. 文件读取

### 2.1 一次性读取整个文件

最简单的方式是使用 `os.ReadFile`（Go 1.16+）：

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 读取整个文件内容
	content, err := os.ReadFile("test.txt")
	if err != nil {
		fmt.Println("读取文件失败:", err)
		return
	}

	// content 是 []byte 类型，转换为字符串
	fmt.Println("文件内容:")
	fmt.Println(string(content))
}
```

### 2.2 逐行读取文件

对于大文件，逐行读取更节省内存：

```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	// 打开文件
	file, err := os.Open("test.txt")
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer file.Close() // 确保文件关闭

	// 创建 Scanner
	scanner := bufio.NewScanner(file)

	lineNum := 1
	// 逐行读取
	for scanner.Scan() {
		line := scanner.Text()
		fmt.Printf("第 %d 行: %s\n", lineNum, line)
		lineNum++
	}

	// 检查是否有错误
	if err := scanner.Err(); err != nil {
		fmt.Println("读取过程出错:", err)
	}
}
```

### 2.3 使用 bufio.Reader 读取

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

func main() {
	file, err := os.Open("test.txt")
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer file.Close()

	reader := bufio.NewReader(file)

	for {
		// 读取一行（包含换行符）
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				// 文件结束
				if len(line) > 0 {
					fmt.Print(line) // 打印最后一行
				}
				break
			}
			fmt.Println("读取错误:", err)
			return
		}
		fmt.Print(line)
	}
}
```

---

## 3. 文件写入

### 3.1 一次性写入文件

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	content := []byte("Hello, Go!\n这是第二行\n")

	// 写入文件，权限 0644（rw-r--r--）
	err := os.WriteFile("output.txt", content, 0644)
	if err != nil {
		fmt.Println("写入文件失败:", err)
		return
	}

	fmt.Println("文件写入成功！")
}
```

### 3.2 创建文件并写入

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 创建文件（如果存在会被清空）
	file, err := os.Create("output.txt")
	if err != nil {
		fmt.Println("创建文件失败:", err)
		return
	}
	defer file.Close()

	// 写入字符串
	_, err = file.WriteString("第一行内容\n")
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}

	// 写入字节
	_, err = file.Write([]byte("第二行内容\n"))
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}

	fmt.Println("写入成功！")
}
```

### 3.3 追加内容到文件

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 以追加模式打开文件
	file, err := os.OpenFile("output.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer file.Close()

	// 追加内容
	_, err = file.WriteString("这是追加的内容\n")
	if err != nil {
		fmt.Println("追加失败:", err)
		return
	}

	fmt.Println("追加成功！")
}
```

---

## 4. 文件操作

### 4.1 判断文件是否存在

```go
package main

import (
	"fmt"
	"os"
)

func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}

func main() {
	if fileExists("test.txt") {
		fmt.Println("文件存在")
	} else {
		fmt.Println("文件不存在")
	}
}
```

### 4.2 创建目录

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 创建单个目录
	err := os.Mkdir("mydir", 0755)
	if err != nil {
		fmt.Println("创建目录失败:", err)
	}

	// 创建多级目录
	err = os.MkdirAll("parent/child/grandchild", 0755)
	if err != nil {
		fmt.Println("创建多级目录失败:", err)
		return
	}

	fmt.Println("目录创建成功！")
}
```

### 4.3 遍历目录

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	// 方法一：使用 os.ReadDir
	entries, err := os.ReadDir(".")
	if err != nil {
		fmt.Println("读取目录失败:", err)
		return
	}

	fmt.Println("当前目录内容:")
	for _, entry := range entries {
		if entry.IsDir() {
			fmt.Printf("[目录] %s\n", entry.Name())
		} else {
			fmt.Printf("[文件] %s\n", entry.Name())
		}
	}

	fmt.Println("\n递归遍历:")
	// 方法二：递归遍历
	err = filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		fmt.Println(path)
		return nil
	})
	if err != nil {
		fmt.Println("遍历失败:", err)
	}
}
```

---

## 5. JSON 处理

JSON（JavaScript Object Notation）是当今最流行的数据交换格式。就像快递单一样，它是程序之间"传递信息"的标准格式。

### 5.1 结构体转 JSON（序列化）

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	Name   string
	Age    int
	Scores []int
}

func main() {
	stu := Student{
		Name:   "小明",
		Age:    18,
		Scores: []int{90, 85, 92},
	}

	// 序列化为 JSON
	data, err := json.Marshal(stu)
	if err != nil {
		fmt.Println("序列化失败:", err)
		return
	}
	fmt.Println(string(data))
	// 输出: {"Name":"小明","Age":18,"Scores":[90,85,92]}

	// 格式化输出（带缩进）
	prettyData, err := json.MarshalIndent(stu, "", "  ")
	if err != nil {
		fmt.Println("序列化失败:", err)
		return
	}
	fmt.Println(string(prettyData))
}
```

### 5.2 JSON 转结构体（反序列化）

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	Name   string `json:"name"`
	Age    int    `json:"age"`
	Scores []int  `json:"scores"`
}

func main() {
	jsonStr := `{"name":"小红","age":17,"scores":[88,95,78]}`

	var stu Student
	err := json.Unmarshal([]byte(jsonStr), &stu)
	if err != nil {
		fmt.Println("反序列化失败:", err)
		return
	}

	fmt.Printf("姓名: %s\n", stu.Name)
	fmt.Printf("年龄: %d\n", stu.Age)
	fmt.Printf("成绩: %v\n", stu.Scores)
}
```

### 5.3 JSON Tag 详解

JSON Tag 是 Go 中控制 JSON 序列化行为的关键：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	// 自定义 JSON 字段名
	Name string `json:"username"`

	// omitempty：值为零值时不输出该字段
	Email string `json:"email,omitempty"`

	// -：始终忽略该字段，不参与序列化
	Password string `json:"-"`

	// string：将数值类型以字符串形式输出
	Age int `json:"age,string"`
}

func main() {
	u1 := User{
		Name:     "张三",
		Email:    "zhangsan@example.com",
		Password: "123456",
		Age:      25,
	}

	data, _ := json.MarshalIndent(u1, "", "  ")
	fmt.Println("有 Email 的情况:")
	fmt.Println(string(data))
	// Password 不会出现，Name 变成 username

	u2 := User{
		Name:     "李四",
		Email:    "", // 空字符串是零值
		Password: "abcdef",
		Age:      30,
	}

	data, _ = json.MarshalIndent(u2, "", "  ")
	fmt.Println("\nEmail 为空的情况:")
	fmt.Println(string(data))
	// Email 字段不会出现（omitempty 生效）
}
```

### 5.4 处理动态 JSON

当你不确定 JSON 的结构时，可以用 `map[string]interface{}` 来接收：

```go
package main

import (
	"encoding/json"
	"fmt"
)

func main() {
	jsonStr := `{
		"name": "小明",
		"age": 18,
		"hobbies": ["篮球", "编程"],
		"address": {
			"city": "北京",
			"street": "长安街"
		}
	}`

	// 用 map 接收不确定结构的 JSON
	var result map[string]interface{}
	err := json.Unmarshal([]byte(jsonStr), &result)
	if err != nil {
		fmt.Println("解析失败:", err)
		return
	}

	// 访问字段（需要类型断言）
	name := result["name"].(string)
	age := result["age"].(float64) // JSON 数字默认解析为 float64
	fmt.Printf("姓名: %s, 年龄: %.0f\n", name, age)

	// 访问嵌套对象
	address := result["address"].(map[string]interface{})
	city := address["city"].(string)
	fmt.Printf("城市: %s\n", city)

	// 访问数组
	hobbies := result["hobbies"].([]interface{})
	for i, h := range hobbies {
		fmt.Printf("爱好%d: %s\n", i+1, h.(string))
	}
}
```

### 5.5 json.Decoder 和 json.Encoder（流式处理）

当数据来自 io.Reader（如文件、网络）时，使用流式处理更高效：

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	Debug bool  `json:"debug"`
}

func main() {
	// === Decoder：从 Reader 中解析 JSON ===
	jsonReader := strings.NewReader(`{"host":"localhost","port":8080,"debug":true}`)

	var config Config
	decoder := json.NewDecoder(jsonReader)
	err := decoder.Decode(&config)
	if err != nil {
		fmt.Println("解码失败:", err)
		return
	}
	fmt.Printf("配置: %+v\n", config)

	// === Encoder：将 JSON 写入 Writer ===
	fmt.Println("\n编码输出:")
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	encoder.Encode(config)
}
```

---

## 6. XML 处理

XML 是另一种常见的数据格式，Go 提供了 `encoding/xml` 包：

```go
package main

import (
	"encoding/xml"
	"fmt"
)

type Book struct {
	XMLName xml.Name `xml:"book"`
	Title   string   `xml:"title"`
	Author  string   `xml:"author"`
	Price   float64  `xml:"price"`
}

func main() {
	// 结构体转 XML
	book := Book{
		Title:  "Go 语言编程",
		Author: "张三",
		Price:  59.9,
	}

	data, err := xml.MarshalIndent(book, "", "  ")
	if err != nil {
		fmt.Println("序列化失败:", err)
		return
	}
	fmt.Println(string(data))

	// XML 转结构体
	xmlStr := `<book><title>Python 入门</title><author>李四</author><price>49.9</price></book>`
	var b Book
	err = xml.Unmarshal([]byte(xmlStr), &b)
	if err != nil {
		fmt.Println("反序列化失败:", err)
		return
	}
	fmt.Printf("\n解析结果: %+v\n", b)
}
```

---

## 7. CSV 处理

CSV（逗号分隔值）常用于表格数据：

```go
package main

import (
	"encoding/csv"
	"fmt"
	"os"
)

func main() {
	// === 写入 CSV ===
	file, err := os.Create("students.csv")
	if err != nil {
		fmt.Println("创建文件失败:", err)
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入表头
	writer.Write([]string{"姓名", "年龄", "成绩"})

	// 写入数据
	records := [][]string{
		{"小明", "18", "90"},
		{"小红", "17", "95"},
		{"小刚", "19", "88"},
	}
	for _, record := range records {
		writer.Write(record)
	}
	fmt.Println("CSV 写入成功！")

	// === 读取 CSV ===
	file2, err := os.Open("students.csv")
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer file2.Close()

	reader := csv.NewReader(file2)
	rows, err := reader.ReadAll()
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}

	fmt.Println("\nCSV 内容:")
	for i, row := range rows {
		if i == 0 {
			fmt.Printf("表头: %v\n", row)
		} else {
			fmt.Printf("第%d行: %v\n", i, row)
		}
	}
}
```

---

## 8. io.Reader 和 io.Writer 接口

这是 Go IO 系统的核心抽象，就像"万能插座"一样，让不同的数据源和目标可以统一处理。

### 8.1 接口定义

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}
```

### 8.2 实战示例

```go
package main

import (
	"fmt"
	"io"
	"os"
	"strings"
)

// 从任何 Reader 读取数据
func readFrom(r io.Reader) {
	buf := make([]byte, 1024)
	n, err := r.Read(buf)
	if err != nil && err != io.EOF {
		fmt.Println("读取失败:", err)
		return
	}
	fmt.Printf("读取了 %d 字节: %s\n", n, string(buf[:n]))
}

// 向任何 Writer 写入数据
func writeTo(w io.Writer, data string) {
	n, err := w.Write([]byte(data))
	if err != nil {
		fmt.Println("写入失败:", err)
		return
	}
	fmt.Printf("写入了 %d 字节\n", n)
}

func main() {
	// 从字符串读取
	strReader := strings.NewReader("Hello from string!")
	readFrom(strReader)

	// 从文件读取
	file, _ := os.Open("test.txt")
	defer file.Close()
	readFrom(file)

	// 写入到标准输出
	writeTo(os.Stdout, "输出到屏幕\n")

	// 写入到文件
	outFile, _ := os.Create("output.txt")
	defer outFile.Close()
	writeTo(outFile, "写入到文件")
}
```

### 8.3 io.Copy 的妙用

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	// 复制文件
	src, err := os.Open("source.txt")
	if err != nil {
		fmt.Println("打开源文件失败:", err)
		return
	}
	defer src.Close()

	dst, err := os.Create("destination.txt")
	if err != nil {
		fmt.Println("创建目标文件失败:", err)
		return
	}
	defer dst.Close()

	// 一行代码完成复制
	n, err := io.Copy(dst, src)
	if err != nil {
		fmt.Println("复制失败:", err)
		return
	}

	fmt.Printf("成功复制 %d 字节\n", n)
}
```

---

## 9. 实战：读取配置文件并解析

创建一个完整的配置文件读取程序：

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// 配置结构
type AppConfig struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Log      LogConfig      `json:"log"`
}

type ServerConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type DatabaseConfig struct {
	Driver   string `json:"driver"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

type LogConfig struct {
	Level string `json:"level"`
	File  string `json:"file"`
}

// 加载配置文件
func LoadConfig(filename string) (*AppConfig, error) {
	// 读取文件
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	// 解析 JSON
	var config AppConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	return &config, nil
}

// 保存配置文件
func SaveConfig(filename string, config *AppConfig) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化配置失败: %w", err)
	}

	err = os.WriteFile(filename, data, 0644)
	if err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	return nil
}

func main() {
	// 创建默认配置
	defaultConfig := &AppConfig{
		Server: ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: DatabaseConfig{
			Driver:   "mysql",
			Host:     "localhost",
			Port:     3306,
			Username: "root",
			Password: "password",
			DBName:   "myapp",
		},
		Log: LogConfig{
			Level: "info",
			File:  "app.log",
		},
	}

	// 保存配置
	err := SaveConfig("config.json", defaultConfig)
	if err != nil {
		fmt.Println("保存配置失败:", err)
		return
	}
	fmt.Println("配置文件已创建: config.json")

	// 加载配置
	config, err := LoadConfig("config.json")
	if err != nil {
		fmt.Println("加载配置失败:", err)
		return
	}

	// 使用配置
	fmt.Printf("\n服务器配置: %s:%d\n", config.Server.Host, config.Server.Port)
	fmt.Printf("数据库配置: %s@%s:%d/%s\n",
		config.Database.Username,
		config.Database.Host,
		config.Database.Port,
		config.Database.DBName)
	fmt.Printf("日志配置: level=%s, file=%s\n", config.Log.Level, config.Log.File)
}
```

---

## 10. 练习题

### 练习 1：日志记录器

编写一个简单的日志记录器，要求：
- 支持写入日志到文件
- 每条日志包含时间戳、日志级别（INFO/WARN/ERROR）和消息
- 提供 `Info()`, `Warn()`, `Error()` 三个方法

```go
// 提示：使用 time.Now().Format() 获取时间戳
// 提示：使用 os.OpenFile 以追加模式打开文件
```

### 练习 2：学生成绩管理

创建一个学生成绩管理程序：
- 定义 Student 结构体（姓名、学号、成绩列表）
- 将多个学生数据保存为 JSON 文件
- 从 JSON 文件读取并计算每个学生的平均分
- 找出平均分最高的学生

### 练习 3：CSV 数据转换

编写程序将 CSV 文件转换为 JSON：
- 读取 CSV 文件（第一行是表头）
- 将每一行数据转换为 JSON 对象
- 所有对象组成数组，保存为 JSON 文件

示例 CSV：
```
name,age,city
张三,25,北京
李四,30,上海
```

期望 JSON：
```json
[
  {"name":"张三","age":"25","city":"北京"},
  {"name":"李四","age":"30","city":"上海"}
]
```

### 练习 4：文件备份工具

编写一个文件备份工具：
- 接收源文件路径和目标目录
- 复制文件到目标目录，文件名加上时间戳
- 例如：`data.txt` → `data_20260316_092043.txt`
- 使用 `io.Copy` 实现文件复制

---

## 总结

本章学习了：
- 文件的读取和写入操作
- 目录的创建和遍历
- JSON 的序列化和反序列化
- JSON Tag 的使用技巧
- CSV 和 XML 的基本处理
- io.Reader 和 io.Writer 接口的核心概念
- 实战配置文件的读取和解析

掌握 IO 操作和 JSON 处理是 Go 开发的基础技能，几乎所有实际项目都会用到这些知识。多练习，熟能生巧！

```

