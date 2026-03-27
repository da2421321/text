# 02 - Dart 基础语法

> 有 JavaScript 基础，Dart 上手很快。本章重点讲差异点。

---

## 1. Dart 语言特点

- **强类型**：有类型系统，但支持类型推断（类似 TypeScript）
- **面向对象**：一切皆对象，包括数字和函数
- **空安全**：Dart 2.12+ 默认开启，避免空指针异常
- **单线程 + 异步**：和 JS 一样，用 async/await 处理异步

---

## 2. 变量声明

```dart
// ===== Dart =====

// var - 类型推断（类似 JS 的 let）
var name = 'Flutter';
var age = 18;

// 显式类型声明（类似 TypeScript）
String name = 'Flutter';
int age = 18;
double price = 9.9;
bool isActive = true;

// final - 运行时常量（只能赋值一次，类似 JS 的 const）
final String city = '北京';
final now = DateTime.now();  // 运行时才确定值

// const - 编译时常量（值必须在编译时确定）
const double pi = 3.14159;
const maxCount = 100;

// 可空类型（? 表示可以为 null）
String? nullableName;        // 默认为 null
int? nullableAge = null;
```

```javascript
// ===== JavaScript 对比 =====
let name = 'Flutter';
const city = '北京';
// JS 没有编译时常量的概念
// JS 没有强类型，没有可空类型
```

### 空安全操作符

```dart
String? name = null;

// ?. 安全调用（类似 JS 的可选链 ?.）
int? length = name?.length;

// ?? 空值合并（和 JS 一样）
String displayName = name ?? '匿名用户';

// ??= 空值赋值
name ??= '默认名称';  // 如果 name 为 null 则赋值

// ! 强制非空断言（确定不为 null 时使用，慎用）
String definitelyNotNull = name!;
```

---

## 3. 数据类型

### 数字

```dart
int a = 10;
double b = 3.14;
num c = 42;        // num 是 int 和 double 的父类

// 类型转换
int x = 3;
double y = x.toDouble();   // 3.0
int z = 3.7.toInt();       // 3（截断，不四舍五入）
String s = 42.toString();  // "42"
int n = int.parse('42');   // 42
```

### 字符串

```dart
String name = 'Flutter';

// 字符串插值（和 JS 模板字符串类似）
String greeting = 'Hello, $name!';
String info = '2 + 2 = ${2 + 2}';

// 多行字符串
String multiLine = '''
  第一行
  第二行
  第三行
''';

// 字符串方法
'hello'.toUpperCase()     // 'HELLO'
'  hello  '.trim()        // 'hello'
'hello world'.split(' ')  // ['hello', 'world']
'hello'.contains('ell')   // true
'hello'.replaceAll('l', 'r')  // 'herro'
'hello'.startsWith('he')  // true
'hello'.length            // 5
```

### 布尔

```dart
bool isTrue = true;
bool isFalse = false;

// Dart 中只有 true 才是真，不像 JS 有隐式转换
// if (1) {}  // 错误！Dart 不允许
// if (true) {}  // 正确
```

### List（数组）

```dart
// 类似 JS 数组
List<String> fruits = ['apple', 'banana', 'orange'];
var numbers = [1, 2, 3, 4, 5];  // 类型推断为 List<int>

// 操作
fruits.add('grape');           // 添加
fruits.addAll(['kiwi', 'mango']); // 添加多个
fruits.remove('apple');        // 删除
fruits.removeAt(0);            // 按索引删除
fruits.length;                 // 长度
fruits[0];                     // 访问
fruits.contains('banana');     // 是否包含
fruits.indexOf('banana');      // 索引

// 遍历
for (var fruit in fruits) {
  print(fruit);
}
fruits.forEach((fruit) => print(fruit));

// 函数式方法（和 JS 一样）
var doubled = numbers.map((n) => n * 2).toList();
var evens = numbers.where((n) => n % 2 == 0).toList();
var sum = numbers.reduce((a, b) => a + b);

// 展开运算符（和 JS 一样）
var list1 = [1, 2, 3];
var list2 = [0, ...list1, 4];  // [0, 1, 2, 3, 4]

// 条件元素
bool showExtra = true;
var items = [
  'item1',
  'item2',
  if (showExtra) 'extra',  // 条件添加
];
```

### Map（对象）

```dart
// 类似 JS 对象
Map<String, dynamic> user = {
  'name': 'Alice',
  'age': 25,
  'isActive': true,
};

// 访问
user['name'];              // 'Alice'
user['name'] = 'Bob';      // 修改

// 方法
user.keys;                 // 所有键
user.values;               // 所有值
user.containsKey('name');  // true
user.remove('age');        // 删除

// 遍历
user.forEach((key, value) {
  print('$key: $value');
});

// 展开（Dart 3.0+）
var extra = {'city': '北京'};
var merged = {...user, ...extra};
```

### Set（集合）

```dart
// 不重复的集合
Set<String> tags = {'flutter', 'dart', 'mobile'};
tags.add('web');
tags.add('flutter');  // 重复，不会添加

// 集合运算
var a = {1, 2, 3};
var b = {2, 3, 4};
a.union(b);        // {1, 2, 3, 4} 并集
a.intersection(b); // {2, 3} 交集
a.difference(b);   // {1} 差集
```

---

## 4. 函数

```dart
// 基本函数
int add(int a, int b) {
  return a + b;
}

// 箭头函数（单行）
int multiply(int a, int b) => a * b;

// 可选参数（命名参数，类似 Vue props）
void greet({String name = '匿名', int age = 0}) {
  print('Hello $name, age: $age');
}
greet(name: 'Alice', age: 25);
greet(age: 30);  // name 使用默认值

// 必填命名参数（required）
void createUser({required String name, required int age}) {
  print('$name: $age');
}
createUser(name: 'Bob', age: 20);

// 可选位置参数
String greetUser(String name, [String? title]) {
  return title != null ? '$title $name' : name;
}
greetUser('Alice');          // 'Alice'
greetUser('Alice', 'Dr.');   // 'Dr. Alice'

// 函数作为参数（高阶函数，和 JS 一样）
void doSomething(Function callback) {
  callback();
}

// 匿名函数 / Lambda
var square = (int n) => n * n;
var numbers = [1, 2, 3];
numbers.map((n) => n * 2);
```

---

## 5. 控制流

```dart
// if/else（和 JS 一样）
if (age >= 18) {
  print('成年');
} else if (age >= 12) {
  print('青少年');
} else {
  print('儿童');
}

// switch（Dart 3.0 增强了 switch）
String day = 'Monday';
switch (day) {
  case 'Monday':
  case 'Tuesday':
    print('工作日');
    break;
  case 'Saturday':
  case 'Sunday':
    print('周末');
    break;
  default:
    print('其他');
}

// Dart 3.0 switch 表达式
String result = switch (day) {
  'Saturday' || 'Sunday' => '周末',
  _ => '工作日',
};

// for 循环
for (int i = 0; i < 5; i++) {
  print(i);
}

// for-in（类似 JS for-of）
for (var item in list) {
  print(item);
}

// while / do-while（和 JS 一样）
while (condition) { ... }
do { ... } while (condition);

// 三元运算符（和 JS 一样）
String label = isActive ? '激活' : '未激活';
```

---

## 6. 类（Class）

这是 Dart 和 JS 最大的差异，Flutter 大量使用类。

```dart
// 基本类
class Person {
  // 属性
  String name;
  int age;
  String? email;  // 可空属性

  // 构造函数
  Person(this.name, this.age);  // 简写语法

  // 命名构造函数（类似工厂方法）
  Person.fromMap(Map<String, dynamic> map)
      : name = map['name'],
        age = map['age'];

  // 方法
  void greet() {
    print('Hi, I am $name');
  }

  // getter
  String get info => '$name ($age岁)';

  // setter
  set setAge(int value) {
    if (value > 0) age = value;
  }

  // toString（类似 JS 的 toString）
  @override
  String toString() => 'Person($name, $age)';
}

// 使用
var person = Person('Alice', 25);
var person2 = Person.fromMap({'name': 'Bob', 'age': 30});
person.greet();
print(person.info);
```

### 继承

```dart
class Animal {
  String name;
  Animal(this.name);

  void speak() {
    print('$name makes a sound');
  }
}

class Dog extends Animal {
  Dog(String name) : super(name);  // 调用父类构造函数

  @override
  void speak() {
    print('$name barks');
  }
}

var dog = Dog('Rex');
dog.speak();  // Rex barks
```

### 抽象类和接口

```dart
// 抽象类（不能实例化）
abstract class Shape {
  double area();  // 抽象方法，子类必须实现
  void describe() {
    print('This is a shape with area: ${area()}');
  }
}

class Circle extends Shape {
  double radius;
  Circle(this.radius);

  @override
  double area() => 3.14 * radius * radius;
}

// Mixin（混入，类似 Vue 的 mixin 但更强大）
mixin Flyable {
  void fly() => print('Flying!');
}

mixin Swimmable {
  void swim() => print('Swimming!');
}

class Duck extends Animal with Flyable, Swimmable {
  Duck(String name) : super(name);
}

var duck = Duck('Donald');
duck.fly();   // Flying!
duck.swim();  // Swimming!
```

---

## 7. 异步编程

Dart 的异步和 JS 非常相似。

```dart
// Future（类似 JS 的 Promise）
Future<String> fetchData() async {
  await Future.delayed(Duration(seconds: 2));  // 模拟延迟
  return 'Hello from server';
}

// async/await（和 JS 完全一样）
void loadData() async {
  try {
    String data = await fetchData();
    print(data);
  } catch (e) {
    print('Error: $e');
  }
}

// then/catchError（类似 Promise.then）
fetchData()
    .then((data) => print(data))
    .catchError((e) => print('Error: $e'));

// Future.wait（类似 Promise.all）
Future<void> loadAll() async {
  var results = await Future.wait([
    fetchData(),
    fetchOtherData(),
  ]);
  print(results);
}
```

### Stream（数据流）

```dart
// Stream 类似 RxJS Observable，用于持续的数据流
Stream<int> countStream() async* {
  for (int i = 0; i < 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;  // 类似 generator 的 yield
  }
}

// 监听 Stream
void listenToStream() async {
  await for (int value in countStream()) {
    print(value);  // 每秒打印 0, 1, 2, 3, 4
  }
}

// StreamBuilder 在 Flutter UI 中使用（后面章节讲）
```

---

## 8. 泛型

```dart
// 泛型类（类似 TypeScript 泛型）
class Box<T> {
  T value;
  Box(this.value);

  T getValue() => value;
}

var intBox = Box<int>(42);
var stringBox = Box<String>('hello');

// 泛型函数
T first<T>(List<T> list) => list[0];

var firstNum = first<int>([1, 2, 3]);    // 1
var firstStr = first<String>(['a', 'b']); // 'a'
```

---

## 9. 枚举

```dart
// 基本枚举
enum Direction { north, south, east, west }

Direction dir = Direction.north;

// 增强枚举（Dart 2.17+）
enum Status {
  active('激活', true),
  inactive('未激活', false),
  pending('待审核', false);

  final String label;
  final bool isEnabled;
  const Status(this.label, this.isEnabled);
}

print(Status.active.label);      // 激活
print(Status.active.isEnabled);  // true
```

---

## 10. 常用内置方法速查

```dart
// 字符串
'hello'.isEmpty          // false
''.isEmpty               // true
'hello'.isNotEmpty       // true
'hello world'.split(' ') // ['hello', 'world']
'hello'.substring(1, 3)  // 'el'
'hello'.padLeft(8, '0')  // '000hello'

// 数字
42.abs()                 // 42
(-42).abs()              // 42
3.14.round()             // 3
3.14.ceil()              // 4
3.14.floor()             // 3
double.parse('3.14')     // 3.14

// List
[3,1,2].sort()           // [1, 2, 3]
[1,2,3].reversed.toList() // [3, 2, 1]
[1,2,3].first            // 1
[1,2,3].last             // 3
[1,2,3].isEmpty          // false
[1,[2,3]].expand((e) => e is List ? e : [e]).toList() // 扁平化

// Map
{'a': 1}.entries         // MapEntry 迭代器
Map.fromEntries(entries) // 从 entries 创建 Map
```

---

## 11. Dart vs JavaScript 速查表

| 功能 | JavaScript | Dart |
|------|-----------|------|
| 变量 | `let x = 1` | `var x = 1` |
| 常量 | `const x = 1` | `const x = 1` / `final x = 1` |
| 类型 | 动态 | 静态（可推断） |
| 空值 | `null` / `undefined` | `null`（无 undefined） |
| 字符串插值 | `` `${x}` `` | `'$x'` / `'${expr}'` |
| 数组 | `Array` | `List` |
| 对象 | `Object` | `Map` |
| 类 | `class` | `class` |
| 继承 | `extends` | `extends` |
| 异步 | `async/await` | `async/await` |
| Promise | `Promise` | `Future` |
| 可选链 | `obj?.prop` | `obj?.prop` |
| 空值合并 | `a ?? b` | `a ?? b` |
| 箭头函数 | `(x) => x` | `(x) => x` |
| 展开 | `...arr` | `...arr` |
| 解构 | `const {a, b} = obj` | 不支持（用命名参数代替） |
| 模块 | `import/export` | `import 'package:...'` |
| 打印 | `console.log()` | `print()` |

---

## 12. 练习

1. 创建一个 `Student` 类，包含姓名、年龄、成绩列表，实现计算平均分的方法
2. 用 `async/await` 模拟一个登录接口，延迟 1 秒后返回用户信息
3. 用 `List` 的函数式方法，过滤出成绩大于 60 分的学生并按成绩排序

---

**上一章：** [01 - 简介与环境搭建](./01-简介与环境搭建.md)
**下一章：** [03 - Widget 基础](./03-Widget基础.md)
