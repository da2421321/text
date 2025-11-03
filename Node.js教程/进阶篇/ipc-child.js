// 子进程文件
process.on('message', (message) => {
    console.log('子进程收到消息:', message);
    
    if (message.type === 'greeting') {
        // 处理问候消息
        const response = {
            type: 'response',
            data: `子进程收到: ${message.message}`,
            timestamp: Date.now()
        };
        
        process.send(response);
    }
});

console.log('子进程启动，PID:', process.pid);

