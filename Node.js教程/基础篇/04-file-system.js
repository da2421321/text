/**
 * Node.js 文件系统操作详解
 * 学习目标：掌握同步/异步文件操作、目录操作、文件流
 */

const fs = require('fs');
const path = require('path');

console.log('📁 === Node.js 文件系统操作 ===\n');

// ===============================================
// 1. 同步文件操作
// ===============================================

console.log('⚙️ 同步文件操作:');

const testFile = 'test-demo.txt';
const content = `Node.js 文件系统教程\n创建时间: ${new Date().toISOString()}\n你好，世界！`;

// 检查文件存在
if (!fs.existsSync(testFile)) {
    try {
        fs.writeFileSync(testFile, content, 'utf8');
        console.log(`✅ 文件创建成功: ${testFile}`);
    } catch (error) {
        console.error(`❌ 创建失败:`, error.message);
    }
}

// 读取文件
try {
    const data = fs.readFileSync(testFile, 'utf8');
    console.log('文件内容:', data.substring(0, 50) + '...');
    
    // 获取文件信息
    const stats = fs.statSync(testFile);
    console.log(`文件大小: ${stats.size} 字节`);
    console.log(`是文件: ${stats.isFile()}, 是目录: ${stats.isDirectory()}`);
} catch (error) {
    console.error('读取失败:', error.message);
}

// ===============================================
// 2. 异步文件操作
// ===============================================

console.log('\n🔄 异步文件操作:');

// 异步读取
fs.readFile(testFile, 'utf8', (err, data) => {
    if (err) {
        console.error('❌ 异步读取失败:', err.message);
        return;
    }
    console.log('✅ 异步读取成功，字符数:', data.length);
});

// 异步写入
const asyncFile = 'async-demo.txt';
fs.writeFile(asyncFile, '异步写入的内容', 'utf8', (err) => {
    if (err) {
        console.error('❌ 异步写入失败:', err.message);
        return;
    }
    console.log(`✅ 异步写入成功: ${asyncFile}`);
});

// ===============================================
// 3. Promise 版本
// ===============================================

console.log('\n🎆 Promise API:');

async function promiseDemo() {
    try {
        const promiseFile = 'promise-demo.txt';
        await fs.promises.writeFile(promiseFile, 'Promise 写入内容', 'utf8');
        console.log(`✅ Promise 写入成功: ${promiseFile}`);
        
        const data = await fs.promises.readFile(promiseFile, 'utf8');
        console.log('✅ Promise 读取成功:', data);
    } catch (error) {
        console.error('❌ Promise 操作失败:', error.message);
    }
}

promiseDemo();

// ===============================================
// 4. 目录操作
// ===============================================

console.log('\n📂 目录操作:');

const testDir = 'demo-directory';

// 创建目录
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    console.log(`✅ 目录创建成功: ${testDir}`);
}

// 读取目录
fs.readdir('.', (err, files) => {
    if (err) {
        console.error('❌ 读取目录失败:', err.message);
        return;
    }
    console.log('当前目录文件数量:', files.length);
    console.log('部分文件:', files.slice(0, 5).join(', '));
});

// ===============================================
// 5. 文件流操作
// ===============================================

setTimeout(() => {
    console.log('\n🌊 文件流操作:');
    
    // 创建读取流
    const readStream = fs.createReadStream(testFile, 'utf8');
    console.log('✅ 创建读取流');
    
    readStream.on('data', (chunk) => {
        console.log(`接收数据: ${chunk.length} 字符`);
    });
    
    readStream.on('end', () => {
        console.log('✅ 流读取完成');
    });
    
    // 创建写入流
    const writeStream = fs.createWriteStream('stream-demo.txt');
    writeStream.write('流写入内容\n');
    writeStream.write(`时间: ${new Date()}\n`);
    writeStream.end();
    
    writeStream.on('finish', () => {
        console.log('✅ 流写入完成');
    });
}, 1000);

// ===============================================
// 6. 最佳实践
// ===============================================

setTimeout(() => {
    console.log('\n✨ 最佳实践:');
    console.log('  ✓ 使用try-catch处理错误');
    console.log('  ✓ 大文件使用流操作');
    console.log('  ✓ 使用path模块处理路径');
    console.log('  ✓ 优先使用异步操作');
    
    console.log('\n✅ 文件系统教程完成！');
    console.log('💡 下一步: 学习 05-events.js');
}, 2000);
