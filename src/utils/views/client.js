document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // 'io' 现在已定义，因为 socket.io.js 已先加载
    const loginModal = document.getElementById('loginModal');
    const usernameInput = document.getElementById('usernameInput');
    const joinButton = document.getElementById('joinButton');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const onlineUsers = document.getElementById('onlineUsers');
    
    let username = '';
    
    // 加入聊天室
    joinButton.addEventListener('click', () => {
        username = usernameInput.value.trim();
        if (username) {
            socket.emit('join', username);
            loginModal.style.display = 'none';
            messageInput.focus();
        }
    });
    
    // 按回车键发送消息
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 点击发送按钮
    sendButton.addEventListener('click', sendMessage);
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('sendMessage', message);
            messageInput.value = '';
        }
    }
    
    // 接收消息
    socket.on('message', (data) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (data.user === '系统') {
            messageElement.classList.add('system');
        }
        
        messageElement.innerHTML = `
            <div class="user">${data.user}</div>
            <div class="text">${data.text}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // 更新在线用户列表
    socket.on('updateUsers', (users) => {
        const userCount = Object.keys(users).length;
        onlineUsers.innerHTML = `<span>在线用户: ${userCount}</span>`;
        
        // 可选：显示在线用户列表
        // const usersList = Object.values(users).join(', ');
        // onlineUsers.innerHTML = `<span>在线用户 (${userCount}): ${usersList}</span>`;
    });
    
    // 自动聚焦用户名输入框
    usernameInput.focus();
    
    // 可选：添加离开聊天室的确认
    window.addEventListener('beforeunload', (e) => {
        if (username) {
            e.preventDefault();
            e.returnValue = '确定要离开聊天室吗？';
        }
    });
});