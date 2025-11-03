/**
 * Node.js 入门第一课 - Hello World
 * 本文件演示了Node.js的基础概念和核心API
 * 
 * 学习目标：
 * 1. 理解Node.js的运行环境
 * 2. 掌握process对象的基本用法
 * 3. 了解命令行参数和环境变量
 * 4. 学会程序的退出机制
 */

// ===============================================
// 1. 基础输出 - console对象
// ===============================================

// console是Node.js的全局对象，用于控制台输出
console.log('🎉 Hello, Node.js!');
console.log('这是我的第一个Node.js程序');

// console的其他方法
console.info('ℹ️ 信息输出');
console.warn('⚠️ 警告信息');
console.error('❌ 错误信息');

// 格式化输出
const name = 'Node.js';
const version = '18.0.0';
console.log('我正在学习 %s，版本是 %s', name, version);

// ===============================================
// 2. process对象 - Node.js进程信息
// ===============================================

/* 
 * process是Node.js的全局对象，提供了当前进程的信息和控制能力
 * 它是EventEmitter的实例，可以监听各种进程事件
 */

console.log('\n📊 === 进程信息 ===');
console.log('Node.js版本:', process.version);
console.log('平台架构:', process.arch);
console.log('操作系统:', process.platform);
console.log('当前工作目录:', process.cwd());
console.log('进程ID (PID):', process.pid);
console.log('父进程ID (PPID):', process.ppid);

// 内存使用情况
const memoryUsage = process.memoryUsage();
console.log('\n💾 === 内存使用情况 ===');
console.log('RSS (常驻内存):', (memoryUsage.rss / 1024 / 1024).toFixed(2), 'MB');
console.log('堆内存总量:', (memoryUsage.heapTotal / 1024 / 1024).toFixed(2), 'MB');
console.log('堆内存使用:', (memoryUsage.heapUsed / 1024 / 1024).toFixed(2), 'MB');

// ===============================================
// 3. 命令行参数处理
// ===============================================

/* 
 * process.argv包含启动Node.js进程时的命令行参数
 * argv[0] = Node.js可执行文件路径
 * argv[1] = 当前脚本文件路径
 * argv[2+] = 用户传入的参数
 */

console.log('\n📝 === 命令行参数 ===');
console.log('完整参数列表:', process.argv);
console.log('Node.js路径:', process.argv[0]);
console.log('脚本文件路径:', process.argv[1]);

// 获取用户自定义参数
const userArgs = process.argv.slice(2);
if (userArgs.length > 0) {
    console.log('用户传入的参数:', userArgs);
    userArgs.forEach((arg, index) => {
        console.log(`  参数${index + 1}: ${arg}`);
    });
} else {
    console.log('没有传入额外参数');
    console.log('💡 提示: 运行时可以传入参数，例如：node 01-hello-world.js name=张三 age=25');
}

// 解析键值对参数
function parseArgs(args) {
    const parsed = {};
    args.forEach(arg => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            parsed[key] = value;
        }
    });
    return parsed;
}

const parsedArgs = parseArgs(userArgs);
if (Object.keys(parsedArgs).length > 0) {
    console.log('解析后的参数:', parsedArgs);
}

// ===============================================
// 4. 环境变量
// ===============================================

/* 
 * process.env包含用户环境变量
 * 常用于配置应用程序的运行环境
 */

console.log('\n🌍 === 环境变量 ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PATH:', process.env.PATH ? 'PATH变量已设置' : 'PATH变量未设置');
console.log('HOME目录:', process.env.HOME || process.env.USERPROFILE);

// 设置自定义环境变量
process.env.CUSTOM_VAR = 'Hello from Node.js';
console.log('自定义环境变量:', process.env.CUSTOM_VAR);

// ===============================================
// 5. 进程事件监听
// ===============================================

// 监听退出事件
process.on('exit', (code) => {
    console.log('\n👋 程序即将退出，退出码:', code);
});

// 监听未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('💥 未捕获的异常:', err.message);
    process.exit(1);
});

// 监听未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason);
});

// ===============================================
// 6. 程序退出
// ===============================================

/* 
 * process.exit(code) 用于退出Node.js进程
 * code = 0 表示正常退出
 * code != 0 表示异常退出
 * 
 * 注意：exit()会立即终止进程，不会等待异步操作完成
 */

console.log('\n⏰ === 程序运行时间 ===');
const uptime = process.uptime();
console.log(`程序已运行: ${uptime.toFixed(3)} 秒`);

console.log('\n✅ Hello World 教程完成！');
console.log('💡 尝试运行: node 01-hello-world.js name=张三 age=25');

// 延迟退出，让用户看到输出
setTimeout(() => {
    console.log('\n程序结束！');
    // process.exit(0); // 正常退出
}, 1000);

// 异常退出示例（注释掉）
// process.exit(1); // 异常退出
