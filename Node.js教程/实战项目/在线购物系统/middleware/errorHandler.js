/**
 * 错误处理中间件
 */

const errorHandler = (err, req, res, next) => {
    console.error('错误详情:', err);
    
    // 默认错误
    let error = { ...err };
    error.message = err.message;
    
    // Mongoose 验证错误
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: message
        });
    }
    
    // Mongoose 重复键错误
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} 已存在`;
        return res.status(409).json({
            success: false,
            message
        });
    }
    
    // Mongoose 对象ID错误
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: '资源不存在'
        });
    }
    
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || '服务器错误'
    });
};

module.exports = errorHandler;