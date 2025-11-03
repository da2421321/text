const EventEmitter = require('events');

// 1. 创建事件发射器
const myEmitter = new EventEmitter();

// 2. 注册事件监听器
myEmitter.on('greet', (name) => {
    console.log(`Hello, ${name}!`);
});

myEmitter.on('greet', (name) => {
    console.log(`Nice to meet you, ${name}!`);
});

// 3. 触发事件
myEmitter.emit('greet', 'Alice');

// 4. 一次性监听器
myEmitter.once('welcome', () => {
    console.log('Welcome! This will only run once.');
});

myEmitter.emit('welcome');
myEmitter.emit('welcome'); // 不会执行

// 5. 错误处理
myEmitter.on('error', (err) => {
    console.error('发生错误:', err.message);
});

// 6. 移除监听器
const listener = (data) => console.log('数据:', data);
myEmitter.on('data', listener);
myEmitter.removeListener('data', listener);

// 7. 自定义事件类
class MyClass extends EventEmitter {
    constructor() {
        super();// 调用父类 EventEmitter 的构造函数
        this.data = [];// this 指向当前创建的 MyClass 实例
    }
    
    addItem(item) {
        this.data.push(item);// this 指向调用该方法的 MyClass 实例
        this.emit('itemAdded', item);// this 指向调用该方法的 MyClass 实例
    }
    
    getItems() {
        this.emit('itemsRequested');
        return this.data;
    }
}

const myClass = new MyClass();
myClass.on('itemAdded', (item) => {
    console.log('添加了项目:', item);
});

myClass.addItem('项目1');
myClass.addItem('项目2');
