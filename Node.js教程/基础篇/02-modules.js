/**
 * Node.js 模块系统详解
 * 本文件演示了Node.js中的模块系统和模块导入导出
 * 
 * 学习目标：
 * 1. 理解Node.js的模块系统
 * 2. 掌握CommonJS和ES6模块语法
 * 3. 学会创建和使用自定义模块
 * 4. 了解内置模块的使用
 */

// ===============================================
// 1. 内置模块 - Node.js提供的核心模块
// ===============================================

console.log('📦 === Node.js 内置模块示例 ===\n');

// 文件系统模块
const fs = require('fs');
console.log('fs模块已加载，包含方法:', Object.keys(fs).slice(0, 10).join(', ') + '...');

// 路径处理模块
const path = require('path');
console.log('path模块已加载，当前文件名:', path.basename(__filename));
console.log('当前文件目录:', path.dirname(__filename));
console.log('文件扩展名:', path.extname(__filename));

// 操作系统信息模块
const os = require('os');
console.log('os模块已加载，系统信息:');
console.log('  操作系统类型:', os.type());
console.log('  系统架构:', os.arch());
console.log('  总内存:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + 'GB');
console.log('  可用内存:', (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + 'GB');

// URL处理模块
const url = require('url');
const sampleUrl = 'https://www.example.com:8080/path/to/page?name=value&foo=bar#section';
const parsedUrl = url.parse(sampleUrl, true);
console.log('URL解析结果:');
console.log('  协议:', parsedUrl.protocol);
console.log('  主机:', parsedUrl.hostname);
console.log('  端口:', parsedUrl.port);
console.log('  路径:', parsedUrl.pathname);
console.log('  查询参数:', parsedUrl.query);

// ===============================================
// 2. CommonJS 模块系统
// ===============================================

console.log('\n📚 === CommonJS 模块系统 ===\n');

/* 
 * CommonJS是Node.js默认的模块系统
 * 使用require()导入模块，使用module.exports或exports导出模块
 */

// ===============================================
// 3. 创建自定义模块 - math.js
// ===============================================

// 这里我们在同一个文件中演示模块的创建和使用
// 实际项目中，应该将不同的模块放在不同的文件中

// 数学计算函数
function add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a + b;
}

function subtract(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a - b;
}

function multiply(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a * b;
}

function divide(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    if (b === 0) {
        throw new Error('除数不能为零');
    }
    return a / b;
}

// 高级数学函数
const MathUtils = {
    // 阶乘
    factorial: function(n) {
        if (n < 0) throw new Error('阶乘不能为负数');
        if (n === 0 || n === 1) return 1;
        return n * this.factorial(n - 1);
    },
    
    // 幂运算
    power: function(base, exponent) {
        return Math.pow(base, exponent);
    },
    
    // 平方根
    sqrt: function(num) {
        if (num < 0) throw new Error('不能计算负数的平方根');
        return Math.sqrt(num);
    },
    
    // 判断是否为质数
    isPrime: function(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    },
    
    // 生成随机数
    random: function(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// 常数定义
const CONSTANTS = {
    PI: Math.PI,
    E: Math.E,
    GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
    EULER_GAMMA: 0.5772156649015329
};

// ===============================================
// 4. 模块导出方式
// ===============================================

console.log('📤 === 模块导出方式示例 ===\n');

// 方式1: module.exports 导出对象
const mathModule = {
    add,
    subtract,
    multiply,
    divide,
    utils: MathUtils,
    constants: CONSTANTS,
    version: '1.0.0',
    author: 'Node.js 教程',
    
    // 模块初始化函数
    init: function() {
        console.log('🎉 Math模块已初始化');
        console.log(`  版本: ${this.version}`);
        console.log(`  作者: ${this.author}`);
        console.log(`  支持的操作: ${Object.keys(this).filter(key => typeof this[key] === 'function' && key !== 'init').join(', ')}`);
    }
};

// 模块初始化
mathModule.init();

// 导出模块
module.exports = mathModule;

// 方式2: exports 简写形式（注释掉，避免冲突）
/*
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.divide = divide;
exports.utils = MathUtils;
exports.constants = CONSTANTS;
*/

// 方式3: 单个函数导出
// module.exports = add;

// ===============================================
// 5. 模块使用示例
// ===============================================

console.log('\n💻 === 模块使用示例 ===\n');

// 如果要使用这个模块，使用以下代码：
// const math = require('./math'); // 或者当前模块

// 演示使用
const math = mathModule; // 本地引用

try {
    console.log('基本运算演示:');
    console.log(`10 + 5 = ${math.add(10, 5)}`);
    console.log(`10 - 5 = ${math.subtract(10, 5)}`);
    console.log(`10 * 5 = ${math.multiply(10, 5)}`);
    console.log(`10 / 5 = ${math.divide(10, 5)}`);
    
    console.log('\n高级运算演示:');
    console.log(`5! = ${math.utils.factorial(5)}`);
    console.log(`2^8 = ${math.utils.power(2, 8)}`);
    console.log(`√16 = ${math.utils.sqrt(16)}`);
    console.log(`17是质数吗? ${math.utils.isPrime(17)}`);
    console.log(`随机数(1-100): ${math.utils.random(1, 100)}`);
    
    console.log('\n数学常数:');
    console.log(`π = ${math.constants.PI}`);
    console.log(`e = ${math.constants.E}`);
    console.log(`黄金比例 = ${math.constants.GOLDEN_RATIO}`);
    
} catch (error) {
    console.error('计算错误:', error.message);
}

// ===============================================
// 6. 模块缓存机制
// ===============================================

console.log('\n💾 === 模块缓存机制 ===\n');

/* 
 * Node.js会缓存已加载的模块
 * require.cache 存储了所有已加载的模块
 */

console.log('已加载的模块数量:', Object.keys(require.cache).length);
console.log('已加载的模块列表(前5个):');
Object.keys(require.cache).slice(0, 5).forEach((modulePath, index) => {
    console.log(`  ${index + 1}. ${path.basename(modulePath)}`);
});

// 清除模块缓存（谨慎使用）
// delete require.cache[require.resolve('./some-module')];

// ===============================================
// 7. ES6 模块系统预览
// ===============================================

console.log('\n🆕 === ES6 模块系统预览 ===\n');

/* 
 * ES6 模块系统（需要在package.json中设置"type": "module"）
 * 使用import/export语法
 * 
 * 导出方式:
 * export { add, subtract };           // 命名导出
 * export default MathUtils;           // 默认导出
 * export const PI = Math.PI;          // 直接导出
 * 
 * 导入方式:
 * import { add, subtract } from './math.js';     // 命名导入
 * import MathUtils from './math.js';             // 默认导入
 * import * as math from './math.js';             // 全量导入
 * import { add as plus } from './math.js';       // 别名导入
 */

console.log('💡 ES6模块系统特点:');
console.log('  1. 静态分析，编译时确定依赖');
console.log('  2. 支持Tree Shaking，优化打包体积');
console.log('  3. 支持循环依赖');
console.log('  4. 内置在语言标准中');
console.log('  5. 与CommonJS有互操作性问题');

// ===============================================
// 8. 模块最佳实践
// ===============================================

console.log('\n✨ === 模块最佳实践 ===\n');

console.log('📝 模块设计原则:');
console.log('  1. 单一职责原则 - 一个模块只做一件事');
console.log('  2. 高内聚低耦合 - 模块内部紧密，模块间松散');
console.log('  3. 接口稳定 - 对外接口保持稳定');
console.log('  4. 文档完善 - 提供清晰的使用说明');
console.log('  5. 错误处理 - 合理处理异常情况');

console.log('\n📁 目录结构建议:');
console.log('  ├── lib/           // 库文件');
console.log('  ├── utils/         // 工具函数');
console.log('  ├── config/        // 配置文件');
console.log('  ├── services/      // 业务服务');
console.log('  └── index.js       // 入口文件');

console.log('\n✅ 模块系统教程完成！');
console.log('💡 下一步: 学习 03-import-modules.js');
