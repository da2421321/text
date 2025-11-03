const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// 1. Promise化文件操作
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 2. 递归创建目录
async function createDirRecursive(dirPath) {
    try {
        await mkdir(dirPath, { recursive: true });
        console.log(`目录创建成功: ${dirPath}`);
    } catch (error) {
        console.error('创建目录失败:', error.message);
    }
}

// 3. 递归读取目录
async function readDirRecursive(dirPath, level = 0) {
    try {
        const items = await readdir(dirPath);
        const indent = '  '.repeat(level);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await stat(itemPath);
            
            if (stats.isDirectory()) {
                console.log(`${indent}📁 ${item}/`);
                await readDirRecursive(itemPath, level + 1);
            } else {
                console.log(`${indent}📄 ${item} (${stats.size} bytes)`);
            }
        }
    } catch (error) {
        console.error('读取目录失败:', error.message);
    }
}

// 4. 文件监控
function watchFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('文件不存在，正在创建...');
        fs.writeFileSync(filePath, '初始内容\n');
    }
    
    const watcher = fs.watch(filePath, (eventType, filename) => {
        console.log(`文件 ${filename} 发生 ${eventType} 事件`);
        
        if (eventType === 'change') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('读取文件失败:', err);
                    return;
                }
                console.log('文件内容:', data);
            });
        }
    });
    
    console.log(`正在监控文件: ${filePath}`);
    console.log('按 Ctrl+C 停止监控');
    
    // 5秒后停止监控
    setTimeout(() => {
        watcher.close();
        console.log('文件监控已停止');
    }, 30000);
}

// 5. 文件搜索
async function searchFiles(dirPath, searchTerm) {
    try {
        const items = await readdir(dirPath);
        const results = [];
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await stat(itemPath);
            
            if (stats.isDirectory()) {
                const subResults = await searchFiles(itemPath, searchTerm);
                results.push(...subResults);
            } else if (item.includes(searchTerm)) {
                results.push(itemPath);
            }
        }
        
        return results;
    } catch (error) {
        console.error('搜索文件失败:', error.message);
        return [];
    }
}

// 6. 文件备份
async function backupFile(filePath) {
    try {
        const content = await readFile(filePath, 'utf8');
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await writeFile(backupPath, content);
        console.log(`文件备份成功: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error('文件备份失败:', error.message);
        return null;
    }
}

// 7. 批量文件操作
async function batchFileOperations() {
    console.log('=== 批量文件操作 ===');
    
    // 创建测试目录
    await createDirRecursive('test-files');
    
    // 创建测试文件
    const testFiles = ['file1.txt', 'file2.txt', 'file3.txt'];
    for (const file of testFiles) {
        const filePath = path.join('test-files', file);
        await writeFile(filePath, `这是 ${file} 的内容\n创建时间: ${new Date().toISOString()}`);
    }
    
    // 读取目录结构
    console.log('\n目录结构:');
    await readDirRecursive('test-files');
    
    // 搜索文件
    console.log('\n搜索包含 "file2" 的文件:');
    const searchResults = await searchFiles('test-files', 'file2');
    console.log('搜索结果:', searchResults);
    
    // 备份文件
    console.log('\n备份文件:');
    await backupFile(path.join('test-files', 'file1.txt'));
}

// 运行示例
async function main() {
    console.log('=== 文件系统高级操作 ===');
    
    // 批量操作
    await batchFileOperations();
    
    // 文件监控
    console.log('\n=== 文件监控 ===');
    watchFile('watched-file.txt');
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    createDirRecursive,
    readDirRecursive,
    watchFile,
    searchFiles,
    backupFile
};
