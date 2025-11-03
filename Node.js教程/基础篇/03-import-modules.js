/**
 * Node.js 模块导入详解
 * 本文件演示了各种模块导入方式和最佳实践
 * 
 * 学习目标：
 * 1. 掌握require()的使用方法
 * 2. 理解模块解析机制
 * 3. 学会解构赋值导入
 * 4. 掌握条件导入和动态导入
 */

console.log('📥 === Node.js 模块导入详解 ===\n');

// ===============================================
// 1. 导入内置模块
// ===============================================

console.log('📚 内置模块导入示例:');

// 导入全部内置模块
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const util = require('util');
const events = require('events');

console.log('✅ 已导入内置模块: fs, path, os, crypto, util, events');

// 使用内置模块示例
const currentDir = path.resolve('.');
const fileInfo = {
    当前目录: currentDir,
    操作系统: os.type(),
    Node版本: process.version,
    随机数: crypto.randomBytes(4).toString('hex')
};

console.log('系统信息:', fileInfo);

// ===============================================
// 2. 导入自定义模块
// ===============================================

console.log('\n📁 自定义模块导入示例:');

// 导入整个模块
const math = require('./math');
console.log('✅ 已导入 math 模块，版本:', math.version);

// 使用模块函数
try {
    console.log('\n数学计算示例:');
    console.log(`8 + 3 = ${math.add(8, 3)}`);
    console.log(`8 - 3 = ${math.subtract(8, 3)}`);
    console.log(`8 * 3 = ${math.multiply(8, 3)}`);
    console.log(`8 / 3 = ${math.divide(8, 3).toFixed(2)}`);
    
    console.log('\n高级函数示例:');
    console.log(`5! = ${math.advanced.factorial(5)}`);
    console.log(`2^10 = ${math.advanced.power(2, 10)}`);
    console.log(`√25 = ${math.advanced.sqrt(25)}`);
    console.log(`17是质数吗? ${math.advanced.isPrime(17)}`);
    
    console.log('\n数学常数:');
    console.log(`π = ${math.constants.PI.toFixed(4)}`);
    console.log(`e = ${math.constants.E.toFixed(4)}`);
    console.log(`黄金比例 = ${math.constants.GOLDEN_RATIO.toFixed(4)}`);
    
} catch (error) {
    console.error('计算错误:', error.message);
}

// ===============================================
// 3. 解构赋值导入
// ===============================================

console.log('\n💻 解构赋值导入示例:');

// 从模块中解构出特定函数
const { add, subtract, multiply, divide } = require('./math');
console.log('✅ 使用解构赋值导入基本函数');

// 直接使用解构出的函数
console.log(`直接使用: 15 + 25 = ${add(15, 25)}`);
console.log(`直接使用: 50 - 20 = ${subtract(50, 20)}`);

// 解构嵌套对象
const { advanced: { factorial, isPrime }, constants: { PI, E } } = require('./math');
console.log('✅ 使用嵌套解构导入高级函数和常数');
console.log(`直接使用: 6! = ${factorial(6)}`);
console.log(`直接使用: 13是质数吗? ${isPrime(13)}`);
console.log(`直接使用: π = ${PI.toFixed(6)}`);

// 别名导入
const { add: plus, subtract: minus } = require('./math');
console.log('✅ 使用别名导入');
console.log(`别名使用: 10 + 5 = ${plus(10, 5)}`);
console.log(`别名使用: 10 - 5 = ${minus(10, 5)}`);

// ===============================================
// 4. 模块解析机制
// ===============================================

console.log('\n🔍 模块解析机制示例:');

// 查看模块解析路径
try {
    console.log('模块搜索路径:', require.resolve.paths('./math'));
    console.log('math模块的完整路径:', require.resolve('./math'));
} catch (error) {
    console.log('模块解析信息获取失败:', error.message);
}

// 查看主模块
if (require.main === module) {
    console.log('✅ 当前模块是主模块（直接运行）');
} else {
    console.log('⚠️ 当前模块不是主模块（被其他模块导入）');
}

// ===============================================
// 5. JSON文件导入
// ===============================================

console.log('\n📜 JSON文件导入示例:');

// 导入JSON文件（需要先检查文件是否存在）
try {
    // 先检查package.json是否存在
    if (fs.existsSync('package.json')) {
        const packageJson = require('./package.json');
        console.log('✅ 项目信息:');
        console.log(`  名称: ${packageJson.name || '未定义'}`);
        console.log(`  版本: ${packageJson.version || '未定义'}`);
        console.log(`  描述: ${packageJson.description || '未定义'}`);
    } else {
        console.log('⚠️ package.json 文件不存在');
    }
} catch (error) {
    console.error('读取JSON文件失败:', error.message);
}

// ===============================================
// 6. 条件导入
// ===============================================

console.log('\n❗ 条件导入示例:');

// 根据环境变量导入不同模块
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
    // 开发环境下导入调试工具
    const debug = {
        log: (...args) => console.log('🐛 [DEBUG]', ...args),
        warn: (...args) => console.warn('⚠️ [WARN]', ...args),
        error: (...args) => console.error('❌ [ERROR]', ...args)
    };
    
    console.log('✅ 开发环境：已加载调试工具');
    debug.log('这是一个调试信息');
} else {
    console.log('🚀 生产环境：优化模式');
}

console.log('\n✅ 模块导入教程完成！');
console.log('💡 下一步: 学习 04-file-system.js');
