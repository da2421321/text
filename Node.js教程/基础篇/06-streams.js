const fs = require('fs');
const { Transform } = require('stream');

// 1. 读取流
console.log('=== 读取流 ===');
const readStream = fs.createReadStream('test.txt', { encoding: 'utf8' });

readStream.on('data', (chunk) => {
    console.log('读取到数据块:', chunk);
});

readStream.on('end', () => {
    console.log('读取完成');
});

readStream.on('error', (err) => {
    console.error('读取错误:', err);
});

// 2. 写入流
console.log('\n=== 写入流 ===');
const writeStream = fs.createWriteStream('output.txt');

writeStream.write('第一行数据\n');
writeStream.write('第二行数据\n');
writeStream.end('最后一行数据\n');

writeStream.on('finish', () => {
    console.log('写入完成');
});

// 3. 管道操作
console.log('\n=== 管道操作 ===');
const readStream2 = fs.createReadStream('test.txt');
const writeStream2 = fs.createWriteStream('copy.txt');

readStream2.pipe(writeStream2);

writeStream2.on('finish', () => {
    console.log('文件复制完成');
});

// 4. 转换流
console.log('\n=== 转换流 ===');
const upperCaseTransform = new Transform({
    transform(chunk, encoding, callback) {
        const upperChunk = chunk.toString().toUpperCase();
        callback(null, upperChunk);
    }
});

const readStream3 = fs.createReadStream('test.txt');
const writeStream3 = fs.createWriteStream('uppercase.txt');

readStream3
    .pipe(upperCaseTransform)
    .pipe(writeStream3);

writeStream3.on('finish', () => {
    console.log('转换为大写完成');
});
