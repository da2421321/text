const { spawn, exec, execFile, fork } = require('child_process');
const path = require('path');

// 1. 进程信息
console.log('=== 进程信息 ===');
console.log('进程ID:', process.pid);
console.log('父进程ID:', process.ppid);
console.log('Node.js版本:', process.version);
console.log('平台:', process.platform);
console.log('架构:', process.arch);
console.log('内存使用:', process.memoryUsage());
console.log('CPU使用:', process.cpuUsage());

// 2. 环境变量
console.log('\n=== 环境变量 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PATH:', process.env.PATH?.split(':').slice(0, 3).join(':') + '...');

// 3. 命令行参数
console.log('\n=== 命令行参数 ===');
console.log('参数:', process.argv);
console.log('可执行文件:', process.argv[0]);
console.log('脚本文件:', process.argv[1]);

// 4. 信号处理
process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号，正在退出...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n收到SIGTERM信号，正在退出...');
    process.exit(0);
});

// 5. 未捕获的异常处理
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 6. 子进程 - spawn
function runSpawnExample() {
    console.log('\n=== spawn示例 ===');
    
    // Windows使用dir，Unix使用ls
    const command = process.platform === 'win32' ? 'dir' : 'ls';
    const args = process.platform === 'win32' ? [] : ['-la'];
    
    const child = spawn(command, args, { 
        stdio: 'pipe',
        shell: true 
    });
    
    child.stdout.on('data', (data) => {
        console.log('stdout:', data.toString());
    });
    
    child.stderr.on('data', (data) => {
        console.error('stderr:', data.toString());
    });
    
    child.on('close', (code) => {
        console.log(`子进程退出，代码: ${code}`);
    });
    
    child.on('error', (err) => {
        console.error('子进程错误:', err);
    });
}

// 7. 子进程 - exec
function runExecExample() {
    console.log('\n=== exec示例 ===');
    
    const command = process.platform === 'win32' 
        ? 'echo "Hello from Windows"' 
        : 'echo "Hello from Unix"';
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('执行错误:', error);
            return;
        }
        console.log('输出:', stdout);
        if (stderr) {
            console.error('错误输出:', stderr);
        }
    });
}

// 8. 子进程 - execFile
function runExecFileExample() {
    console.log('\n=== execFile示例 ===');
    
    // 创建一个简单的脚本文件
    const scriptContent = `
console.log('Hello from child process!');
console.log('参数:', process.argv);
process.exit(0);
    `;
    
    const scriptPath = path.join(__dirname, 'child-script.js');
    require('fs').writeFileSync(scriptPath, scriptContent);
    
    execFile('node', [scriptPath, 'arg1', 'arg2'], (error, stdout, stderr) => {
        if (error) {
            console.error('执行错误:', error);
            return;
        }
        console.log('输出:', stdout);
        if (stderr) {
            console.error('错误输出:', stderr);
        }
        
        // 清理临时文件
        require('fs').unlinkSync(scriptPath);
    });
}

// 9. 子进程 - fork
function runForkExample() {
    console.log('\n=== fork示例 ===');
    
    // 创建子进程脚本
    const childScript = `
const { parentPort } = require('worker_threads');

parentPort.on('message', (message) => {
    console.log('子进程收到消息:', message);
    
    // 处理消息
    const result = {
        original: message,
        processed: message.toUpperCase(),
        timestamp: Date.now()
    };
    
    parentPort.postMessage(result);
});

// 发送就绪信号
parentPort.postMessage({ type: 'ready' });
    `;
    
    const childScriptPath = path.join(__dirname, 'child-worker.js');
    require('fs').writeFileSync(childScriptPath, childScript);
    
    const child = fork(childScriptPath);
    
    child.on('message', (message) => {
        if (message.type === 'ready') {
            console.log('子进程已就绪');
            child.send('Hello from parent process!');
        } else {
            console.log('父进程收到消息:', message);
            child.kill();
        }
    });
    
    child.on('exit', (code) => {
        console.log(`子进程退出，代码: ${code}`);
        // 清理临时文件
        require('fs').unlinkSync(childScriptPath);
    });
}

// 10. 进程间通信
function runIPCExample() {
    console.log('\n=== 进程间通信示例 ===');
    
    const child = fork(path.join(__dirname, 'ipc-child.js'));
    
    // 发送消息给子进程
    child.send({ type: 'greeting', message: 'Hello from parent!' });
    
    // 接收子进程消息
    child.on('message', (message) => {
        console.log('父进程收到:', message);
        
        if (message.type === 'response') {
            console.log('子进程响应:', message.data);
            child.kill();
        }
    });
    
    child.on('exit', (code) => {
        console.log(`子进程退出，代码: ${code}`);
    });
}

// 运行所有示例
function runAllExamples() {
    runSpawnExample();
    
    setTimeout(() => {
        runExecExample();
    }, 1000);
    
    setTimeout(() => {
        runExecFileExample();
    }, 2000);
    
    setTimeout(() => {
        runForkExample();
    }, 3000);
    
    setTimeout(() => {
        runIPCExample();
    }, 4000);
}

// 如果直接运行此文件
if (require.main === module) {
    runAllExamples();
}

module.exports = {
    runSpawnExample,
    runExecExample,
    runExecFileExample,
    runForkExample
};
