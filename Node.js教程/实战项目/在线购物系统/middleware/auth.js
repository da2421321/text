/**
 * 认证中间件
 * 验证JWT token并获取用户信息
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // 获取token
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '访问被拒绝，请提供有效的认证令牌'
            });
        }
        
        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
        
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 查找用户
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '令牌无效，用户不存在'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: '账户已被禁用'
            });
        }
        
        // 将用户信息添加到请求对象
        req.user = decoded;
        req.userDoc = user;
        
        next();
        
    } catch (error) {
        console.error('认证错误:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '令牌格式错误'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '令牌已过期，请重新登录'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

module.exports = auth;