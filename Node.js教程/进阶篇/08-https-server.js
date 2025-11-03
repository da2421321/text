const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. 生成自签名证书 (仅用于开发)
const { execSync } = require('child_process');

function generateSelfSignedCert() {
    const keyPath = 'server-key.pem';
    const certPath = 'server-cert.pem';
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.log('生成自签名证书...');
        try {
            execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"`);
            console.log('证书生成成功');
        } catch (error) {
            console.error('证书生成失败:', error.message);
            console.log('请手动生成证书或使用HTTP服务器');
            return null;
        }
    }
    
    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
}

// 2. 创建HTTPS服务器
const sslOptions = generateSelfSignedCert();

if (sslOptions) {
    const server = https.createServer(sslOptions, (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <h1>HTTPS服务器</h1>
            <p>这是一个安全的HTTPS连接</p>
            <p>当前时间: ${new Date().toLocaleString()}</p>
            <script>
                console.log('当前协议:', window.location.protocol);
                console.log('当前主机:', window.location.host);
            </script>
        `);
    });
    
    const PORT = 443;
    server.listen(PORT, () => {
        console.log(`HTTPS服务器运行在 https://localhost:${PORT}`);
        console.log('注意: 浏览器会显示安全警告，点击"高级"->"继续访问"');
    });
} else {
    console.log('无法启动HTTPS服务器，请检查证书配置');
}
