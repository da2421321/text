/**
 * Math 工具模块
 * 提供各种数学计算函数
 * 作者: Node.js教程
 * 版本: 1.0.0
 */

// 基本数学运算
const add = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a + b;
};

const subtract = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a - b;
};

const multiply = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a * b;
};

const divide = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    if (b === 0) {
        throw new Error('除数不能为零');
    }
    return a / b;
};

// 高级数学函数
const advanced = {
    // 阶乘
    factorial: (n) => {
        if (n < 0) throw new Error('阶乘不能为负数');
        if (n === 0 || n === 1) return 1;
        return n * advanced.factorial(n - 1);
    },
    
    // 幂运算
    power: (base, exponent) => Math.pow(base, exponent),
    
    // 平方根
    sqrt: (num) => {
        if (num < 0) throw new Error('不能计算负数的平方根');
        return Math.sqrt(num);
    },
    
    // 判断是否为质数
    isPrime: (num) => {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }
};

// 数学常数
const constants = {
    PI: Math.PI,
    E: Math.E,
    GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2
};

// 导出模块
module.exports = {
    add,
    subtract,
    multiply,
    divide,
    advanced,
    constants,
    version: '1.0.0'
};
