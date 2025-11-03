/**
 * 订单路由 - 基础版本
 */

const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// 创建订单
router.post('/', auth, (req, res) => {
    res.json({
        success: true,
        message: '创建订单API - 开发中'
    });
});

// 获取订单列表
router.get('/', auth, (req, res) => {
    res.json({
        success: true,
        message: '订单列表API - 开发中',
        data: {
            orders: []
        }
    });
});

module.exports = router;